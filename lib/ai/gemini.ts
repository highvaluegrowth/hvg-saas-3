import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
export const GEMINI_MODEL = 'gemini-2.5-flash';
