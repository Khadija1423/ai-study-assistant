import express from 'express';
import { DocumentModel } from '../models/Document';
import { FlashcardModel } from '../models/Flashcard';
import { QuizAttempt } from '../models/QuizAttempt';
import { StudyPlanModel } from '../models/StudyPlan';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const userId = 'default-user'; // Hardcoded for now

        const [
            recentDocuments,
            totalDocuments,
            totalFlashcards,
            totalQuizzes,
            quizAttempts,
            activeStudyPlan
        ] = await Promise.all([
            DocumentModel.find({ userId }).sort({ createdAt: -1 }).limit(5).exec(),
            DocumentModel.countDocuments({ userId }),
            FlashcardModel.countDocuments({ userId }),
            QuizAttempt.countDocuments({ userId }),
            QuizAttempt.find({ userId }).select('score total').exec(),
            StudyPlanModel.findOne({ userId }).sort({ createdAt: -1 }).exec()
        ]);

        let averageQuizScore = 0;
        if (quizAttempts.length > 0) {
            let totalPercentage = 0;
            quizAttempts.forEach(attempt => {
                if (attempt.total > 0) {
                     totalPercentage += (attempt.score / attempt.total) * 100;
                }
            });
            averageQuizScore = Math.round(totalPercentage / quizAttempts.length);
        }

        res.json({
            recentDocuments,
            totalDocuments,
            totalFlashcards,
            totalQuizzes,
            averageQuizScore,
            activeStudyPlan
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

export default router;
