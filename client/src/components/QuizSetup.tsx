import React, { useState } from 'react';
import { Difficulty, QuestionType } from '../../../shared';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Slider from '@radix-ui/react-slider';
import { Check, Brain, Zap, Flame } from 'lucide-react';

interface QuizSetupProps {
  onStartQuiz: (options: { difficulty: Difficulty; types: QuestionType[]; count: number }) => void;
  isLoading: boolean;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({ onStartQuiz, isLoading }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [types, setTypes] = useState<QuestionType[]>(['mcq', 'trueFalse']);
  const [count, setCount] = useState<number>(5);

  const handleTypeToggle = (type: QuestionType) => {
    setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const difficultyOptions = [
    {
      value: 'easy',
      label: 'Easy',
      icon: <Brain size={24} />,
      color: 'bg-green-100 border-green-500 text-green-700',
    },
    {
      value: 'medium',
      label: 'Medium',
      icon: <Zap size={24} />,
      color: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    },
    {
      value: 'hard',
      label: 'Hard',
      icon: <Flame size={24} />,
      color: 'bg-red-100 border-red-500 text-red-700',
    },
  ];

  const handleStart = () => {
    if (types.length === 0) {
      alert('Please select at least one question type.');
      return;
    }
    onStartQuiz({ difficulty, types, count });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-xl shadow-sm border border-border">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Create a Quiz</h2>

      {/* Difficulty Cards */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-foreground mb-4">Difficulty</label>
        <div className="grid grid-cols-3 gap-4">
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDifficulty(opt.value as Difficulty)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                difficulty === opt.value
                  ? opt.color + ' ring-2 ring-primary ring-offset-2'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {opt.icon}
              <span className="font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Question Types Checkboxes */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-foreground mb-4">Question Types</label>
        <div className="flex gap-6">
          {(['mcq', 'trueFalse', 'shortAnswer'] as QuestionType[]).map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox.Root
                id={type}
                checked={types.includes(type)}
                onCheckedChange={() => handleTypeToggle(type)}
                className="flex h-5 w-5 items-center justify-center rounded bg-background border border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 data-[state=checked]:bg-primary data-[state=checked]:text-white"
              >
                <Checkbox.Indicator>
                  <Check size={14} />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label htmlFor={type} className="text-sm font-medium leading-none cursor-pointer">
                {type === 'mcq'
                  ? 'Multiple Choice'
                  : type === 'trueFalse'
                    ? 'True / False'
                    : 'Short Answer'}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Count Slider */}
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          <label className="text-sm font-medium text-foreground">Number of Questions</label>
          <span className="text-sm font-bold text-primary">{count}</span>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[count]}
          onValueChange={(val) => setCount(val[0])}
          max={20}
          min={3}
          step={1}
        >
          <Slider.Track className="bg-secondary relative grow rounded-full h-2">
            <Slider.Range className="absolute bg-primary rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb className="block w-5 h-5 bg-primary rounded-full shadow-[0_2px_10px] shadow-black/20 hover:bg-primary/90 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-primary/20 cursor-grab active:cursor-grabbing" />
        </Slider.Root>
      </div>

      <button
        onClick={handleStart}
        disabled={isLoading}
        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
      >
        {isLoading ? 'Generating Quiz...' : 'Start Quiz'}
      </button>
    </div>
  );
};
