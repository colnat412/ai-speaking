import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { GuestActor } from './types/index';
import { RedisService } from '../../../common/redis/redis.service';

@Injectable()
export class PracticeActorService {
  private readonly cookieName = 'practice_guest';
  private readonly ttlSeconds: number;

  constructor(private readonly redis: RedisService) {
    const ttl = Number(process.env.GUEST_IDENTITY_TTL_SECONDS ?? 86400);

    if (!Number.isSafeInteger(ttl) || ttl <= 0) {
      throw new Error('GUEST_IDENTITY_TTL_SECONDS must be a positive integer');
    }

    this.ttlSeconds = ttl;
  }

  // User auth by jwt, this one just handle guest
  async resolveGuest(
    request: Request,
    response: Response,
    allowCreate: boolean,
  ): Promise<GuestActor> {
    const guestId: unknown = request.cookies?.[this.cookieName];

    // Cookie là input từ client: kiểm tra kiểu và UUID trước khi tra Redis.
    if (
      typeof guestId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        guestId,
      )
    ) {
      const exists = await this.redis.redisClient.exists(
        this.identityKey(guestId),
      );
      if (exists) return { kind: 'guest', guestId };
    }

    if (!allowCreate) {
      throw new UnauthorizedException('Guest identity is missing or expired');
    }

    const newGuestId = randomUUID();
    await this.redis.redisClient.set(
      this.identityKey(newGuestId),
      '1',
      'EX',
      this.ttlSeconds,
    );

    response.cookie(this.cookieName, newGuestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/practice-sessions',
      maxAge: this.ttlSeconds * 1000,
    });

    return { kind: 'guest', guestId: newGuestId };
  }

  private identityKey(guestId: string): string {
    return `ai-speaking:guest-identity:${guestId}`;
  }
}
