import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import { Chunk as IChunk } from '../../../shared';

export interface ChunkModel extends Omit<IChunk, '_id'>, MongooseDocument {}

const ChunkSchema = new Schema<ChunkModel>({
  documentId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  tokenCount: { type: Number, required: true },
});

export const ChunkModel = mongoose.model<ChunkModel>('Chunk', ChunkSchema);
