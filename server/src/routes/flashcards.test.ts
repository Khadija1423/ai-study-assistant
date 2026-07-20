import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import documentRoutes from './documents';
import { DocumentModel } from '../models/Document';
import { FlashcardModel } from '../models/Flashcard';
import * as aiClient from '../ai/client';

vi.mock('../models/Document', () => {
  class MockDocumentModel {
    constructor(data: any) {
      Object.assign(this, data);
    }
    async save() {
      return this;
    }
  }
  return {
    DocumentModel: Object.assign(MockDocumentModel, {
      findOne: vi.fn(),
    }),
  };
});

vi.mock('../models/Flashcard', () => {
  return {
    FlashcardModel: {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
      }),
      insertMany: vi.fn(),
    },
  };
});

vi.mock('../ai/client', () => {
  return {
    generateText: vi.fn(),
  };
});

const app = express();
app.use(express.json());
app.use('/api/documents', documentRoutes);

describe('Flashcard Generation Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /documents/:id/flashcards parses well-formed JSON array', async () => {
    (DocumentModel.findOne as any).mockResolvedValue({
      _id: 'doc1',
      extractedText: 'text content',
    });

    const validJson = JSON.stringify([{ question: 'Q1', answer: 'A1', topic: 'T1' }]);

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.SKIP_MONGO = 'false';

    (aiClient.generateText as any).mockResolvedValue(validJson);
    (FlashcardModel.find as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            question: 'Q1',
            answer: 'A1',
            topic: 'T1',
            _id: 'fake_id',
          },
        ]),
      }),
    });

    const res = await request(app).post('/api/documents/doc1/flashcards');

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(200);
    expect(res.body[0].question).toBe('Q1');
    expect(aiClient.generateText).toHaveBeenCalledTimes(1);
    expect(FlashcardModel.insertMany).toHaveBeenCalledTimes(1);
  });

  it('POST /documents/:id/flashcards handles AI response parse failure with retry', async () => {
    (DocumentModel.findOne as any).mockResolvedValue({
      _id: 'doc1',
      extractedText: 'text content',
    });

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.SKIP_MONGO = 'false';

    // Mock bad response
    (aiClient.generateText as any).mockResolvedValue('not json');

    const res = await request(app).post('/api/documents/doc1/flashcards');

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(500);
    // Should have retried once, totaling 2 attempts
    expect(aiClient.generateText).toHaveBeenCalledTimes(2);
  });
});
