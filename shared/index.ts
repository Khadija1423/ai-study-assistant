export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'trueFalse' | 'shortAnswer';

export interface Question {
  type: QuestionType;
  question: string;
  options?: string[]; // Only for MCQ and trueFalse
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  _id?: string;
  documentId: string;
  userId: string;
  difficulty: Difficulty;
  questions: Question[];
  createdAt: Date;
}

export interface AnswerSubmission {
  questionIndex: number;
  answer: string;
}

export interface QuestionResult {
  questionIndex: number;
  correct: boolean;
  explanation: string;
}

export interface QuizAttempt {
  _id?: string;
  quizId: string;
  userId: string;
  score: number;
  total: number;
  answers: AnswerSubmission[];
  results: QuestionResult[];
  createdAt: Date;
}

export type DocumentStatus = 'processing' | 'ready' | 'failed';

export interface Document {
  _id?: string;
  userId: string;
  originalFilename: string;
  fileType: string;
  storagePath: string; // The GridFS filename/id
  extractedText?: string;
  status: DocumentStatus;
  errorMessage?: string;
  summary?: Summary;
  createdAt: Date;
}

export interface Chunk {
  _id?: string;
  documentId: string;
  userId: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  embedding?: number[];
}

export interface TermDefinition {
  term: string;
  definition: string;
}

export interface Summary {
  shortSummary: string;
  keyPoints: string[];
  definitions: TermDefinition[];
  examFocusNotes: string[];
}

export interface ChatMessage {
  _id?: string;
  documentId: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  sourceChunks?: { chunkIndex: number; excerpt: string }[];
  createdAt: Date;
}

export interface Flashcard {
  _id?: string;
  documentId: string;
  userId: string;
  question: string;
  answer: string;
  topic: string;
  isFavorited: boolean;
  createdAt: Date;
}

export interface StudyTopic {
  topic: string;
  documentId: string;
  minutes: number;
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
}

export interface StudyPlanDay {
  date: string;
  topics: StudyTopic[];
  totalMinutes: number;
}

export interface StudyPlan {
  _id?: string;
  userId: string;
  examDate: string;
  hoursPerDay: number;
  documentIds: string[];
  days: StudyPlanDay[];
  createdAt: Date;
}
