import { encode, decode } from 'gpt-tokenizer';
import { ChunkModel } from '../models/Chunk';

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

    const chunkDocs = chunksData.map((data, index) => ({
      documentId,
      userId,
      chunkIndex: index,
      text: data.text,
      tokenCount: data.tokenCount,
    }));

    if (chunkDocs.length > 0) {
      await ChunkModel.insertMany(chunkDocs);
    }
  } catch (error: any) {
    console.error('Failed to process and save chunks:', error);
    throw new Error(`Chunking failed: ${error.message || error}`);
  }
};
