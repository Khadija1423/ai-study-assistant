import { Question, AnswerSubmission, QuestionResult } from '../../../shared';

export const scoreQuiz = (
  questions: Question[],
  submissions: AnswerSubmission[],
): { score: number; total: number; results: QuestionResult[] } => {
  let score = 0;
  const total = questions.length;
  const results: QuestionResult[] = [];

  for (let i = 0; i < total; i++) {
    const question = questions[i];
    const submission = submissions.find((sub) => sub.questionIndex === i);
    let correct = false;

    if (submission) {
      if (question.type === 'shortAnswer') {
        correct =
          submission.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      } else {
        correct = submission.answer === question.correctAnswer;
      }
    }

    if (correct) {
      score += 1;
    }

    results.push({
      questionIndex: i,
      correct,
      explanation: question.explanation,
    });
  }

  return { score, total, results };
};
