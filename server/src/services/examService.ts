import { ExamQuestion, AnswerSubmission, QuestionResult, TopicAccuracy } from '../../../shared';

export const scoreExam = (
  questions: ExamQuestion[],
  submissions: AnswerSubmission[],
): {
  score: number;
  total: number;
  results: QuestionResult[];
  accuracyByTopic: TopicAccuracy[];
  weakTopics: string[];
  suggestedRevision: string[];
} => {
  let score = 0;
  const total = questions.length;
  const results: QuestionResult[] = [];

  const topicStats: Record<string, { correct: number; total: number }> = {};

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

    if (!topicStats[question.topic]) {
      topicStats[question.topic] = { correct: 0, total: 0 };
    }
    topicStats[question.topic].total += 1;
    if (correct) {
      topicStats[question.topic].correct += 1;
    }
  }

  const accuracyByTopic: TopicAccuracy[] = [];
  const weakTopics: string[] = [];
  const suggestedRevision: string[] = [];

  for (const [topic, stats] of Object.entries(topicStats)) {
    const accuracy = Math.round((stats.correct / stats.total) * 100);
    accuracyByTopic.push({ topic, correct: stats.correct, total: stats.total, accuracy });

    if (accuracy < 60) {
      weakTopics.push(topic);
      suggestedRevision.push(`Review the topic: ${topic}. Focus on key definitions and concepts.`);
    }
  }

  return { score, total, results, accuracyByTopic, weakTopics, suggestedRevision };
};
