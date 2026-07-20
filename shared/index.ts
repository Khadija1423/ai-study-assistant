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
  createdAt: Date;
}

export interface Chunk {
  _id?: string;
  documentId: string;
  userId: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
}
