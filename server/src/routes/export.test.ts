import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import exportRoutes from './export';
import { DocumentModel } from '../models/Document';
import * as pdfService from '../services/pdfService';

vi.mock('../models/Document', () => {
    return {
        DocumentModel: {
            findById: vi.fn(),
        }
    };
});

// Since other models use similar logic, we'll just mock them for test safety
vi.mock('../models/Flashcard', () => ({ FlashcardModel: { find: vi.fn() } }));
vi.mock('../models/QuizAttempt', () => ({ QuizAttempt: { findById: vi.fn() } }));
vi.mock('../models/StudyPlan', () => ({ StudyPlanModel: { findById: vi.fn() } }));
vi.mock('../models/ExamAttempt', () => ({ ExamAttemptModel: { findById: vi.fn() } }));

vi.mock('../services/pdfService', () => {
    return {
        generatePdf: vi.fn()
    };
});

const app = express();
app.use(express.json());
app.use('/api/export', exportRoutes);

describe('Export Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/export/documents/:id/summary returns 404 if summary missing', async () => {
    (DocumentModel.findById as any).mockResolvedValue({ _id: 'doc1' }); // no summary

    const res = await request(app).get('/api/export/documents/doc1/summary');
    expect(res.status).toBe(404);
  });

  it('GET /api/export/documents/:id/summary returns application/pdf on success', async () => {
    (DocumentModel.findById as any).mockResolvedValue({
        _id: 'doc1',
        originalFilename: 'test.pdf',
        summary: {
            shortSummary: 'Test',
            keyPoints: [],
            definitions: [],
            examFocusNotes: []
        }
    });

    const fakePdfBuffer = Buffer.from('fake pdf data');
    (pdfService.generatePdf as any).mockResolvedValue(fakePdfBuffer);

    const res = await request(app).get('/api/export/documents/doc1/summary');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment; filename="Summary_test.pdf.pdf"');
    expect(pdfService.generatePdf).toHaveBeenCalledTimes(1);
    expect(res.body).toEqual(fakePdfBuffer);
  });
});
