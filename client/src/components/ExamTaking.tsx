import React, { useState, useEffect } from 'react';
import { Exam, AnswerSubmission } from '../../../shared';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

interface ExamTakingProps {
  exam: Exam;
  onSubmitExam: (answers: AnswerSubmission[]) => void;
  isSubmitting: boolean;
}

export const ExamTaking: React.FC<ExamTakingProps> = ({ exam, onSubmitExam, isSubmitting }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerSubmission[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const target = new Date(exam.expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0 && !isSubmitting) {
        // Auto submit using current accumulated answers + whatever is currently entered
        const finalAnswers = [...answers];
        if (currentAnswer.trim() && !answers.find((a) => a.questionIndex === currentIdx)) {
          finalAnswers.push({ questionIndex: currentIdx, answer: currentAnswer });
        }
        onSubmitExam(finalAnswers);
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [exam.expiresAt, isSubmitting, answers, currentAnswer, currentIdx, onSubmitExam]);

  const question = exam.questions[currentIdx];

  const handleNext = () => {
    const newAnswers = [
      ...answers.filter((a) => a.questionIndex !== currentIdx),
      { questionIndex: currentIdx, answer: currentAnswer },
    ];
    setAnswers(newAnswers);

    if (currentIdx < exam.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setCurrentAnswer('');
    } else {
      onSubmitExam(newAnswers);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 60;

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
      {/* Sidebar Navigator & Timer */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        <div
          className={`p-6 rounded-xl border flex flex-col items-center justify-center shadow-sm transition-colors ${isLowTime ? 'bg-destructive/10 border-destructive text-destructive animate-pulse' : 'bg-card border-border text-foreground'}`}
        >
          <Clock size={32} className="mb-2" />
          <div className="text-3xl font-mono font-bold tabular-nums">{formatTime(timeLeft)}</div>
          <div className="text-xs font-medium uppercase tracking-wider mt-1 opacity-80">
            Remaining
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
            Navigator
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {exam.questions.map((_, i) => {
              const isAnswered =
                answers.some((a) => a.questionIndex === i) ||
                (i === currentIdx && currentAnswer.trim() !== '');
              const isCurrent = i === currentIdx;
              return (
                <div
                  key={i}
                  className={`w-full aspect-square rounded flex items-center justify-center text-xs font-medium border ${isCurrent ? 'ring-2 ring-primary border-transparent' : isAnswered ? 'bg-secondary text-secondary-foreground border-transparent' : 'bg-background border-border text-muted-foreground'}`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Question Area (Minimal Chrome) */}
      <div className="flex-1 bg-card rounded-xl shadow-sm border border-border p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentIdx / exam.questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">
          Question {currentIdx + 1} of {exam.questions.length}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-12"
          >
            <h3 className="text-2xl font-semibold text-foreground mb-8 leading-relaxed">
              {question.question}
            </h3>

            {question.type === 'shortAnswer' ? (
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-4 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none min-h-[120px]"
              />
            ) : (
              <RadioGroup.Root
                className="flex flex-col gap-4"
                value={currentAnswer}
                onValueChange={setCurrentAnswer}
              >
                {question.options?.map((option, idx) => (
                  <div key={idx} className="flex items-center">
                    <RadioGroup.Item
                      value={option}
                      id={`e${idx}`}
                      className="bg-background w-6 h-6 rounded-full shadow-sm focus:shadow-[0_0_0_2px] focus:shadow-black outline-none cursor-default border border-primary data-[state=checked]:bg-primary flex items-center justify-center shrink-0"
                    >
                      <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-[10px] after:h-[10px] after:rounded-[50%] after:bg-background" />
                    </RadioGroup.Item>
                    <label
                      className="text-foreground text-[16px] leading-relaxed pl-4 cursor-pointer w-full p-4 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border transition-colors"
                      htmlFor={`e${idx}`}
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </RadioGroup.Root>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center pt-6 border-t border-border">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle size={16} /> No going back
          </div>
          <button
            onClick={handleNext}
            disabled={!currentAnswer.trim() || isSubmitting}
            className="px-10 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {currentIdx === exam.questions.length - 1
              ? isSubmitting
                ? 'Submitting...'
                : 'Final Submit'
              : 'Submit & Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
