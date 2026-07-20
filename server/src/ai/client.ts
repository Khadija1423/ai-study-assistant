import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('GEMINI_API_KEY environment variable is missing.');
}

const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper function for retry with backoff on 429 rate limit
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.status === 429 && attempt < maxRetries - 1) {
        attempt++;
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(
          `Rate limited (429). Retrying in ${Math.round(delay)}ms... (Attempt ${attempt})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
};

export const generateText = async (
  prompt: string,
  options?: { jsonMode?: boolean },
): Promise<string> => {
  if (!genAI) throw new Error('Generative AI client not initialized (missing API key)');

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: options?.jsonMode ? { responseMimeType: 'application/json' } : undefined,
  });

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  });
};

export const embedText = async (text: string): Promise<number[]> => {
  if (!genAI) throw new Error('Generative AI client not initialized (missing API key)');

  // Hardcoded to the embedding model for Gemini
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  return withRetry(async () => {
    const result = await model.embedContent(text);
    return result.embedding.values;
  });
};

// Streaming text generator for chat
export const streamText = async (
  prompt: string,
  onChunk: (text: string) => void,
): Promise<string> => {
  if (!genAI) throw new Error('Generative AI client not initialized (missing API key)');

  const model = genAI.getGenerativeModel({ model: modelName });

  return withRetry(async () => {
    const result = await model.generateContentStream(prompt);
    let fullText = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk(chunkText);
    }

    return fullText;
  });
};
