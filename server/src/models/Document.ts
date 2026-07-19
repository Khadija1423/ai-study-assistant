import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import { Document as IDocument } from '../../../shared';

export interface DocumentModel extends Omit<IDocument, '_id'>, MongooseDocument {}

const DocumentSchema = new Schema<DocumentModel>({
  userId: { type: String, required: true },
  originalFilename: { type: String, required: true },
  fileType: { type: String, required: true },
  storagePath: { type: String, required: true },
  extractedText: { type: String },
  status: { type: String, required: true, enum: ['processing', 'ready', 'failed'] },
  errorMessage: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const DocumentModel = mongoose.model<DocumentModel>('Document', DocumentSchema);
