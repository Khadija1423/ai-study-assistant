import { Router } from 'express';
import { ExamModel } from '../models/Exam';
import { ExamAttemptModel } from '../models/ExamAttempt';
import { DocumentModel } from '../models/Document';
import { generateText } from '../ai/client';
import { scoreExam } from '../services/examService';
import { AnswerSubmission } from '../../../shared';

const router = Router();

// POST generate and start an exam
router.post('/start', async (req, res) => {
  const { documentIds, durationMinutes, questionCount } = req.body;
  const userId = 'user_123'; // Dummy user

  if (!documentIds || documentIds.length === 0 || !durationMinutes || !questionCount) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    let contextText = '';

    if (process.env.SKIP_MONGO !== 'true') {
      const docs = await DocumentModel.find({ _id: { $in: documentIds }, userId });
      if (docs.length === 0) {
        return res.status(404).json({ error: 'No documents found' });
      }
      contextText = docs
        .map((d) => `Title: ${d.originalFilename}\nExcerpt: ${d.extractedText?.slice(0, 5000)}`)
        .join('\n\n');
    } else {
      contextText = 'Mock document content for sandbox testing.';
    }

    const prompt = `Generate a rigorous exam with exactly ${questionCount} questions based on the following context.
    Assign a specific 'topic' to each question.
    Allowed question types: mcq, trueFalse, shortAnswer.
    For MCQ, include exactly 4 options.
    For trueFalse, include options ["True", "False"].
    For shortAnswer, do not include options.

    The response must be STRICTLY an array of JSON objects matching this TypeScript interface:
    [{ type: string, question: string, options?: string[], correctAnswer: string, explanation: string, topic: string }]
    Return only the JSON, no markdown blocks or extra text.

    Context:
    ${contextText}`;

    let parsedQuestions;

    if (process.env.NODE_ENV === 'test' || process.env.SKIP_MONGO === 'true') {
      parsedQuestions = [
        {
          type: 'mcq',
          question: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          explanation: 'Basic math.',
          topic: 'Mathematics',
        },
        {
          type: 'shortAnswer',
          question: 'What color is the sky?',
          correctAnswer: 'blue',
          explanation: 'Due to scattering.',
          topic: 'Science',
        },
      ];
    } else {
      const aiResponse = await generateText(prompt, { jsonMode: true });
      try {
        const cleanedResponse = aiResponse
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        parsedQuestions = JSON.parse(cleanedResponse);
      } catch (e) {
        console.error('Failed to parse AI response:', aiResponse);
        return res.status(500).json({ error: 'Failed to generate a valid exam from AI.' });
      }
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60000);
    // Add a tiny buffer for network latency during submission
    const serverExpiresAt = new Date(expiresAt.getTime() + 10000);

    let examId = 'dummy_exam_id';

    if (process.env.SKIP_MONGO !== 'true') {
      const exam = new ExamModel({
        documentIds,
        userId,
        durationMinutes,
        questionCount,
        questions: parsedQuestions,
        expiresAt: serverExpiresAt,
      });

      await exam.save();
      examId = exam._id as unknown as string;
    }

    // Strip answers and explanations
    const safeExam = {
      _id: examId,
      documentIds,
      durationMinutes,
      questionCount,
      expiresAt: serverExpiresAt,
      questions: parsedQuestions.map((q: any) => ({
        type: q.type,
        question: q.question,
        options: q.options,
        topic: q.topic,
      })),
    };

    res.status(201).json(safeExam);
  } catch (error) {
    console.error('Exam generation error:', error);
    res.status(500).json({ error: 'Failed to generate exam' });
  }
});

// POST submit an exam
router.post('/:id/submit', async (req, res) => {
  const { id: examId } = req.params;
  const { answers }: { answers: AnswerSubmission[] } = req.body;
  const userId = 'user_123';

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid answers format' });
  }

  try {
    let examQuestions: any;
    let expiresAt: Date;

    if (process.env.SKIP_MONGO === 'true') {
      examQuestions = [
        {
          type: 'mcq',
          question: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          explanation: 'Basic math.',
          topic: 'Mathematics',
        },
        {
          type: 'shortAnswer',
          question: 'What color is the sky?',
          correctAnswer: 'blue',
          explanation: 'Due to scattering.',
          topic: 'Science',
        },
      ];
      // For testing, mock expiresAt to future if not requested to fail
      expiresAt = new Date(Date.now() + 60000);
    } else {
      const exam = await ExamModel.findById(examId);
      if (!exam) {
        return res.status(404).json({ error: 'Exam not found' });
      }
      examQuestions = exam.questions;
      expiresAt = exam.expiresAt;
    }

    // Process scoring regardless of expiry so progress isn't lost
    const { score, total, results, accuracyByTopic, weakTopics, suggestedRevision } = scoreExam(
      examQuestions,
      answers,
    );

    if (process.env.SKIP_MONGO !== 'true') {
      const attempt = new ExamAttemptModel({
        examId,
        userId,
        score,
        total,
        answers,
        results,
        accuracyByTopic,
        weakTopics,
        suggestedRevision,
      });
      await attempt.save();
    }

    // Reject if expired, but STILL return the performance report payload!
    const isExpired = Date.now() > expiresAt.getTime();

    if (isExpired) {
      return res.status(403).json({
        error: 'Time expired! Submission rejected.',
        report: { score, total, results, accuracyByTopic, weakTopics, suggestedRevision },
      });
    }

    res.status(200).json({ score, total, results, accuracyByTopic, weakTopics, suggestedRevision });
  } catch (error) {
    console.error('Exam submission error:', error);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

export default router;
