import mongoose, { Schema, Document } from 'mongoose';
import { QuizAttempt as IQuizAttempt, AnswerSubmission, QuestionResult } from '../../../shared';

export interface QuizAttemptDocument extends Omit<IQuizAttempt, '_id'>, Document {}

const AnswerSubmissionSchema = new Schema<AnswerSubmission>({
  questionIndex: { type: Number, required: true },
  answer: { type: String, required: true },
});

const QuestionResultSchema = new Schema<QuestionResult>({
  questionIndex: { type: Number, required: true },
  correct: { type: Boolean, required: true },
  explanation: { type: String, required: true },
});

const QuizAttemptSchema = new Schema<QuizAttemptDocument>({
  quizId: { type: String, required: true },
  userId: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  answers: [AnswerSubmissionSchema],
  results: [QuestionResultSchema],
  createdAt: { type: Date, default: Date.now },
});

export const QuizAttempt = mongoose.model<QuizAttemptDocument>('QuizAttempt', QuizAttemptSchema);
