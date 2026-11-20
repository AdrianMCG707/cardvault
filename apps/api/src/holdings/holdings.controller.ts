import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { ClerkUserId } from '../auth/clerk-user-id.decorator';
import { HoldingsService } from './holdings.service';

@Controller('binders/:binderId/holdings')
@UseGuards(ClerkAuthGuard)
export class HoldingsController {
  constructor(private readonly holdings: HoldingsService) {}

  @Post()
  add(
    @ClerkUserId() clerkId: string,
    @Param('binderId') binderId: string,
    @Body()
    body: {
      externalId?: unknown;
      variantId?: unknown;
      quantity?: unknown;
      acquiredPrice?: unknown;
    },
  ) {
    return this.holdings.add(clerkId, binderId, body);
  }

  @Get()
  list(@ClerkUserId() clerkId: string, @Param('binderId') binderId: string) {
    return this.holdings.list(clerkId, binderId);
  }

  @Patch(':holdingId')
  update(
    @ClerkUserId() clerkId: string,
    @Param('binderId') binderId: string,
    @Param('holdingId') holdingId: string,
    @Body() body: { quantity?: unknown; acquiredPrice?: unknown },
  ) {
    return this.holdings.update(clerkId, binderId, holdingId, body);
  }

  @Delete(':holdingId')
  @HttpCode(204)
  remove(
    @ClerkUserId() clerkId: string,
    @Param('binderId') binderId: string,
    @Param('holdingId') holdingId: string,
  ) {
    return this.holdings.remove(clerkId, binderId, holdingId);
  }
}
