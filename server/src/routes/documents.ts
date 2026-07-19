import { Router } from 'express';
import multer from 'multer';
import { DocumentModel } from '../models/Document';
import { fileStorage } from '../services/storage/gridFsStorage';
import { extractTextFromFile } from '../services/extractionService';

const router = Router();
const upload = multer({
  storage: fileStorage.uploadEngine(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// GET list of documents
router.get('/', async (req, res) => {
  const userId = 'user_123'; // Dummy user for now
  try {
    const docs = await DocumentModel.find({ userId }).select('-extractedText');
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET single document with text
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = 'user_123';
  try {
    const doc = await DocumentModel.findOne({ _id: id, userId });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// POST upload documents
router.post('/upload', upload.array('files', 5), async (req, res) => {
  const userId = 'user_123';
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    const createdDocs = await Promise.all(
      files.map(async (file) => {
        // If GridFs, filename is the stored id
        // If memory storage (mock), it's empty, so we generate a mock one
        const storagePath = file.filename || `mock_file_${Date.now()}`;

        const doc = new DocumentModel({
          userId,
          originalFilename: file.originalname,
          fileType: file.mimetype,
          storagePath,
          status: 'processing',
        });

        if (process.env.SKIP_MONGO !== 'true') {
          await doc.save();
        }

        // Trigger extraction asynchronously
        setTimeout(async () => {
          try {
            let buffer = file.buffer;

            // In a real gridfs setup, if it's streamed direct to mongo we'd need to fetch the stream back
            // But since multer-gridfs-storage pipes the stream, the buffer isn't on the file object natively
            // UNLESS we use memory storage (which we do for tests).
            // For actual GridFS, extracting text requires downloading the file again.

            if (!buffer && process.env.SKIP_MONGO !== 'true') {
              const stream = fileStorage.getFileStream(storagePath);
              if (stream) {
                const chunks: any[] = [];
                for await (const chunk of stream) {
                  chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
              }
            }

            if (buffer) {
              const text = await extractTextFromFile(buffer, file.mimetype);
              if (process.env.SKIP_MONGO !== 'true') {
                await DocumentModel.findByIdAndUpdate(doc._id, {
                  extractedText: text,
                  status: 'ready',
                });
              }
            } else {
              throw new Error('Could not retrieve file buffer for extraction.');
            }
          } catch (e: any) {
            console.error('Extraction failed for document:', doc._id, e);
            if (process.env.SKIP_MONGO !== 'true') {
              await DocumentModel.findByIdAndUpdate(doc._id, {
                status: 'failed',
                errorMessage: e.message || 'Extraction failed',
              });
            }
          }
        }, 0);

        return doc;
      }),
    );

    res.status(201).json(createdDocs);
  } catch (error) {
    console.error('Upload handling error:', error);
    res.status(500).json({ error: 'Failed to process uploaded files' });
  }
});

// DELETE a document
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = 'user_123';
  try {
    const doc = await DocumentModel.findOne({ _id: id, userId });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (process.env.SKIP_MONGO !== 'true') {
      await fileStorage.deleteFile(doc.storagePath);
      await DocumentModel.findByIdAndDelete(id);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
