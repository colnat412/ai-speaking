import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { PracticeSessionService } from './practice/practice-session.service';
import { ConversationService } from './conversation.service';
import { GuestConversationService } from './guest-conversation.service';
import { SttService } from '../stt/stt.service';
import { LlmService } from '../llm/llm.service';
import { TtsService } from '../tts/tts.service';
import { HashidsService } from '../../common/hashids/hashids.service';
import { PracticeActor } from './practice/types';
import { TurnAudioInput } from '../llm/types';
import { SaveConversationInput } from './types';

@Injectable()
export class AiOrchestrationService {
  private readonly logger = new Logger(AiOrchestrationService.name);

  constructor(
    private readonly practiceSessionService: PracticeSessionService,
    private readonly conversationService: ConversationService,
    private readonly guestConversationService: GuestConversationService,
    private readonly sttService: SttService,
    private readonly llmService: LlmService,
    private readonly ttsService: TtsService,
    private readonly hashids: HashidsService,
  ) {}

  async processTurn(
    actor: PracticeActor,
    publicSessionId: string,
    audio: TurnAudioInput,
  ) {
    if (!audio.buffer?.length) {
      throw new BadRequestException('Audio is empty');
    }

    const session = await this.practiceSessionService.getOwnedSession(
      actor,
      publicSessionId,
    );

    const history =
      actor.kind === 'user'
        ? await this.conversationService.getRecentTurns(actor, publicSessionId)
        : await this.guestConversationService.getRecentTurns(
            actor,
            publicSessionId,
          );

    const transcript = (
      await this.sttService.transcribeAudio(audio.buffer, audio.mimeType)
    ).trim();

    if (!transcript) {
      throw new BadRequestException(
        'No speech was recognized. Please record again.',
      );
    }

    const analysis = await this.llmService.generateResponse({
      topic: session.topic,
      history,
      level: session.level,
      userText: transcript,
    });

    const turnData: SaveConversationInput = {
      userText: transcript,
      aiResponse: analysis.response,
      grammarCorrection: analysis.grammarCorrection,
    };

    let turnId: string;

    if (actor.kind === 'user') {
      const saved = await this.conversationService.saveTurn(
        actor,
        publicSessionId,
        turnData,
      );

      turnId = this.hashids.encodeDatabaseId(String(saved.id));
    } else {
      const saved = await this.guestConversationService.saveTurn(
        actor,
        publicSessionId,
        turnData,
      );

      turnId = saved.id;
    }

    let audioBuffer: Buffer | null = null;

    try {
      const generatedAudio = await this.ttsService.generateAudio(
        analysis.response,
      );

      if (generatedAudio.length > 0) {
        audioBuffer = generatedAudio;
      } else {
        this.logger.warn('TTS returned empty audio');
      }
    } catch {
      this.logger.warn('TTS failed after the conversation turn was saved');
    }

    return {
      turnId,
      userText: transcript,
      aiResponse: analysis.response,
      grammarCorrection: analysis.grammarCorrection,
      audioStatus: audioBuffer ? 'ready' : 'unavailable',
      audioBase64: audioBuffer ? audioBuffer.toString('base64') : null,
      audioMimeType: audioBuffer ? 'audio/mpeg' : null,
    };
  }
}
