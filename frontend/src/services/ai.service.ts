
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai: GoogleGenAI | null = null;
  
  constructor() {
    // IMPORTANT: In a real application, the API key should be stored securely and not hardcoded.
    // This assumes `process.env.API_KEY` is set in the environment.
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.error("API Key for Google GenAI is not configured.");
    }
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.ai) {
      return "خدمة الذكاء الاصطناعي غير مهيأة. يرجى التحقق من مفتاح API.";
    }

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined
      });
      return response.text;
    } catch (error) {
      console.error('Error generating text with Gemini:', error);
      return 'عذراً، حدث خطأ أثناء التواصل مع مساعد الذكاء الاصطناعي.';
    }
  }
}
