import { Injectable } from '@nestjs/common';
import { ElevenLabsClient } from 'elevenlabs';

@Injectable()
export class TtsService {
  private elevenlabs: ElevenLabsClient;
  private readonly defaultVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel's voice ID

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not defined');
    }
    this.elevenlabs = new ElevenLabsClient({ apiKey });
  }

  async generateAudio(text: string, voiceId?: string): Promise<Buffer> {
    try {
      const audioStream = await this.elevenlabs.textToSpeech.convert(
        voiceId || this.defaultVoiceId,
        {
          text: text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
        },
      );

      const chunks: Buffer[] = [];
      for await (const c of audioStream) {
        chunks.push(c);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      throw new Error('Failed to generate audio.');
    }
  }
}
