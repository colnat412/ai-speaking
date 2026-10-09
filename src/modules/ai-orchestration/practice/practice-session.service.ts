import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PracticeSessionEntity } from './entities/practice-session.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '../../../common/redis/redis.service';
import { Repository } from 'typeorm';
import { HashidsService } from '../../../common/hashids/hashids.service';
import {
  CreatePracticeSessionInput,
  PracticeActor,
  PracticeSession,
  UserActor,
} from './types/index';
import { PracticeLevelEnum } from '../../../config/enums/ai-orchestration.enum';
import { randomUUID } from 'crypto';
import { TrueFalseEnum } from '../../../config/enums/common.enum';

@Injectable()
export class PracticeSessionService {
  private readonly guestTtlSeconds: number;
  constructor(
    @InjectRepository(PracticeSessionEntity)
    private readonly sessionRepo: Repository<PracticeSessionEntity>,
    private readonly redis: RedisService,
    private readonly hashids: HashidsService,
  ) {
    const ttl = Number(process.env.GUEST_PRACTICE_TTL_SECONDS ?? 3600);

    if (!Number.isSafeInteger(ttl) || ttl <= 0) {
      throw new Error('GUEST_PRACTICE_TTL_SECONDS must be a positive integer');
    }

    this.guestTtlSeconds = ttl;
  }

  async createSession(
    actor: PracticeActor,
    input: CreatePracticeSessionInput,
  ): Promise<PracticeSession> {
    const topic = input.topic.trim();

    if (!topic || topic.length > 200) {
      throw new BadRequestException(
        'Topic must contain 200 characters maximum',
      );
    }

    if (!Object.values(PracticeLevelEnum).includes(input.level)) {
      throw new BadRequestException('Invalid practice level');
    }

    if (actor.kind === 'guest') {
      const session: PracticeSession = {
        id: randomUUID(),
        actor,
        topic,
        level: input.level,
        createdAt: new Date().toISOString(),
      };

      await this.redis.redisClient.set(
        this.guestKey(actor.guestId, session.id),
        JSON.stringify(session),
        'EX',
        this.guestTtlSeconds,
      );

      return session;
    }

    const entity = this.sessionRepo.create({
      userId: actor.userId,
      topic,
      level: input.level,
    });

    const saved = await this.sessionRepo.save(entity);

    return this.toSession(saved, actor);
  }

  async getOwnedSession(
    actor: PracticeActor,
    publicSessionId: string,
  ): Promise<PracticeSession> {
    if (actor.kind === 'guest') {
      const raw = await this.redis.redisClient.get(
        this.guestKey(actor.guestId, publicSessionId),
      );

      if (!raw) {
        throw new NotFoundException('Practice session not found');
      }

      const session = JSON.parse(raw) as PracticeSession;

      if (
        session.id !== publicSessionId ||
        session.actor.kind !== 'guest' ||
        session.actor.guestId !== actor.guestId
      ) {
        throw new NotFoundException('Practice session not found');
      }

      return session;
    }

    const databaseId = this.hashids.decodeDatabaseId(publicSessionId);

    if (!databaseId) {
      throw new NotFoundException('Practice session not found');
    }

    const session = await this.sessionRepo.findOne({
      where: {
        id: databaseId,
        userId: actor.userId,
        isDel: TrueFalseEnum.FALSE,
      },
    });

    if (!session) {
      throw new NotFoundException('Practice session not found');
    }

    return this.toSession(session, actor);
  }

  private guestKey(guestId: string, sessionId: string): string {
    return `ai-speaking:guest:${guestId}:session:${sessionId}`;
  }

  private toSession(
    entity: PracticeSessionEntity,
    actor: UserActor,
  ): PracticeSession {
    return {
      id: this.hashids.encodeDatabaseId(String(entity.id)),
      actor,
      topic: entity.topic,
      level: entity.level,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
