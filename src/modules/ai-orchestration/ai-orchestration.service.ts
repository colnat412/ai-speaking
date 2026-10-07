import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';

@Injectable()
export class AiOrchestrationService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
  ) {}

  async saveConversation(data: {
    userId: number;
    userText: string;
    aiResponse: string;
    grammarCorrection?: string;
  }): Promise<ConversationEntity> {
    try {
      const conversation = this.conversationRepo.create({
        userId: data.userId,
        userText: data.userText,
        aiResponse: data.aiResponse,
        grammarCorrection: data.grammarCorrection,
      });
      return await this.conversationRepo.save(conversation);
    } catch (error) {}
  }

  async getHistoryByUser(
    userId: number,
    limit = 20,
  ): Promise<ConversationEntity[]> {
    try {
      return await this.conversationRepo.find({
        where: { userId },
        order: { id: 'DESC' },
        take: limit,
      });
    } catch (error) {}
  }
}
