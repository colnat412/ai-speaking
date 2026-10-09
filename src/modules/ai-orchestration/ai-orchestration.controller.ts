import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import 'multer';
import { AiOrchestrationService } from './ai-orchestration.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { PracticeActorService } from './practice/practice-actor.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { PracticeActor, PracticeSession } from './practice/types';
import { PracticeSessionService } from './practice/practice-session.service';
import { CreatePracticeSessionDto } from './practice/dto/create-practice-session.dto';
import type { Request, Response } from 'express';
import { OptionalAuth } from '../auth/decorators/public.decorator';

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
]);

@OptionalAuth()
@Controller('practice-sessions')
export class AiOrchestrationController {
  constructor(
    private readonly aiOrchestrationService: AiOrchestrationService,
    private readonly practiceActorService: PracticeActorService,
    private readonly practiceSessionService: PracticeSessionService,
  ) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async createSession(
    @CurrentUser() user: AuthenticatedUser | null,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() input: CreatePracticeSessionDto,
  ) {
    const actor: PracticeActor = user
      ? { kind: 'user', userId: user.userId }
      : await this.practiceActorService.resolveGuest(request, response, true);

    return this.toSessionResponse(
      await this.practiceSessionService.createSession(actor, input),
    );
  }

  @Get(':id')
  async getSession(
    @CurrentUser() user: AuthenticatedUser | null,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('id') sessionId: string,
  ) {
    const actor: PracticeActor = user
      ? { kind: 'user', userId: user.userId }
      : await this.practiceActorService.resolveGuest(request, response, false);

    return this.toSessionResponse(
      await this.practiceSessionService.getOwnedSession(actor, sessionId),
    );
  }

  @Post(':id/turns')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: MAX_AUDIO_BYTES,
        files: 1,
        fields: 0,
        parts: 1,
      },
      fileFilter: (_request, file, callback) => {
        const mimeType = file.mimetype.split(';')[0].trim().toLowerCase();

        if (!ALLOWED_AUDIO_TYPES.has(mimeType)) {
          return callback(
            new BadRequestException('Unsupported audio content type'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async createTurn(
    @CurrentUser() user: AuthenticatedUser | null,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('id') sessionId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('An audio file is required');
    }

    const actor: PracticeActor = user
      ? {
          kind: 'user',
          userId: user.userId,
        }
      : await this.practiceActorService.resolveGuest(request, response, false);

    return this.aiOrchestrationService.processTurn(actor, sessionId, {
      buffer: file.buffer,
      mimeType: file.mimetype,
    });
  }

  private toSessionResponse(session: PracticeSession) {
    return {
      id: session.id,
      mode: session.actor.kind,
      topic: session.topic,
      level: session.level,
      createdAt: session.createdAt,
    };
  }
}
