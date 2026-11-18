import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

interface RequestWithSub extends Request {
  auth?: { sub?: string };
}

export const ClerkUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<RequestWithSub>();
    const sub = request.auth?.sub;
    if (!sub) {
      throw new UnauthorizedException('No authenticated user');
    }
    return sub;
  },
);
