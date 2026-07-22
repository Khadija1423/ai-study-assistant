import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import quizRoutes from './routes/quiz';
import documentRoutes from './routes/documents';
import flashcardRoutes from './routes/flashcards';
import studyPlanRoutes from './routes/studyPlans';
import examModeRoutes from './routes/examMode';
import exportRoutes from './routes/export';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Use routes
app.use('/api', quizRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/exam-mode', examModeRoutes);
app.use('/api/export', exportRoutes);

const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
