import React, { useEffect, useState } from 'react';
import { Quiz, QuestionResult, AnswerSubmission } from '../../../shared';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuizResultsProps {
  quiz: Quiz;
  answers: AnswerSubmission[];
  results: { score: number; total: number; results: QuestionResult[] };
  onRestart: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ quiz, answers, results, onRestart }) => {
  const percentage = Math.round((results.score / results.total) * 100);
  const [displayPercentage, setDisplayPercentage] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = percentage / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= percentage) {
        setDisplayPercentage(percentage);
        clearInterval(timer);
      } else {
        setDisplayPercentage(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [percentage]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* Score Ring */}
      <div className="bg-card rounded-xl p-8 shadow-sm border border-border flex flex-col items-center justify-center">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-secondary"
            />
            <motion.circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className={
                percentage >= 70
                  ? 'text-green-500'
                  : percentage >= 40
                    ? 'text-yellow-500'
                    : 'text-red-500'
              }
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-foreground">
            <span className="text-5xl font-bold">{displayPercentage}%</span>
            <span className="text-sm text-muted-foreground mt-1">
              {results.score} / {results.total}
            </span>
          </div>
        </div>
        <h2 className="text-2xl font-bold mt-6 text-foreground">
          {percentage >= 80 ? 'Outstanding!' : percentage >= 60 ? 'Good Job!' : 'Keep Practicing!'}
        </h2>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground mb-4">Detailed Review</h3>
        {results.results.map((res, i) => {
          const q = quiz.questions[i];
          const ans = answers.find((a) => a.questionIndex === i)?.answer;

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className={`p-5 rounded-xl border ${res.correct ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'}`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {res.correct ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                    >
                      <CheckCircle2 className="text-green-600 dark:text-green-400" size={24} />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ x: -5 }}
                      animate={{ x: [0, -5, 5, -5, 5, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <XCircle className="text-red-600 dark:text-red-400" size={24} />
                    </motion.div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-2">
                    {i + 1}. {q.question}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Your answer: <span className="font-semibold">{ans}</span>
                  </p>
                  <div className="mt-3 text-sm bg-background/50 p-3 rounded-lg border border-border/50">
                    <span className="font-semibold mr-1">Explanation/Answer:</span>{' '}
                    {res.explanation}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center mt-8 pt-4">
        <button
          onClick={onRestart}
          className="px-8 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-lg transition-colors"
        >
          Create Another Quiz
        </button>
      </div>
    </div>
  );
};
