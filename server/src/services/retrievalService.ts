import { ChunkModel } from '../models/Chunk';
import { Chunk } from '../../../shared';

// Cosine similarity fallback function
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const retrieveRelevantChunks = async (
  documentId: string,
  queryEmbedding: number[],
  topK: number = 5,
): Promise<Chunk[]> => {
  try {
    // Attempt MongoDB Atlas Vector Search
    // Note: Requires Atlas setup and cannot be mocked locally easily with Mongoose aggregate.
    // We will attempt it, and if it fails (because we're local or no index), we fall back.

    let useFallback = false;
    let chunks: any[] = [];

    if (process.env.NODE_ENV !== 'test' && process.env.SKIP_MONGO !== 'true') {
      try {
        chunks = await ChunkModel.aggregate([
          {
            $vectorSearch: {
              index: 'default', // Default index name, make sure to document
              path: 'embedding',
              queryVector: queryEmbedding,
              numCandidates: 100,
              limit: topK,
              filter: { documentId }, // Ensure we only search within the requested document
            },
          },
        ]);

        if (chunks.length === 0) {
          // Might just mean no results, but let's check if the document actually has chunks.
          // If it does, maybe the index isn't ready. We'll fallback just in case to be safe for dev.
          const docHasChunks = await ChunkModel.exists({ documentId });
          if (docHasChunks) useFallback = true;
        }
      } catch (err) {
        console.warn(
          'Atlas Vector Search failed or not configured. Falling back to in-memory search.',
          err,
        );
        useFallback = true;
      }
    } else {
      useFallback = true;
    }

    if (useFallback) {
      // Fallback: In-memory cosine similarity (DOES NOT SCALE PAST A FEW HUNDRED CHUNKS)
      // For a single document study tool, it's usually fine (< 100 chunks typically).
      const allChunks = await ChunkModel.find({
        documentId,
        embedding: { $exists: true, $ne: [] },
      }).lean();

      const scoredChunks = allChunks.map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
      }));

      scoredChunks.sort((a, b) => b.score - a.score);
      chunks = scoredChunks.slice(0, topK);
    }

    return chunks;
  } catch (error) {
    console.error('Retrieval error:', error);
    return [];
  }
};
