import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import { ChatMessage as IChatMessage } from '../../../shared';

export interface ChatMessageModel extends Omit<IChatMessage, '_id'>, MongooseDocument {}

const ChatMessageSchema = new Schema<ChatMessageModel>({
  documentId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, required: true, enum: ['user', 'model'] },
  content: { type: String, required: true },
  sourceChunks: [
    {
      chunkIndex: { type: Number, required: true },
      excerpt: { type: String, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export const ChatMessageModel = mongoose.model<ChatMessageModel>('ChatMessage', ChatMessageSchema);
