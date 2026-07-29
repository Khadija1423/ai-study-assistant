import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import dashboardRoutes from './dashboard';
import { DocumentModel } from '../models/Document';
import { FlashcardModel } from '../models/Flashcard';
import { QuizAttempt } from '../models/QuizAttempt';
import { StudyPlanModel } from '../models/StudyPlan';

vi.mock('../models/Document');
vi.mock('../models/Flashcard');
vi.mock('../models/QuizAttempt');
vi.mock('../models/StudyPlan');

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

describe('Dashboard Endpoint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/dashboard aggregates stats correctly', async () => {
        const mockExecDocFind = vi.fn().mockResolvedValue([{ _id: 'doc1' }]);
        const mockLimit = vi.fn().mockReturnValue({ exec: mockExecDocFind });
        const mockSortDocFind = vi.fn().mockReturnValue({ limit: mockLimit });
        (DocumentModel.find as any).mockReturnValue({ sort: mockSortDocFind });
        (DocumentModel.countDocuments as any).mockResolvedValue(10);

        (FlashcardModel.countDocuments as any).mockResolvedValue(25);

        (QuizAttempt.countDocuments as any).mockResolvedValue(2);

        const mockExecQuizFind = vi.fn().mockResolvedValue([
            { score: 8, total: 10 },
            { score: 5, total: 10 }
        ]);
        const mockSelectQuizFind = vi.fn().mockReturnValue({ exec: mockExecQuizFind });
        (QuizAttempt.find as any).mockReturnValue({ select: mockSelectQuizFind });

        const mockExecStudyPlanFindOne = vi.fn().mockResolvedValue({ _id: 'plan1' });
        const mockSortStudyPlanFindOne = vi.fn().mockReturnValue({ exec: mockExecStudyPlanFindOne });
        (StudyPlanModel.findOne as any).mockReturnValue({ sort: mockSortStudyPlanFindOne });

        const res = await request(app).get('/api/dashboard');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            recentDocuments: [{ _id: 'doc1' }],
            totalDocuments: 10,
            totalFlashcards: 25,
            totalQuizzes: 2,
            averageQuizScore: 65, // (80 + 50) / 2
            activeStudyPlan: { _id: 'plan1' }
        });
    });

    it('GET /api/dashboard returns 0 average score if no quizzes', async () => {
        const mockExecDocFind = vi.fn().mockResolvedValue([]);
        const mockLimit = vi.fn().mockReturnValue({ exec: mockExecDocFind });
        const mockSortDocFind = vi.fn().mockReturnValue({ limit: mockLimit });
        (DocumentModel.find as any).mockReturnValue({ sort: mockSortDocFind });
        (DocumentModel.countDocuments as any).mockResolvedValue(0);

        (FlashcardModel.countDocuments as any).mockResolvedValue(0);

        (QuizAttempt.countDocuments as any).mockResolvedValue(0);

        const mockExecQuizFind = vi.fn().mockResolvedValue([]);
        const mockSelectQuizFind = vi.fn().mockReturnValue({ exec: mockExecQuizFind });
        (QuizAttempt.find as any).mockReturnValue({ select: mockSelectQuizFind });

        const mockExecStudyPlanFindOne = vi.fn().mockResolvedValue(null);
        const mockSortStudyPlanFindOne = vi.fn().mockReturnValue({ exec: mockExecStudyPlanFindOne });
        (StudyPlanModel.findOne as any).mockReturnValue({ sort: mockSortStudyPlanFindOne });

        const res = await request(app).get('/api/dashboard');

        expect(res.status).toBe(200);
        expect(res.body.averageQuizScore).toBe(0);
        expect(res.body.totalQuizzes).toBe(0);
    });
});
