import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import { Flashcard as IFlashcard } from '../../../shared';

export interface FlashcardModel extends Omit<IFlashcard, '_id'>, MongooseDocument {}

const FlashcardSchema = new Schema<FlashcardModel>({
  documentId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  topic: { type: String, required: true },
  isFavorited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const FlashcardModel = mongoose.model<FlashcardModel>('Flashcard', FlashcardSchema);
