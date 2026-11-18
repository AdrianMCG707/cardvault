import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CardsService } from './cards.service';

@Controller('cards')
@UseGuards(ClerkAuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('search')
  search(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const query = q?.trim();
    if (!query) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);
    return this.cardsService.searchPokemon(
      query,
      Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20,
      Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0,
    );
  }
}
