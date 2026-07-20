import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import studyPlanRoutes from './studyPlans';
import { DocumentModel } from '../models/Document';

import * as aiClient from '../ai/client';

vi.mock('../models/Document', () => {
  return {
    DocumentModel: {
      find: vi.fn(),
    },
  };
});

vi.mock('../models/StudyPlan', () => {
  class MockStudyPlan {
    constructor(data: any) {
      Object.assign(this, data);
    }
    async save() {
      return this;
    }
  }
  return {
    StudyPlanModel: Object.assign(MockStudyPlan, {
      find: vi.fn().mockReturnValue({ sort: vi.fn().mockResolvedValue([]) }),
      findOne: vi.fn(),
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
app.use('/api/study-plans', studyPlanRoutes);

describe('Study Plans Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /study-plans respects hoursPerDay constraints and parses correctly', async () => {
    (DocumentModel.find as any).mockResolvedValue([
      {
        _id: 'doc1',
        originalFilename: 'test.pdf',
        extractedText: 'some text',
      },
    ]);

    // AI proposes 4 hours (240 mins) for a day, but user requested 2 hours (120 mins).
    // The route validation should cut off the second topic.
    const mockAiPlan = {
      days: [
        {
          date: '2023-12-01',
          topics: [
            { topic: 'Topic 1', documentId: 'doc1', minutes: 120, priority: 'high' },
            { topic: 'Topic 2', documentId: 'doc1', minutes: 120, priority: 'medium' },
          ],
          totalMinutes: 240,
        },
      ],
    };

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.SKIP_MONGO = 'false';

    (aiClient.generateText as any).mockResolvedValue(JSON.stringify(mockAiPlan));

    const res = await request(app)
      .post('/api/study-plans')
      .send({
        examDate: '2023-12-10',
        hoursPerDay: 2, // 120 minutes
        documentIds: ['doc1'],
      });

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(201);

    const day = res.body.days[0];
    expect(day.topics.length).toBe(1); // Second topic was filtered out
    expect(day.topics[0].topic).toBe('Topic 1');
    expect(day.totalMinutes).toBe(120);
    expect(res.body.hoursPerDay).toBe(2);
  });
});
