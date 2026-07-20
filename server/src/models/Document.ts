import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import { Document as IDocument, Summary, TermDefinition } from '../../../shared';

export interface DocumentModel extends Omit<IDocument, '_id'>, MongooseDocument {}

const TermDefinitionSchema = new Schema<TermDefinition>(
  {
    term: { type: String, required: true },
    definition: { type: String, required: true },
  },
  { _id: false },
);

const SummarySchema = new Schema<Summary>(
  {
    shortSummary: { type: String, required: true },
    keyPoints: [{ type: String }],
    definitions: [TermDefinitionSchema],
    examFocusNotes: [{ type: String }],
  },
  { _id: false },
);

const DocumentSchema = new Schema<DocumentModel>({
  userId: { type: String, required: true },
  originalFilename: { type: String, required: true },
  fileType: { type: String, required: true },
  storagePath: { type: String, required: true },
  extractedText: { type: String },
  status: { type: String, required: true, enum: ['processing', 'ready', 'failed'] },
  errorMessage: { type: String },
  summary: SummarySchema,
  createdAt: { type: Date, default: Date.now },
});

export const DocumentModel = mongoose.model<DocumentModel>('Document', DocumentSchema);
