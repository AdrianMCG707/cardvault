import { Injectable } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateByClerkId(clerkId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { authProviderId: clerkId },
    });
    if (existing) {
      return existing;
    }

    const clerkUser = await this.clerk.users.getUser(clerkId);
    const primary = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    );
    const email = (primary ?? clerkUser.emailAddresses[0])?.emailAddress;
    if (!email) {
      throw new Error(`Clerk user ${clerkId} has no email address`);
    }

    return this.prisma.user.upsert({
      where: { authProviderId: clerkId },
      update: {},
      create: { authProviderId: clerkId, email },
    });
  }
}
