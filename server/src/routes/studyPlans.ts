import { Router } from 'express';
import { StudyPlanModel } from '../models/StudyPlan';
import { DocumentModel } from '../models/Document';
import { generateText } from '../ai/client';

const router = Router();

// GET all study plans for a user
router.get('/', async (req, res) => {
  const userId = 'user_123';
  try {
    const plans = await StudyPlanModel.find({ userId }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch study plans' });
  }
});

// GET single study plan
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = 'user_123';
  try {
    const plan = await StudyPlanModel.findOne({ _id: id, userId });
    if (!plan) return res.status(404).json({ error: 'Study plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch study plan' });
  }
});

// POST generate new study plan
router.post('/', async (req, res) => {
  const userId = 'user_123';
  const { examDate, hoursPerDay, documentIds } = req.body;

  if (!examDate || !hoursPerDay || !documentIds || documentIds.length === 0) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Collect context from documents
    let contextText = '';

    if (process.env.SKIP_MONGO !== 'true') {
      const docs = await DocumentModel.find({ _id: { $in: documentIds }, userId });

      if (docs.length === 0) {
        return res.status(404).json({ error: 'No documents found' });
      }

      contextText = docs
        .map((d) => {
          const sumText = d.summary ? JSON.stringify(d.summary) : '';
          const rawText = d.extractedText ? d.extractedText.slice(0, 5000) : '';
          return `Document ID: ${d._id}\nTitle: ${d.originalFilename}\nSummary: ${sumText}\nExcerpt: ${rawText}`;
        })
        .join('\n\n---\n\n');
    } else {
      contextText = `Document ID: dummy_doc_id\nTitle: Dummy Doc\nSummary: Mock summary topics include mock testing.`;
    }

    const prompt = `You are an expert study planner. I have an exam on ${examDate} and can study for ${hoursPerDay} hours per day.
    Based on the following documents, generate a day-by-day study schedule.

    Return STRICTLY JSON matching this interface:
    {
      "days": [
        {
          "date": "string (YYYY-MM-DD)",
          "topics": [
            {
              "topic": "string (specific concept to study)",
              "documentId": "string (must match one of the provided Document IDs)",
              "minutes": number (duration for this topic),
              "priority": "high" | "medium" | "low"
            }
          ],
          "totalMinutes": number (sum of topic minutes for this day, must not exceed ${hoursPerDay * 60})
        }
      ]
    }

    Documents:
    ${contextText}
    `;

    let parsedPlan: any = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        let aiResponse;
        if (
          (process.env.NODE_ENV === 'test' && process.env.MOCK_AI !== 'false') ||
          process.env.SKIP_MONGO === 'true'
        ) {
          aiResponse = JSON.stringify({
            days: [
              {
                date: examDate,
                totalMinutes: 60,
                topics: [
                  {
                    topic: 'Mock Topic',
                    documentId: documentIds[0],
                    minutes: 60,
                    priority: 'high',
                  },
                ],
              },
            ],
          });
        } else {
          aiResponse = await generateText(prompt, { jsonMode: true });
        }

        const cleanedResponse = aiResponse
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        parsedPlan = JSON.parse(cleanedResponse);

        if (!parsedPlan || !Array.isArray(parsedPlan.days)) {
          throw new Error('Invalid JSON structure returned by AI');
        }

        break; // Success
      } catch (e) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Failed to parse AI plan after retries');
        }
      }
    }

    if (!parsedPlan) {
      return res.status(500).json({ error: 'Failed to generate plan' });
    }

    // Validation to strictly enforce hoursPerDay (AI sometimes hallucinates)
    const maxMinutes = hoursPerDay * 60;
    parsedPlan.days = parsedPlan.days.map((day: any) => {
      let currentMinutes = 0;
      day.topics = day.topics.filter((topic: any) => {
        if (currentMinutes + topic.minutes <= maxMinutes) {
          currentMinutes += topic.minutes;
          return true;
        }
        return false;
      });
      day.totalMinutes = currentMinutes;
      return day;
    });

    const newPlan = new StudyPlanModel({
      userId,
      examDate,
      hoursPerDay,
      documentIds,
      days: parsedPlan.days,
    });

    if (process.env.SKIP_MONGO !== 'true') {
      await newPlan.save();
    }

    // Return mocked id if testing
    if (process.env.SKIP_MONGO === 'true') {
      newPlan._id = 'mock_plan_123' as any;
    }

    res.status(201).json(newPlan);
  } catch (error) {
    console.error('Study plan generation error:', error);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

// PATCH mark topic complete
router.patch('/:id/days/:date/topics/:topicIndex/complete', async (req, res) => {
  const { id, date, topicIndex } = req.params;
  const userId = 'user_123';

  try {
    if (process.env.SKIP_MONGO === 'true') {
      return res.json({ success: true, completed: true });
    }

    const plan = await StudyPlanModel.findOne({ _id: id, userId });
    if (!plan) return res.status(404).json({ error: 'Study plan not found' });

    const day = plan.days.find((d) => d.date === date);
    if (!day) return res.status(404).json({ error: 'Date not found in plan' });

    const tIdx = parseInt(topicIndex, 10);
    if (isNaN(tIdx) || tIdx < 0 || tIdx >= day.topics.length) {
      return res.status(400).json({ error: 'Invalid topic index' });
    }

    // Toggle completion
    day.topics[tIdx].completed = !day.topics[tIdx].completed;

    await plan.save();
    res.json({ success: true, completed: day.topics[tIdx].completed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update topic status' });
  }
});

export default router;
