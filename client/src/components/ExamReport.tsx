import React, { useEffect, useState } from 'react';
import { ExamAttempt, Exam } from '../../../shared';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, BookOpen, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExamReportProps {
  attempt: ExamAttempt;
  exam: Exam;
  onClose: () => void;
}

export const ExamReport: React.FC<ExamReportProps> = ({ attempt, onClose }) => {
  const percentage = Math.round((attempt.score / attempt.total) * 100);
  const [displayPercentage, setDisplayPercentage] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = percentage / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= percentage) {
        setDisplayPercentage(percentage);
        clearInterval(timer);
      } else {
        setDisplayPercentage(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [percentage]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Overview */}
      <div className="bg-card border border-border rounded-xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-secondary"
            />
            <motion.circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className={
                percentage >= 80
                  ? 'text-green-500'
                  : percentage >= 60
                    ? 'text-yellow-500'
                    : 'text-red-500'
              }
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-foreground">
            <span className="text-5xl font-bold">{displayPercentage}%</span>
            <span className="text-sm text-muted-foreground mt-1">Score</span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-foreground mb-2">Exam Completed</h2>
          <p className="text-muted-foreground text-lg mb-6">
            You scored {attempt.score} out of {attempt.total} correctly.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {attempt.accuracyByTopic.length}
              </div>
              <div className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                Topics Tested
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{attempt.weakTopics.length}</div>
              <div className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                Weak Topics
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
            <Target className="text-primary" size={20} /> Topic Accuracy
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attempt.accuracyByTopic}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="topic"
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                  {attempt.accuracyByTopic.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.accuracy >= 80
                          ? '#22c55e'
                          : entry.accuracy >= 60
                            ? '#eab308'
                            : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Revisions */}
        <div className="bg-card border border-border rounded-xl p-0 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border bg-amber-50/50 dark:bg-amber-950/20">
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-500 flex items-center gap-2">
              <BookOpen size={20} /> Suggested Revision
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
              Based on topics scoring under 60%.
            </p>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            {attempt.suggestedRevision.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-3">
                  ✓
                </div>
                <p className="font-medium text-foreground">No weak topics detected!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Great job mastering the material.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {attempt.suggestedRevision.map((rev, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 group cursor-pointer hover:bg-muted p-2 -mx-2 rounded transition-colors"
                  >
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div>
                    <span className="text-sm font-medium text-foreground flex-1">{rev}</span>
                    <ChevronRight
                      size={16}
                      className="text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-lg transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
