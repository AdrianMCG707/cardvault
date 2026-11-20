import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CardsModule } from './cards/cards.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BindersModule } from './binders/binders.module';
import { HoldingsModule } from './holdings/holdings.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CardsModule,
    PrismaModule,
    UsersModule,
    BindersModule,
    HoldingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
