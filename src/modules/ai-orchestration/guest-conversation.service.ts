import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { RedisService } from '../../common/redis/redis.service';
import type { DialogueTurn } from '../llm/types';
import { PracticeSessionService } from './practice/practice-session.service';
import type { GuestActor } from './practice/types';
import type { SaveConversationInput, StoredGuestTurn } from './types';

// Lua script
const APPEND_TURN_SCRIPT = `
  local ttl = redis.call('PTTL', KEYS[1])

  if ttl == -1 then
    return -1
  end

  if ttl <= 0 then
    return 0
  end

  redis.call('RPUSH', KEYS[2], ARGV[1])
  redis.call('PEXPIRE', KEYS[2], ttl)

  return 1
`;

@Injectable()
export class GuestConversationService {
  constructor(
    private readonly redis: RedisService,
    private readonly sessions: PracticeSessionService,
  ) {}

  async saveTurn(
    actor: GuestActor,
    sessionId: string,
    input: SaveConversationInput,
  ): Promise<StoredGuestTurn> {
    await this.sessions.getOwnedSession(actor, sessionId);

    const userText = input.userText.trim();
    const aiResponse = input.aiResponse.trim();

    if (!userText || !aiResponse) {
      throw new BadRequestException(
        'A completed turn requires learner text and AI response',
      );
    }

    const turn: StoredGuestTurn = {
      id: randomUUID(),
      userText,
      aiResponse,
      grammarCorrection: input.grammarCorrection.trim(),
      createdAt: new Date().toISOString(),
    };

    const sessionKey = this.sessionKey(actor.guestId, sessionId);

    const result = await this.redis.redisClient.eval(
      APPEND_TURN_SCRIPT,
      2,
      sessionKey,
      `${sessionKey}:turns`,
      JSON.stringify(turn),
    );

    if (result === -1) {
      throw new InternalServerErrorException(
        'Guest session expiration is not configured',
      );
    }

    if (result !== 1) {
      throw new NotFoundException('Practice session has expired');
    }

    return turn;
  }

  async getRecentTurns(
    actor: GuestActor,
    sessionId: string,
  ): Promise<DialogueTurn[]> {
    await this.sessions.getOwnedSession(actor, sessionId);

    const sessionKey = this.sessionKey(actor.guestId, sessionId);

    const rows = await this.redis.redisClient.lrange(
      `${sessionKey}:turns`,
      -10,
      -1,
    );

    return rows.map((row) => this.parseTurn(row));
  }

  private sessionKey(guestId: string, sessionId: string): string {
    return `ai-speaking:guest:${guestId}:session:${sessionId}`;
  }

  private parseTurn(raw: string): DialogueTurn {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new InternalServerErrorException(
        'Stored conversation is not valid JSON',
      );
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new InternalServerErrorException(
        'Stored conversation has an invalid structure',
      );
    }

    const turn = parsed as Record<string, unknown>;

    if (
      typeof turn.userText !== 'string' ||
      !turn.userText.trim() ||
      typeof turn.aiResponse !== 'string' ||
      !turn.aiResponse.trim()
    ) {
      throw new InternalServerErrorException(
        'Stored conversation is missing required content',
      );
    }

    return {
      userText: turn.userText,
      aiResponse: turn.aiResponse,
    };
  }
}
