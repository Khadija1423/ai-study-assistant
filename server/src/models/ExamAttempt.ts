import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import {
  ExamAttempt as IExamAttempt,
  AnswerSubmission,
  QuestionResult,
  TopicAccuracy,
} from '../../../shared';

export interface ExamAttemptModel extends Omit<IExamAttempt, '_id'>, MongooseDocument {}

const AnswerSubmissionSchema = new Schema<AnswerSubmission>(
  {
    questionIndex: { type: Number, required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);

const QuestionResultSchema = new Schema<QuestionResult>(
  {
    questionIndex: { type: Number, required: true },
    correct: { type: Boolean, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false },
);

const TopicAccuracySchema = new Schema<TopicAccuracy>(
  {
    topic: { type: String, required: true },
    correct: { type: Number, required: true },
    total: { type: Number, required: true },
    accuracy: { type: Number, required: true },
  },
  { _id: false },
);

const ExamAttemptSchema = new Schema<ExamAttemptModel>({
  examId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  answers: [AnswerSubmissionSchema],
  results: [QuestionResultSchema],
  accuracyByTopic: [TopicAccuracySchema],
  weakTopics: [{ type: String }],
  suggestedRevision: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export const ExamAttemptModel = mongoose.model<ExamAttemptModel>('ExamAttempt', ExamAttemptSchema);
