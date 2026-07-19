import { useState, useEffect } from 'react';
import { QuizSetup } from './components/QuizSetup';
import { QuizTaking } from './components/QuizTaking';
import { QuizResults } from './components/QuizResults';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentList } from './components/DocumentList';
import { DocumentPreview } from './components/DocumentPreview';
import {
  Difficulty,
  QuestionType,
  Quiz,
  AnswerSubmission,
  QuestionResult,
  Document,
} from '../../shared';

type AppTab = 'documents' | 'quiz';
type QuizState = 'setup' | 'taking' | 'results';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('documents');

  // Document State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  // Quiz State
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

  // Currently we use a dummy document ID for quizzes if none selected, but ideally it should tie into a doc
  // We'll just hardcode it to dummy_doc_id to maintain backwards compatibility with the previous step
  const documentId = 'dummy_doc_id';

  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiUrl}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab]);

  const handleDeleteDocument = async (id: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiUrl}/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments((docs) => docs.filter((d) => d._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

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
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            AI Study Assistant{' '}
            <span className="text-sm font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
              Beta
            </span>
          </h1>
          <nav className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'documents'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'quiz'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Quizzes
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'documents' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Upload Documents</h2>
              <DocumentUpload onUploadComplete={fetchDocuments} />
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Your Documents</h2>
              <DocumentList
                documents={documents}
                onDelete={handleDeleteDocument}
                onPreview={setPreviewDoc}
                isLoading={docsLoading}
              />
            </section>

            <DocumentPreview
              documentId={previewDoc?._id || null}
              onClose={() => setPreviewDoc(null)}
            />
          </div>
        )}

        {activeTab === 'quiz' && (
          <div>
            {quizState === 'setup' && (
              <QuizSetup onStartQuiz={handleStartQuiz} isLoading={isLoading} />
            )}
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
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
