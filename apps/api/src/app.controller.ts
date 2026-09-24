import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from './auth/clerk-auth.guard';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  
@UseGuards(ClerkAuthGuard)
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
