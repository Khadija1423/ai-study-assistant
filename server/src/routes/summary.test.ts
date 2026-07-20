import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import documentRoutes from './documents';
import { DocumentModel } from '../models/Document';
import * as aiClient from '../ai/client';

vi.mock('../models/Document', () => {
  class MockDocumentModel {
    constructor(data: any) {
      Object.assign(this, data);
      this._id = 'mock_id_123';
    }
    async save() {
      return this;
    }
  }

  return {
    DocumentModel: Object.assign(MockDocumentModel, {
      findOne: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    }),
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

describe('Summary Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /summary returns 404 if no summary exists', async () => {
    (DocumentModel.findOne as any).mockResolvedValue({ _id: 'doc1', extractedText: 'text' });

    const res = await request(app).get('/api/documents/doc1/summary');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('No summary found');
  });

  it('GET /summary returns summary if it exists', async () => {
    const mockSummary = {
      shortSummary: 'Test',
      keyPoints: [],
      definitions: [],
      examFocusNotes: [],
    };
    (DocumentModel.findOne as any).mockResolvedValue({ _id: 'doc1', summary: mockSummary });

    const res = await request(app).get('/api/documents/doc1/summary');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockSummary);
  });

  it('POST /summary parses correctly formatted JSON', async () => {
    (DocumentModel.findOne as any).mockResolvedValue({
      _id: 'doc1',
      extractedText: 'long text here',
      save: vi.fn(),
    });

    const validJson = JSON.stringify({
      shortSummary: 'Valid',
      keyPoints: ['point 1'],
      definitions: [],
      examFocusNotes: [],
    });

    process.env.MOCK_AI = 'false'; // Force real branch in code for test
    (aiClient.generateText as any).mockResolvedValue(validJson);

    const res = await request(app).post('/api/documents/doc1/summary');

    process.env.MOCK_AI = 'true';

    expect(res.status).toBe(200);
    expect(res.body.shortSummary).toBe('Valid');
    expect(aiClient.generateText).toHaveBeenCalledTimes(1);
  });

  it('POST /summary strips markdown fences and parses', async () => {
    (DocumentModel.findOne as any).mockResolvedValue({
      _id: 'doc1',
      extractedText: 'long text here',
      save: vi.fn(),
    });

    const validJson = JSON.stringify({
      shortSummary: 'Valid markdown stripped',
      keyPoints: [],
      definitions: [],
      examFocusNotes: [],
    });
    const markdownWrapped = `\`\`\`json\n${validJson}\n\`\`\``;

    process.env.MOCK_AI = 'false';
    (aiClient.generateText as any).mockResolvedValue(markdownWrapped);

    const res = await request(app).post('/api/documents/doc1/summary');

    process.env.MOCK_AI = 'true';

    expect(res.status).toBe(200);
    expect(res.body.shortSummary).toBe('Valid markdown stripped');
  });

  it('POST /summary retries once on malformed JSON and fails gracefully if it fails again', async () => {
    (DocumentModel.findOne as any).mockResolvedValue({
      _id: 'doc1',
      extractedText: 'long text here',
      save: vi.fn(),
    });

    process.env.MOCK_AI = 'false';
    // Mock it to return bad JSON both times
    (aiClient.generateText as any).mockResolvedValue('this is not json');

    const res = await request(app).post('/api/documents/doc1/summary');

    process.env.MOCK_AI = 'true';

    expect(res.status).toBe(500);
    expect(aiClient.generateText).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });
});
