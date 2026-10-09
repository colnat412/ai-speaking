import { PracticeLevelEnum } from '../../../config/enums/ai-orchestration.enum';

export interface LlmAnalysisResult {
  grammarCorrection: string;
  response: string;
}

export interface DialogueTurn {
  userText: string;
  aiResponse: string;
}

export interface GenerateDialogueInput {
  topic: string;
  level: PracticeLevelEnum;
  // the completed turns
  history: DialogueTurn[];
  // current sentence
  userText: string;
}

export interface LlmAnalysisResult {
  grammarCorrection: string;
  response: string;
}

export interface TurnAudioInput {
  buffer: Buffer;
  mimeType: string;
}

export interface ProcessTurnResult {
  turnId: string;
  userText: string;
  aiResponse: string;
  grammarCorrection: string;
  audioStatus: 'ready' | 'unavailable';
  audioBase64: string | null;
  audioMimeType: 'audio/mpeg' | null;
}
