import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiOrchestrationService } from './ai-orchestration.service';
import { AiOrchestrationController } from './ai-orchestration.controller';
import { ConversationEntity } from './entities/conversation.entity';
import { SttModule } from '../stt/stt.module';
import { LlmModule } from '../llm/llm.module';
import { TtsModule } from '../tts/tts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationEntity]),
    SttModule,
    LlmModule,
    TtsModule,
  ],
  controllers: [AiOrchestrationController],
  providers: [AiOrchestrationService],
  exports: [AiOrchestrationService],
})
export class AiOrchestrationModule {}
