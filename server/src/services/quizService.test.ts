import { describe, it, expect } from 'vitest';
import { scoreQuiz } from './quizService';
import { Question, AnswerSubmission } from '../../../shared';

describe('quizService', () => {
  const questions: Question[] = [
    {
      type: 'mcq',
      question: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      explanation: 'Basic math',
    },
    {
      type: 'trueFalse',
      question: 'The sky is blue',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'Rayleigh scattering',
    },
    {
      type: 'shortAnswer',
      question: 'What is the capital of France?',
      correctAnswer: 'Paris',
      explanation: 'Paris is the capital.',
    },
  ];

  it('scores MCQ correctly', () => {
    const submissions: AnswerSubmission[] = [{ questionIndex: 0, answer: '4' }];
    const result = scoreQuiz(questions, submissions);
    expect(result.results[0].correct).toBe(true);
    expect(result.score).toBe(1);
  });

  it('scores True/False correctly', () => {
    const submissions: AnswerSubmission[] = [{ questionIndex: 1, answer: 'True' }];
    const result = scoreQuiz(questions, submissions);
    expect(result.results[1].correct).toBe(true);
    expect(result.score).toBe(1);
  });

  it('scores Short Answer case-insensitively with trim', () => {
    const submissions: AnswerSubmission[] = [{ questionIndex: 2, answer: '  pArIs   ' }];
    const result = scoreQuiz(questions, submissions);
    expect(result.results[2].correct).toBe(true);
    expect(result.score).toBe(1);
  });

  it('marks incorrect answers correctly', () => {
    const submissions: AnswerSubmission[] = [
      { questionIndex: 0, answer: '5' },
      { questionIndex: 1, answer: 'False' },
      { questionIndex: 2, answer: 'London' },
    ];
    const result = scoreQuiz(questions, submissions);
    expect(result.score).toBe(0);
    expect(result.results[0].correct).toBe(false);
    expect(result.results[1].correct).toBe(false);
    expect(result.results[2].correct).toBe(false);
  });

  it('handles missing submissions', () => {
    const submissions: AnswerSubmission[] = [];
    const result = scoreQuiz(questions, submissions);
    expect(result.score).toBe(0);
    expect(result.results.length).toBe(3);
  });
});
