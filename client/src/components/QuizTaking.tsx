import React, { useState } from 'react';
import { Quiz, AnswerSubmission } from '../../../shared';
import * as Progress from '@radix-ui/react-progress';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizTakingProps {
  quiz: Quiz;
  onSubmitQuiz: (answers: AnswerSubmission[]) => void;
  isSubmitting: boolean;
}

export const QuizTaking: React.FC<QuizTakingProps> = ({ quiz, onSubmitQuiz, isSubmitting }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerSubmission[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');

  const question = quiz.questions[currentIdx];
  const progress = Math.round((currentIdx / quiz.questions.length) * 100);

  const handleNext = () => {
    const newAnswers = [...answers, { questionIndex: currentIdx, answer: currentAnswer }];
    setAnswers(newAnswers);

    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setCurrentAnswer('');
    } else {
      onSubmitQuiz(newAnswers);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-card rounded-xl shadow-sm border border-border">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Question {currentIdx + 1} of {quiz.questions.length}
          </span>
          <span>{progress}% Completed</span>
        </div>
        <Progress.Root
          className="relative overflow-hidden bg-secondary rounded-full w-full h-3"
          value={progress}
        >
          <Progress.Indicator
            className="bg-primary w-full h-full transition-transform duration-[660ms] ease-[cubic-bezier(0.65, 0, 0.35, 1)]"
            style={{ transform: `translateX(-${100 - progress}%)` }}
          />
        </Progress.Root>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-xl font-medium text-foreground mb-6">{question.question}</h3>

          {/* Answer Inputs */}
          {question.type === 'shortAnswer' ? (
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-4 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <RadioGroup.Root
              className="flex flex-col gap-3"
              value={currentAnswer}
              onValueChange={setCurrentAnswer}
            >
              {question.options?.map((option, idx) => (
                <div key={idx} className="flex items-center">
                  <RadioGroup.Item
                    value={option}
                    id={`r${idx}`}
                    className="bg-background w-6 h-6 rounded-full shadow-[0_2px_10px] shadow-black/20 focus:shadow-[0_0_0_2px] focus:shadow-black outline-none cursor-default border border-primary data-[state=checked]:bg-primary flex items-center justify-center"
                  >
                    <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-[11px] after:h-[11px] after:rounded-[50%] after:bg-background" />
                  </RadioGroup.Item>
                  <label
                    className="text-foreground text-[15px] leading-none pl-4 cursor-pointer w-full p-3 rounded hover:bg-secondary/50"
                    htmlFor={`r${idx}`}
                  >
                    {option}
                  </label>
                </div>
              ))}
            </RadioGroup.Root>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer / Next Button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleNext}
          disabled={!currentAnswer.trim() || isSubmitting}
          className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {currentIdx === quiz.questions.length - 1
            ? isSubmitting
              ? 'Submitting...'
              : 'Submit Quiz'
            : 'Next Question'}
        </button>
      </div>
    </div>
  );
};
