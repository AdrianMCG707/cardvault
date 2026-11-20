import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CardsService } from '../cards/cards.service';
import { Game } from '../../generated/prisma/enums';

@Injectable()
export class HoldingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly cards: CardsService,
  ) {}

  private parseString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${field} must be a non-empty string`);
    }
    return value.trim();
  }

  private parseQuantity(value: unknown): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
      throw new BadRequestException(
        'quantity must be a whole number of at least 1',
      );
    }
    return value;
  }

  private parsePrice(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new BadRequestException(
        'acquiredPrice must be a number of 0 or more',
      );
    }
    return value;
  }

  private async ownedBinder(clerkId: string, binderId: string) {
    const user = await this.users.findOrCreateByClerkId(clerkId);
    const binder = await this.prisma.binder.findFirst({
      where: { id: binderId, userId: user.id },
    });
    if (!binder) {
      throw new NotFoundException('Binder not found');
    }
    return binder;
  }

  private async ownedHolding(
    clerkId: string,
    binderId: string,
    holdingId: string,
  ) {
    const user = await this.users.findOrCreateByClerkId(clerkId);
    const holding = await this.prisma.holding.findFirst({
      where: { id: holdingId, binderId, binder: { userId: user.id } },
    });
    if (!holding) {
      throw new NotFoundException('Holding not found');
    }
    return holding;
  }

  async add(
    clerkId: string,
    binderId: string,
    body: {
      externalId?: unknown;
      variantId?: unknown;
      quantity?: unknown;
      acquiredPrice?: unknown;
    },
  ) {
    const binder = await this.ownedBinder(clerkId, binderId);
    const externalId = this.parseString(body.externalId, 'externalId');
    const variantId = this.parseString(body.variantId, 'variantId');
    const quantity = this.parseQuantity(body.quantity ?? 1);
    const explicitPrice =
      body.acquiredPrice === undefined
        ? undefined
        : this.parsePrice(body.acquiredPrice);

    if (binder.game !== Game.POKEMON) {
      throw new BadRequestException(
        'Only Pokemon binders are supported right now',
      );
    }

    const card = await this.cards.getCardById(externalId);
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    const variant = card.variants.find((v) => v.variantId === variantId);
    if (!variant) {
      throw new BadRequestException('variantId does not belong to that card');
    }

    const acquiredPrice = explicitPrice ?? variant.price;
    if (acquiredPrice === null) {
      throw new BadRequestException(
        'This variant has no current price; supply acquiredPrice',
      );
    }

    const cardRow = await this.prisma.card.upsert({
      where: {
        game_externalId: { game: Game.POKEMON, externalId: card.externalId },
      },
      update: {
        name: card.name,
        rarity: card.rarity ?? 'Unknown',
        setId: card.setId,
        setName: card.setName,
        number: card.number,
      },
      create: {
        game: Game.POKEMON,
        externalId: card.externalId,
        name: card.name,
        rarity: card.rarity ?? 'Unknown',
        setId: card.setId,
        setName: card.setName,
        number: card.number,
      },
    });

    return this.prisma.holding.create({
      data: {
        binderId: binder.id,
        cardId: cardRow.id,
        variantId,
        condition: variant.condition,
        printing: variant.printing,
        quantity,
        acquiredPrice,
      },
      include: { card: true },
    });
  }

  async list(clerkId: string, binderId: string) {
    await this.ownedBinder(clerkId, binderId);
    return this.prisma.holding.findMany({
      where: { binderId },
      include: { card: true },
      orderBy: { addedAt: 'desc' },
    });
  }

  async update(
    clerkId: string,
    binderId: string,
    holdingId: string,
    body: { quantity?: unknown; acquiredPrice?: unknown },
  ) {
    await this.ownedHolding(clerkId, binderId, holdingId);
    const data: { quantity?: number; acquiredPrice?: number } = {};
    if (body.quantity !== undefined) {
      data.quantity = this.parseQuantity(body.quantity);
    }
    if (body.acquiredPrice !== undefined) {
      data.acquiredPrice = this.parsePrice(body.acquiredPrice);
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Provide quantity or acquiredPrice');
    }
    return this.prisma.holding.update({
      where: { id: holdingId },
      data,
      include: { card: true },
    });
  }

  async remove(clerkId: string, binderId: string, holdingId: string) {
    await this.ownedHolding(clerkId, binderId, holdingId);
    await this.prisma.holding.delete({ where: { id: holdingId } });
  }
}
