import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import { Exam as IExam, ExamQuestion } from '../../../shared';

export interface ExamModel extends Omit<IExam, '_id'>, MongooseDocument {}

const ExamQuestionSchema = new Schema<ExamQuestion>(
  {
    type: { type: String, required: true, enum: ['mcq', 'trueFalse', 'shortAnswer'] },
    question: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true },
    topic: { type: String, required: true },
  },
  { _id: false },
);

const ExamSchema = new Schema<ExamModel>({
  documentIds: [{ type: String, required: true }],
  userId: { type: String, required: true, index: true },
  durationMinutes: { type: Number, required: true },
  questionCount: { type: Number, required: true },
  questions: [ExamQuestionSchema],
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const ExamModel = mongoose.model<ExamModel>('Exam', ExamSchema);
