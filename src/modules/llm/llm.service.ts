import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { LlmAnalysisResult } from './types';

@Injectable()
export class LlmService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateResponse(userText: string): Promise<LlmAnalysisResult> {
    try {
      const prompt = `You are a friendly and encouraging native English teacher having a conversation with an English learner.
            The student said: "${userText}"
            Your tasks:
            1. In "grammarCorrection": Analyze the student's sentence. If there are grammatical errors, awkward word choices, or unnatural phrasing, explain briefly and kindly in Vietnamese how to fix it. If the sentence is natural and correct, say "Câu nói của bạn rất chuẩn và tự nhiên!".
            2. In "response": Give a natural, conversational response in English (1-2 sentences) to continue the discussion and keep the conversation going.
            Respond ONLY with a valid JSON object matching this schema:
            {
            "grammarCorrection": string,
            "response": string
        }`;

      const result = await this.ai.models?.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = result?.text || '{}';
      const parsedData = JSON.parse(responseText);

      return {
        grammarCorrection: parsedData.grammarCorrection || '',
        response: parsedData.response || '',
      };
    } catch (error) {
      throw new Error('Failed to generate response.');
    }
  }
}
