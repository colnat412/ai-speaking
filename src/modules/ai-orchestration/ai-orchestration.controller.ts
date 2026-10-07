import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import 'multer';
import { AiOrchestrationService } from './ai-orchestration.service';
import { SttService } from '../stt/stt.service';
import { LlmService } from '../llm/llm.service';
import { TtsService } from '../tts/tts.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('ai-orchestration')
export class AiOrchestrationController {
  constructor(
    private readonly aiOrchestrationService: AiOrchestrationService,
    private readonly sttService: SttService,
    private readonly llmService: LlmService,
    private readonly ttsService: TtsService,
  ) {}
}
