import { useState } from 'react';
import { QuizSetup } from './components/QuizSetup';
import { QuizTaking } from './components/QuizTaking';
import { QuizResults } from './components/QuizResults';
import { Difficulty, QuestionType, Quiz, AnswerSubmission, QuestionResult } from '../../shared';

type QuizState = 'setup' | 'taking' | 'results';

function App() {
  const [quizState, setQuizState] = useState<QuizState>('setup');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<AnswerSubmission[]>([]);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    results: QuestionResult[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const documentId = 'dummy_doc_id'; // Normally passed via route

  const handleStartQuiz = async (options: {
    difficulty: Difficulty;
    types: QuestionType[];
    count: number;
  }) => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/documents/${documentId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) throw new Error('Failed to generate quiz');

      const data = await response.json();
      setQuiz(data);
      setQuizState('taking');
    } catch (error) {
      console.error(error);
      alert('Failed to generate quiz. Check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuiz = async (submittedAnswers: AnswerSubmission[]) => {
    if (!quiz?._id) return;

    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/quizzes/${quiz._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: submittedAnswers }),
      });

      if (!response.ok) throw new Error('Failed to submit quiz');

      const data = await response.json();
      setAnswers(submittedAnswers);
      setResults(data);
      setQuizState('results');
    } catch (error) {
      console.error(error);
      alert('Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            AI Study Assistant{' '}
            <span className="text-sm font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
              Beta
            </span>
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {quizState === 'setup' && <QuizSetup onStartQuiz={handleStartQuiz} isLoading={isLoading} />}

        {quizState === 'taking' && quiz && (
          <QuizTaking quiz={quiz} onSubmitQuiz={handleSubmitQuiz} isSubmitting={isSubmitting} />
        )}

        {quizState === 'results' && quiz && results && (
          <QuizResults
            quiz={quiz}
            answers={answers}
            results={results}
            onRestart={() => setQuizState('setup')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
