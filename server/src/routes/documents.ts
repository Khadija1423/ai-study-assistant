import { Router } from 'express';
import multer from 'multer';
import { DocumentModel } from '../models/Document';
import { fileStorage } from '../services/storage/gridFsStorage';
import { extractTextFromFile } from '../services/extractionService';
import { processAndSaveChunks } from '../services/chunkingService';
import { generateText, embedText, streamText } from '../ai/client';
import { ChatMessageModel } from '../models/ChatMessage';
import { retrieveRelevantChunks } from '../services/retrievalService';
import { AnswerSubmission } from '../../../shared';

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
    if (process.env.SKIP_MONGO === 'true') {
      // Return a mock document for sandbox testing to allow UI clicking
      return res.json([
        {
          _id: 'dummy_doc_id',
          originalFilename: 'dummy.txt',
          status: 'ready',
          createdAt: new Date(),
        },
      ]);
    }

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
    if (process.env.SKIP_MONGO === 'true') {
      return res.json({
        _id: 'dummy_doc_id',
        originalFilename: 'dummy.txt',
        status: 'ready',
        extractedText: 'Mock extracted text for sandbox testing. '.repeat(50),
        createdAt: new Date(),
      });
    }

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

        // Trigger extraction and chunking asynchronously
        setTimeout(async () => {
          try {
            let buffer = file.buffer;

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
                // First save the extracted text
                await DocumentModel.findByIdAndUpdate(doc._id, {
                  extractedText: text,
                });

                // Then perform chunking
                await processAndSaveChunks(doc._id as string, userId, text);

                // Once chunking succeeds, mark as ready
                await DocumentModel.findByIdAndUpdate(doc._id, {
                  status: 'ready',
                });
              }
            } else {
              throw new Error('Could not retrieve file buffer for extraction.');
            }
          } catch (e: any) {
            console.error('Extraction/Chunking failed for document:', doc._id, e);
            if (process.env.SKIP_MONGO !== 'true') {
              await DocumentModel.findByIdAndUpdate(doc._id, {
                status: 'failed',
                errorMessage: e.message || 'Extraction/Chunking failed',
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
    if (process.env.SKIP_MONGO === 'true') {
      return res.json({ success: true });
    }

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

// POST reprocess a document's chunks
router.post('/:id/reprocess', async (req, res) => {
  const { id } = req.params;
  const userId = 'user_123'; // Dummy user for now

  try {
    if (process.env.SKIP_MONGO === 'true') {
      return res.status(202).json({ message: 'Reprocessing started' });
    }

    const doc = await DocumentModel.findOne({ _id: id, userId });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!doc.extractedText) {
      return res.status(400).json({ error: 'Document has no extracted text to reprocess' });
    }

    // Update status to processing initially
    await DocumentModel.findByIdAndUpdate(doc._id, { status: 'processing', errorMessage: '' });

    // Execute reprocessing asynchronously
    setTimeout(async () => {
      try {
        await processAndSaveChunks(doc._id as string, userId, doc.extractedText!);
        await DocumentModel.findByIdAndUpdate(doc._id, { status: 'ready' });
      } catch (error: any) {
        console.error('Reprocessing chunk failed for document:', doc._id, error);
        await DocumentModel.findByIdAndUpdate(doc._id, {
          status: 'failed',
          errorMessage: error.message || 'Reprocessing chunk failed',
        });
      }
    }, 0);

    res.status(202).json({ message: 'Reprocessing started' });
  } catch (error) {
    console.error('Reprocess request error:', error);
    res.status(500).json({ error: 'Failed to initiate reprocessing' });
  }
});

// GET cached summary
router.get('/:id/summary', async (req, res) => {
  const { id } = req.params;
  const userId = 'user_123';

  try {
    if (process.env.SKIP_MONGO === 'true') {
      return res.status(404).json({ error: 'No summary found' });
    }

    const doc = await DocumentModel.findOne({ _id: id, userId });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (doc.summary) {
      return res.json(doc.summary);
    }

    res.status(404).json({ error: 'No summary found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// POST generate or regenerate summary
router.post('/:id/summary', async (req, res) => {
  const { id } = req.params;
  const userId = 'user_123';

  try {
    let textToSummarize = '';

    if (process.env.SKIP_MONGO === 'true') {
      textToSummarize = 'Mock extracted text for sandbox testing. ';
    } else {
      const doc = await DocumentModel.findOne({ _id: id, userId });
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (!doc.extractedText) {
        return res.status(400).json({ error: 'Document text is not ready for summarization' });
      }
      textToSummarize = doc.extractedText.slice(0, 30000);
    }

    const prompt = `Generate a summary of the following document.
    Return strictly JSON matching this structure:
    {
      "shortSummary": "string (5-10 lines)",
      "keyPoints": ["string", "string"],
      "definitions": [{"term": "string", "definition": "string"}],
      "examFocusNotes": ["string", "string"]
    }
    No markdown blocks, no other text.

    Document text:
    ${textToSummarize}
    `;

    let summaryData = null;
    let attempts = 0;
    const maxAttempts = 2; // 1 retry

    while (attempts < maxAttempts) {
      try {
        let aiResponse;
        if (
          (process.env.NODE_ENV === 'test' && process.env.MOCK_AI !== 'false') ||
          process.env.SKIP_MONGO === 'true'
        ) {
          console.log('Mocking summary generation for standard tests...');
          aiResponse = JSON.stringify({
            shortSummary: 'Mock summary text here.',
            keyPoints: ['Mock point 1', 'Mock point 2'],
            definitions: [{ term: 'Mock Term', definition: 'A fake thing.' }],
            examFocusNotes: ['Remember mock things.'],
          });
        } else {
          aiResponse = await generateText(prompt, { jsonMode: true });
        }

        // Defensive parsing
        const cleanedResponse = aiResponse
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        summaryData = JSON.parse(cleanedResponse);
        break; // Success
      } catch (parseError) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Failed to parse AI summary after retries');
        }
        console.warn(`Summary parse failed, retrying... (${attempts}/${maxAttempts})`);
      }
    }

    if (!summaryData) {
      return res.status(500).json({ error: 'Summary generation failed' });
    }

    if (process.env.SKIP_MONGO !== 'true') {
      const doc = await DocumentModel.findOne({ _id: id, userId });
      if (doc) {
        doc.summary = summaryData;
        await doc.save();
      }
    }

    res.json(summaryData);
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// GET chat history
router.get('/:id/chat', async (req, res) => {
  const { id } = req.params;
  const userId = 'user_123';

  try {
    const history = await ChatMessageModel.find({ documentId: id, userId }).sort('createdAt');
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// POST new chat message (streamed)
router.post('/:id/chat', async (req, res) => {
  const { id } = req.params;
  const userId = 'user_123';
  const { question, conversationHistory } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    // 1. Embed Question
    let queryEmbedding: number[] = [];
    if (process.env.NODE_ENV !== 'test' && process.env.SKIP_MONGO !== 'true') {
      queryEmbedding = await embedText(question);
    } else {
      // Mock embedding for dev/test
      queryEmbedding = new Array(768).fill(0.1);
    }

    // 2. Retrieve top chunks
    const relevantChunks = await retrieveRelevantChunks(id, queryEmbedding, 5);

    if (relevantChunks.length === 0) {
      const fallbackResponse = "I can't find that in your uploaded document.";

      // Save User Message
      if (process.env.SKIP_MONGO !== 'true') {
        await ChatMessageModel.create({
          documentId: id,
          userId,
          role: 'user',
          content: question,
        });

        // Save Model Fallback Message
        await ChatMessageModel.create({
          documentId: id,
          userId,
          role: 'model',
          content: fallbackResponse,
          sourceChunks: [],
        });
      }

      res.write(`data: ${JSON.stringify({ text: fallbackResponse })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, sourceChunks: [] })}\n\n`);
      return res.end();
    }

    const contextText = relevantChunks
      .map((c) => `[Chunk ${c.chunkIndex}]: ${c.text}`)
      .join('\n\n');
    const sourceChunks = relevantChunks.map((c) => ({
      chunkIndex: c.chunkIndex,
      excerpt: c.text.substring(0, 150) + '...',
    }));

    // 3. Build Prompt
    const historyText = conversationHistory
      ? conversationHistory
          .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n')
      : '';

    const prompt = `You are a helpful study assistant. Answer the user's question explicitly and ONLY using the provided document context below.
If the answer cannot be found in the context, you must exactly say: "I can't find that in your uploaded document".
If you do find the answer in the context, you must prefix your answer exactly with: "Answer based on your uploaded document: ".

Document Context:
${contextText}

Previous Conversation:
${historyText}

User Question: ${question}
Answer:`;

    // 4. Save User Message
    if (process.env.SKIP_MONGO !== 'true') {
      await ChatMessageModel.create({
        documentId: id,
        userId,
        role: 'user',
        content: question,
      });
    }

    // Send the source chunks immediately so the frontend has them
    res.write(`data: ${JSON.stringify({ sourceChunks })}\n\n`);

    // 5. Stream AI Response
    let fullResponse = '';

    if (process.env.NODE_ENV === 'test' || process.env.SKIP_MONGO === 'true') {
      // Mock streaming
      const words =
        'Answer based on your uploaded document: This is a mock streaming response based on chunk data.'.split(
          ' ',
        );
      for (const word of words) {
        fullResponse += word + ' ';
        res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
        await new Promise((r) => setTimeout(r, 50));
      }
    } else {
      fullResponse = await streamText(prompt, (chunkText) => {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      });
    }

    // 6. Save Model Message
    if (process.env.SKIP_MONGO !== 'true') {
      await ChatMessageModel.create({
        documentId: id,
        userId,
        role: 'model',
        content: fullResponse.trim(),
        sourceChunks,
      });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Chat streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Stream failed' })}\n\n`);
    res.end();
  }
});

export default router;
