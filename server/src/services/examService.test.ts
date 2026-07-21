import { describe, it, expect } from 'vitest';
import { scoreExam } from './examService';
import { ExamQuestion, AnswerSubmission } from '../../../shared';

describe('examService', () => {
  const questions: ExamQuestion[] = [
    {
      type: 'mcq',
      question: 'Q1',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      explanation: 'exp',
      topic: 'Math',
    },
    {
      type: 'mcq',
      question: 'Q2',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'B',
      explanation: 'exp',
      topic: 'Math',
    },
    {
      type: 'trueFalse',
      question: 'Q3',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'exp',
      topic: 'Science',
    },
  ];

  it('calculates accuracy by topic and identifies weak topics below 60%', () => {
    // 1/2 correct in Math (50%), 1/1 correct in Science (100%)
    const submissions: AnswerSubmission[] = [
      { questionIndex: 0, answer: 'A' }, // correct
      { questionIndex: 1, answer: 'C' }, // wrong
      { questionIndex: 2, answer: 'True' }, // correct
    ];

    const result = scoreExam(questions, submissions);

    expect(result.score).toBe(2);
    expect(result.accuracyByTopic.length).toBe(2);

    const mathAcc = result.accuracyByTopic.find((t) => t.topic === 'Math');
    expect(mathAcc?.accuracy).toBe(50);

    const scienceAcc = result.accuracyByTopic.find((t) => t.topic === 'Science');
    expect(scienceAcc?.accuracy).toBe(100);

    expect(result.weakTopics.length).toBe(1);
    expect(result.weakTopics[0]).toBe('Math');
  });
});
