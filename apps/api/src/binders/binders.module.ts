import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { BindersService } from './binders.service';
import { BindersController } from './binders.controller';

@Module({
  imports: [UsersModule],
  providers: [BindersService],
  controllers: [BindersController],
})
export class BindersModule {}
