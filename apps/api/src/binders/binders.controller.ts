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
import { BindersService } from './binders.service';

@Controller('binders')
@UseGuards(ClerkAuthGuard)
export class BindersController {
  constructor(private readonly binders: BindersService) {}

  @Post()
  create(
    @ClerkUserId() clerkId: string,
    @Body() body: { name?: unknown; game?: unknown },
  ) {
    return this.binders.create(clerkId, body);
  }

  @Get()
  list(@ClerkUserId() clerkId: string) {
    return this.binders.list(clerkId);
  }

  @Get(':id')
  get(@ClerkUserId() clerkId: string, @Param('id') id: string) {
    return this.binders.get(clerkId, id);
  }

  @Patch(':id')
  rename(
    @ClerkUserId() clerkId: string,
    @Param('id') id: string,
    @Body() body: { name?: unknown },
  ) {
    return this.binders.rename(clerkId, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@ClerkUserId() clerkId: string, @Param('id') id: string) {
    return this.binders.remove(clerkId, id);
  }
}
