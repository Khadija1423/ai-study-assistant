import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import { StudyPlan as IStudyPlan, StudyPlanDay, StudyTopic } from '../../../shared';

export interface StudyPlanModel extends Omit<IStudyPlan, '_id'>, MongooseDocument {}

const StudyTopicSchema = new Schema<StudyTopic>(
  {
    topic: { type: String, required: true },
    documentId: { type: String, required: true },
    minutes: { type: Number, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

const StudyPlanDaySchema = new Schema<StudyPlanDay>(
  {
    date: { type: String, required: true },
    totalMinutes: { type: Number, required: true },
    topics: [StudyTopicSchema],
  },
  { _id: false },
);

const StudyPlanSchema = new Schema<StudyPlanModel>({
  userId: { type: String, required: true, index: true },
  examDate: { type: String, required: true },
  hoursPerDay: { type: Number, required: true },
  documentIds: [{ type: String, required: true }],
  days: [StudyPlanDaySchema],
  createdAt: { type: Date, default: Date.now },
});

export const StudyPlanModel = mongoose.model<StudyPlanModel>('StudyPlan', StudyPlanSchema);
