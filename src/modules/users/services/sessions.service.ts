import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';

export const SESSION_COOKIE = 'sessionId';
export const SESSION_TTL_SECONDS = 3600;

@Injectable()
export class SessionsService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST') ?? 'localhost',
      port: Number(this.config.get<string>('REDIS_PORT') ?? 6379),
    });
  }

  async create(userId: number, login: string): Promise<string> {
    const sessionId = randomUUID();

    await this.redis.hset(this.key(sessionId), {
      userId: String(userId),
      login,
    });
    await this.redis.expire(this.key(sessionId), SESSION_TTL_SECONDS);

    return sessionId;
  }

  async getUserId(sessionId: string): Promise<number | null> {
    const stored = await this.redis.hget(this.key(sessionId), 'userId');

    return stored === null ? null : Number(stored);
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }

  private key(sessionId: string): string {
    return `session:${sessionId}`;
  }
}
