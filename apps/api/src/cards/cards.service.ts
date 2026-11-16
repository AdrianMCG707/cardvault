import { Injectable, Logger } from '@nestjs/common';
import { JustTCG } from 'justtcg-js';

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

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);
  private readonly client = new JustTCG();

  async searchPokemon(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<CardSearchResult> {
    const safeLimit = Math.min(Math.max(limit, 1), 20);

    const res = await this.client.v1.cards.get({
      query,
      game: 'pokemon',
      limit: safeLimit,
      offset,
    });

    if (res.usage) {
      this.logger.log(
        `JustTCG usage: ${res.usage.apiRequestsUsed}/${res.usage.apiRequestLimit} monthly, ` +
          `${res.usage.apiDailyRequestsUsed}/${res.usage.apiDailyLimit} daily`,
      );
    }

    return {
      cards: res.data.map((card) => ({
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
      })),
      total: res.pagination?.total ?? res.data.length,
      limit: res.pagination?.limit ?? safeLimit,
      offset: res.pagination?.offset ?? offset,
      hasMore: res.pagination?.hasMore ?? false,
    };
  }
}