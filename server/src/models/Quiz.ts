import mongoose, { Schema, Document } from 'mongoose';
import { Quiz as IQuiz, Question } from '../../../shared';

export interface QuizDocument extends Omit<IQuiz, '_id'>, Document {}

const QuestionSchema = new Schema<Question>({
  type: { type: String, required: true, enum: ['mcq', 'trueFalse', 'shortAnswer'] },
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, required: true },
});

const QuizSchema = new Schema<QuizDocument>({
  documentId: { type: String, required: true },
  userId: { type: String, required: true },
  difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now },
});

export const Quiz = mongoose.model<QuizDocument>('Quiz', QuizSchema);
