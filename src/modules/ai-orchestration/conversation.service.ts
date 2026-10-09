import { InjectRepository } from '@nestjs/typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { Repository } from 'typeorm';
import { PracticeSessionService } from './practice/practice-session.service';
import { HashidsService } from '../../common/hashids/hashids.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserActor } from './practice/types';
import { SaveConversationInput } from './types';
import { DialogueTurn } from '../llm/types';
import { TrueFalseEnum } from '../../config/enums/common.enum';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    private readonly sessions: PracticeSessionService,
    private readonly hashids: HashidsService,
  ) {}

  async saveTurn(
    actor: UserActor,
    publicSessionId: string,
    input: SaveConversationInput,
  ) {
    const dbsSessionId = await this.getOwnedDatabaseId(actor, publicSessionId);

    const userText = input.userText.trim();
    const aiResponse = input.aiResponse.trim();

    if (!userText || !aiResponse) {
      throw new BadRequestException(
        'A completed turn requires learner text and AI response',
      );
    }

    const conversation = this.conversationRepo.create({
      userId: Number(actor.userId),
      sessionId: dbsSessionId,
      userText,
      aiResponse,
      grammarCorrection: input.grammarCorrection.trim(),
    });

    return this.conversationRepo.save(conversation);
  }

  async getRecentTurns(
    actor: UserActor,
    publicSessionId: string,
  ): Promise<DialogueTurn[]> {
    const databaseSessionId = await this.getOwnedDatabaseId(
      actor,
      publicSessionId,
    );

    const rows = await this.conversationRepo.find({
      where: {
        sessionId: databaseSessionId,
        userId: Number(actor.userId),
        isDel: TrueFalseEnum.FALSE,
      },
      order: { id: 'DESC' },
      take: 10,
    });

    return rows.reverse().map((row) => ({
      userText: row.userText,
      aiResponse: row.aiResponse,
    }));
  }

  private async getOwnedDatabaseId(
    actor: UserActor,
    publicSessionId: string,
  ): Promise<string> {
    await this.sessions.getOwnedSession(actor, publicSessionId);

    const databaseId = this.hashids.decodeDatabaseId(publicSessionId);

    if (!databaseId) {
      throw new NotFoundException('Practice session not found');
    }

    return databaseId;
  }
}
