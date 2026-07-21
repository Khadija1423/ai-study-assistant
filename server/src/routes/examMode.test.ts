import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import examModeRoutes from './examMode';
import { ExamModel } from '../models/Exam';
import * as examService from '../services/examService';

vi.mock('../models/Exam', () => {
    return {
        ExamModel: {
            findById: vi.fn(),
        }
    };
});

vi.mock('../models/ExamAttempt', () => {
    class MockExamAttempt {
      constructor(data: any) { Object.assign(this, data); }
      async save() { return this; }
    }
    return {
        ExamAttemptModel: MockExamAttempt
    };
});

vi.mock('../services/examService', () => {
    return {
        scoreExam: vi.fn()
    };
});

const app = express();
app.use(express.json());
app.use('/api/exam-mode', examModeRoutes);

describe('Exam Mode Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /submit rejects submission after expiry but returns report payload', async () => {
    const pastDate = new Date(Date.now() - 60000); // 1 minute ago

    (ExamModel.findById as any).mockResolvedValue({
        _id: 'exam1',
        expiresAt: pastDate,
        questions: []
    });

    (examService.scoreExam as any).mockReturnValue({
        score: 1, total: 1, results: [], accuracyByTopic: [], weakTopics: [], suggestedRevision: []
    });

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.SKIP_MONGO = 'false';

    const res = await request(app).post('/api/exam-mode/exam1/submit').send({
        answers: [{ questionIndex: 0, answer: 'A' }]
    });

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Time expired');
    expect(res.body.report.score).toBe(1);
    expect(examService.scoreExam).toHaveBeenCalledTimes(1);
  });
});
