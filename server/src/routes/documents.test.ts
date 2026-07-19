import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import multer from 'multer';
import documentRoutes from './documents';

// Mock mongoose model
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
      find: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue({ _id: 'doc123', originalFilename: 'test.pdf' }),
      findByIdAndUpdate: vi.fn().mockResolvedValue({}),
      findByIdAndDelete: vi.fn().mockResolvedValue({}),
    }),
  };
});

// Mock gridfs storage
vi.mock('../services/storage/gridFsStorage', () => {
  return {
    fileStorage: {
      uploadEngine: () => multer.memoryStorage(),
      getFileStream: vi.fn().mockReturnValue(null),
      deleteFile: vi.fn().mockResolvedValue(true),
    },
  };
});

// Mock extraction service
vi.mock('../services/extractionService', () => {
  return {
    extractTextFromFile: vi.fn().mockResolvedValue('Mock extracted text'),
  };
});

const app = express();
app.use(express.json());
app.use('/api/documents', documentRoutes);

describe('Documents Route API', () => {
  // Tests for validation
  it('rejects unsupported file types', async () => {
    const response = await request(app)
      .post('/api/documents/upload')
      .attach('files', Buffer.from('fake image data'), {
        filename: 'test.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(500); // Multer throws error up the chain
  });

  it('accepts supported file types', async () => {
    const response = await request(app)
      .post('/api/documents/upload')
      .attach('files', Buffer.from('fake pdf data'), {
        filename: 'test.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(201);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].status).toBe('processing');
  });

  it('limits file sizes over 20MB', async () => {
    const largeBuffer = Buffer.alloc(21 * 1024 * 1024); // 21MB
    const response = await request(app)
      .post('/api/documents/upload')
      .attach('files', largeBuffer, { filename: 'large.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(500); // Multer size limit error
  });
});
