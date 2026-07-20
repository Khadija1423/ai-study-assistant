import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import documentRoutes from './documents';
import { ChatMessageModel } from '../models/ChatMessage';
import * as retrievalService from '../services/retrievalService';
import * as aiClient from '../ai/client';

vi.mock('../models/Document', () => {
  return {
    DocumentModel: {
      findOne: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    },
  };
});

vi.mock('../models/ChatMessage', () => {
  class MockChatMessage {
    constructor(data: any) {
      Object.assign(this, data);
    }
    async save() {
      return this;
    }
  }
  return {
    ChatMessageModel: Object.assign(MockChatMessage, {
      find: vi.fn().mockReturnValue({ sort: vi.fn().mockResolvedValue([]) }),
      create: vi.fn(),
    }),
  };
});

vi.mock('../services/retrievalService', () => {
  return {
    retrieveRelevantChunks: vi.fn(),
  };
});

vi.mock('../ai/client', () => {
  return {
    embedText: vi.fn(),
    streamText: vi.fn(),
  };
});

const app = express();
app.use(express.json());
app.use('/api/documents', documentRoutes);

describe('Chat Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /chat returns chat history', async () => {
    const mockHistory = [{ role: 'user', content: 'hello' }];
    (ChatMessageModel.find as any).mockReturnValue({
      sort: vi.fn().mockResolvedValue(mockHistory),
    });

    const res = await request(app).get('/api/documents/doc1/chat');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockHistory);
  });

  it('POST /chat correctly returns fallback if no chunks match', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.SKIP_MONGO = 'false';

    (aiClient.embedText as any).mockResolvedValue([0.1, 0.2]);
    (retrievalService.retrieveRelevantChunks as any).mockResolvedValue([]); // No chunks

    const req = request(app).post('/api/documents/doc1/chat').send({ question: 'Test' });

    // Server-Sent events are streamed, we just wait for the response to finish
    const res = await req;

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(200);
    expect(res.text).toContain("I can't find that in your uploaded document");
    expect(aiClient.streamText).not.toHaveBeenCalled();
  });

  it('POST /chat streams prompt restricted to chunks', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.SKIP_MONGO = 'false';

    (aiClient.embedText as any).mockResolvedValue([0.1, 0.2]);
    (retrievalService.retrieveRelevantChunks as any).mockResolvedValue([
      { chunkIndex: 0, text: 'This is test chunk 1' },
    ]);

    // Instead of streaming via network in test, streamText is mocked
    // and we can capture the prompt passed to it
    let capturedPrompt = '';
    (aiClient.streamText as any).mockImplementation(async (prompt: string, onChunk: any) => {
      capturedPrompt = prompt;
      onChunk('Answer');
      onChunk(' based on');
      return 'Answer based on';
    });

    const res = await request(app).post('/api/documents/doc1/chat').send({ question: 'Test' });

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(200);
    expect(aiClient.streamText).toHaveBeenCalled();
    expect(capturedPrompt).toContain('This is test chunk 1');
    expect(capturedPrompt).toContain('Test');
    // Ensure strict instructions are present
    expect(capturedPrompt).toContain("I can't find that in your uploaded document");
  });
});
