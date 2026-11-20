import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CardsModule } from '../cards/cards.module';
import { HoldingsService } from './holdings.service';
import { HoldingsController } from './holdings.controller';

@Module({
  imports: [UsersModule, CardsModule],
  providers: [HoldingsService],
  controllers: [HoldingsController],
})
export class HoldingsModule {}
