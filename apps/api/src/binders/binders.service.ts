import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Game } from '../../generated/prisma/enums';

@Injectable()
export class BindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  private parseName(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException('name must be a non-empty string');
    }
    return value.trim();
  }

  private parseGame(value: unknown): Game {
    if (!Object.values(Game).includes(value as Game)) {
      throw new BadRequestException(
        `game must be one of: ${Object.values(Game).join(', ')}`,
      );
    }
    return value as Game;
  }

  private async findOwned(clerkId: string, binderId: string) {
    const user = await this.users.findOrCreateByClerkId(clerkId);
    const binder = await this.prisma.binder.findFirst({
      where: { id: binderId, userId: user.id },
    });
    if (!binder) {
      throw new NotFoundException('Binder not found');
    }
    return binder;
  }

  async create(clerkId: string, body: { name?: unknown; game?: unknown }) {
    const user = await this.users.findOrCreateByClerkId(clerkId);
    return this.prisma.binder.create({
      data: {
        userId: user.id,
        name: this.parseName(body.name),
        game: this.parseGame(body.game),
      },
    });
  }

  async list(clerkId: string) {
    const user = await this.users.findOrCreateByClerkId(clerkId);
    return this.prisma.binder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(clerkId: string, binderId: string) {
    return this.findOwned(clerkId, binderId);
  }

  async rename(clerkId: string, binderId: string, body: { name?: unknown }) {
    await this.findOwned(clerkId, binderId);
    return this.prisma.binder.update({
      where: { id: binderId },
      data: { name: this.parseName(body.name) },
    });
  }

  async remove(clerkId: string, binderId: string) {
    await this.findOwned(clerkId, binderId);
    await this.prisma.$transaction([
      this.prisma.holding.deleteMany({ where: { binderId } }),
      this.prisma.binder.delete({ where: { id: binderId } }),
    ]);
  }
}
