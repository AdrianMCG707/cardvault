import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { JustTCG } from 'justtcg-js';
import { Redis } from 'ioredis';

export interface VariantSummary {
  variantId: string;
  condition: string;
  printing: string;
  price: number | null;
}

export interface CardSummary {
  externalId: string;
  name: string;
  setId: string;
  setName: string;
  number: string | null;
  rarity: string | null;
  variants: VariantSummary[];
}

export interface CardSearchResult {
  cards: CardSummary[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

type SdkResponse = Awaited<ReturnType<JustTCG['v1']['cards']['get']>>;
type SdkCard = SdkResponse['data'][number];

const CACHE_TTL_SECONDS = 6 * 60 * 60;

@Injectable()
export class CardsService implements OnModuleDestroy {
  private readonly logger = new Logger(CardsService.name);
  private readonly client = new JustTCG();
  private readonly redis = new Redis(
    process.env.REDIS_URL ?? 'redis://localhost:6379',
    { maxRetriesPerRequest: 1 },
  );

  constructor() {
    this.redis.on('error', (err: Error) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async searchPokemon(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<CardSearchResult> {
    const safeLimit = Math.min(Math.max(limit, 1), 20);
    const cacheKey = `cards:search:pokemon:${query.toLowerCase()}:${safeLimit}:${offset}`;

    const cached = await this.readCache<CardSearchResult>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit: ${cacheKey}`);
      return cached;
    }
    this.logger.log(`Cache miss: ${cacheKey}`);

    const res = await this.client.v1.cards.get({
      query,
      game: 'pokemon',
      limit: safeLimit,
      offset,
    });
    this.logUsage(res.usage);

    const result: CardSearchResult = {
      cards: res.data.map((card) => this.toSummary(card)),
      total: res.pagination?.total ?? res.data.length,
      limit: res.pagination?.limit ?? safeLimit,
      offset: res.pagination?.offset ?? offset,
      hasMore: res.pagination?.hasMore ?? false,
    };

    await this.writeCache(cacheKey, result);
    return result;
  }

  async getCardById(externalId: string): Promise<CardSummary | null> {
    const cacheKey = `cards:card:${externalId}`;

    const cached = await this.readCache<CardSummary>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit: ${cacheKey}`);
      return cached;
    }
    this.logger.log(`Cache miss: ${cacheKey}`);

    const res = await this.client.v1.cards.get({ cardId: externalId });
    this.logUsage(res.usage);

    const found = res.data[0];
    if (!found || String(found.game).toLowerCase() !== 'pokemon') {
      return null;
    }

    const summary = this.toSummary(found);
    await this.writeCache(cacheKey, summary);
    return summary;
  }

  private toSummary(card: SdkCard): CardSummary {
    return {
      externalId: card.id,
      name: card.name,
      setId: card.set,
      setName: card.set_name ?? card.set,
      number: card.number ?? null,
      rarity: card.rarity ?? null,
      variants: card.variants.map((v) => ({
        variantId: v.id,
        condition: v.condition,
        printing: v.printing,
        price: v.price ?? null,
      })),
    };
  }

  private logUsage(usage: SdkResponse['usage']) {
    if (!usage) {
      return;
    }
    this.logger.log(
      `JustTCG usage: ${usage.apiRequestsUsed}/${usage.apiRequestLimit} monthly, ` +
        `${usage.apiDailyRequestsUsed}/${usage.apiDailyLimit} daily`,
    );
  }

  private async readCache<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      this.logger.warn(
        `Cache read failed, falling back to API: ${String(err)}`,
      );
      return null;
    }
  }

  private async writeCache(key: string, value: unknown) {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
    } catch (err) {
      this.logger.warn(`Cache write failed: ${String(err)}`);
    }
  }
}
