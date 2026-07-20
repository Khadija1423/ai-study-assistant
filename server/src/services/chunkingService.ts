import { encode, decode } from 'gpt-tokenizer';
import { ChunkModel } from '../models/Chunk';
import { embedText } from '../ai/client';

const TARGET_CHUNK_TOKENS = 600;
const OVERLAP_TOKENS = 100;

export const splitTextIntoChunks = (text: string): { text: string; tokenCount: number }[] => {
  const tokens = encode(text);
  const chunks: { text: string; tokenCount: number }[] = [];

  if (tokens.length === 0) {
    return chunks;
  }

  let i = 0;
  while (i < tokens.length) {
    const chunkTokens = tokens.slice(i, i + TARGET_CHUNK_TOKENS);
    const chunkText = decode(chunkTokens);
    chunks.push({ text: chunkText, tokenCount: chunkTokens.length });

    // Increment i by the target minus the overlap
    i += TARGET_CHUNK_TOKENS - OVERLAP_TOKENS;
  }

  return chunks;
};

export const processAndSaveChunks = async (
  documentId: string,
  userId: string,
  text: string,
): Promise<void> => {
  try {
    // Delete existing chunks for this document first if reprocessing
    await ChunkModel.deleteMany({ documentId });

    const chunksData = splitTextIntoChunks(text);

    // Process sequentially to avoid aggressive rate-limiting on Gemini Free Tier
    for (let index = 0; index < chunksData.length; index++) {
      const data = chunksData[index];
      let embedding: number[] | undefined;

      // Skip embedding generation in pure mock mode to save time/keys
      if (process.env.NODE_ENV !== 'test' && process.env.SKIP_MONGO !== 'true') {
        try {
          embedding = await embedText(data.text);
        } catch (embedError) {
          console.error(`Failed to embed chunk ${index}`, embedError);
          throw new Error(`Embedding failed for chunk ${index}.`);
        }
      }

      const chunkDoc = new ChunkModel({
        documentId,
        userId,
        chunkIndex: index,
        text: data.text,
        tokenCount: data.tokenCount,
        embedding,
      });

      await chunkDoc.save();
    }
  } catch (error: any) {
    console.error('Failed to process and save chunks:', error);
    throw new Error(`Chunking failed: ${error.message || error}`);
  }
};
