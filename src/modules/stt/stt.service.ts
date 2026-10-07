import { Injectable } from '@nestjs/common';
import { DeepgramClient } from '@deepgram/sdk';

@Injectable()
export class SttService {
  private deepgram: DeepgramClient;

  constructor() {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramApiKey) {
      throw new Error('DEEPGRAM_API_KEY is not defined');
    }

    this.deepgram = new DeepgramClient({ apiKey: deepgramApiKey });
  }

  async transcribeAudio(
    audioBuffer: Buffer,
    mimetype?: string,
  ): Promise<string> {
    try {
      // handle Pre-recorded Audio
      const result = await this.deepgram.listen.v1.media.transcribeFile(
        audioBuffer,
        {
          model: 'nova-2',
          smart_format: true, // Detect first letter of sentences, add commas and periods,...
        },
      );

      let transcript = '';
      if ('results' in result) {
        // TypeScript auto reach `result` is `ListenV1Response` type
        transcript =
          result.results.channels?.[0]?.alternatives?.[0]?.transcript || '';
      }
      return transcript;
    } catch (error) {
      throw new Error('Failed to transcribe audio.');
    }
  }
}
