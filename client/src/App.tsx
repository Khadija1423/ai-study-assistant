import { useState, useEffect } from 'react';
import { QuizSetup } from './components/QuizSetup';
import { QuizTaking } from './components/QuizTaking';
import { QuizResults } from './components/QuizResults';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentList } from './components/DocumentList';
import { DocumentPreview } from './components/DocumentPreview';
import { Flashcards } from './components/Flashcards';
import { StudyPlanSetup } from './components/StudyPlanSetup';
import { StudyPlanView } from './components/StudyPlanView';
import {
  Difficulty,
  QuestionType,
  Quiz,
  AnswerSubmission,
  QuestionResult,
  Document,
  StudyPlan,
} from '../../shared';

type AppTab = 'documents' | 'quiz' | 'flashcards' | 'studyPlan';
type QuizState = 'setup' | 'taking' | 'results';
type StudyPlanState = 'setup' | 'view';

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

  // Study Plan State
  const [studyPlanState, setStudyPlanState] = useState<StudyPlanState>('setup');
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Flashcards state
  // Typically you'd pick a document first to see flashcards, we'll hardcode dummy_doc_id
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
    if (activeTab === 'documents' || activeTab === 'studyPlan') {
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

  // --- Quiz Functions ---
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

  // --- Study Plan Functions ---
  const handleGenerateStudyPlan = async (options: {
    examDate: string;
    hoursPerDay: number;
    documentIds: string[];
  }) => {
    setIsGeneratingPlan(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/study-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) throw new Error('Failed to generate study plan');

      const data = await response.json();
      setStudyPlan(data);
      setStudyPlanState('view');
    } catch (error) {
      console.error(error);
      alert('Failed to generate study plan.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleTopicToggle = async (date: string, topicIndex: number) => {
    if (!studyPlan?._id) return;

    // Optimistic update
    const updatedPlan = { ...studyPlan };
    const dayIndex = updatedPlan.days.findIndex((d) => d.date === date);
    if (dayIndex >= 0) {
      updatedPlan.days[dayIndex].topics[topicIndex].completed =
        !updatedPlan.days[dayIndex].topics[topicIndex].completed;
      setStudyPlan(updatedPlan);
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      await fetch(
        `${apiUrl}/study-plans/${studyPlan._id}/days/${date}/topics/${topicIndex}/complete`,
        {
          method: 'PATCH',
        },
      );
    } catch (error) {
      console.error('Failed to toggle topic', error);
      // Revert optimism if failed
      const revertedPlan = { ...updatedPlan };
      if (dayIndex >= 0) {
        revertedPlan.days[dayIndex].topics[topicIndex].completed =
          !revertedPlan.days[dayIndex].topics[topicIndex].completed;
        setStudyPlan(revertedPlan);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center overflow-x-auto">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2 whitespace-nowrap mr-4">
            AI Study Assistant{' '}
            <span className="text-sm font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
              Beta
            </span>
          </h1>
          <nav className="flex space-x-1 bg-muted p-1 rounded-lg shrink-0">
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
              onClick={() => setActiveTab('studyPlan')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'studyPlan'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Study Plans
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
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'flashcards'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Flashcards
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        {activeTab === 'studyPlan' && (
          <div>
            {studyPlanState === 'setup' && (
              <StudyPlanSetup
                documents={documents}
                isGenerating={isGeneratingPlan}
                onGenerate={handleGenerateStudyPlan}
              />
            )}
            {studyPlanState === 'view' && studyPlan && (
              <StudyPlanView
                plan={studyPlan}
                onTopicToggle={handleTopicToggle}
                onBack={() => setStudyPlanState('setup')}
              />
            )}
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

        {activeTab === 'flashcards' && <Flashcards documentId={documentId} />}
      </main>
    </div>
  );
}

export default App;
