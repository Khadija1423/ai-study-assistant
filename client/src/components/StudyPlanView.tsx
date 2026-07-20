import React from 'react';
import { StudyPlan } from '../../../shared';
import { CheckCircle2, Circle, Clock, Flame, Zap, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface StudyPlanViewProps {
  plan: StudyPlan;
  onTopicToggle: (date: string, topicIndex: number) => void;
  onBack: () => void;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({ plan, onTopicToggle, onBack }) => {
  // Calculate urgency based on day index (closer to end = more urgent)
  const totalDays = plan.days.length;

  const totalTopics = plan.days.reduce((acc, day) => acc + day.topics.length, 0);
  const completedTopics = plan.days.reduce(
    (acc, day) => acc + day.topics.filter((t) => t.completed).length,
    0,
  );
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header & Progress */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Setup
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Your Study Plan</h2>
            <p className="text-muted-foreground text-sm">
              Target Exam Date:{' '}
              <span className="font-semibold text-foreground">{plan.examDate}</span>
            </p>
          </div>
          <div className="w-full md:w-64">
            <div className="flex justify-between text-sm mb-1 font-medium">
              <span>Overall Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar / Timeline */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {plan.days.map((day, dayIndex) => {
          // Urgency styling: from subtle blue/gray to intense amber/red as we approach exam
          const urgencyRatio = totalDays > 1 ? dayIndex / (totalDays - 1) : 1;
          // E.g., background shifts slightly warmer
          const isNearExam = urgencyRatio > 0.7;

          return (
            <div
              key={day.date}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              {/* Timeline Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-secondary text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Clock size={16} />
              </div>

              {/* Day Card */}
              <div
                className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl border shadow-sm transition-colors ${isNearExam ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50' : 'bg-card border-border'}`}
              >
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-border/50">
                  <div>
                    <h4 className="font-bold text-foreground text-lg">
                      {new Date(day.date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </h4>
                    <p className="text-xs text-muted-foreground">{day.totalMinutes} mins total</p>
                  </div>
                  {isNearExam && <Flame size={20} className="text-amber-500" />}
                </div>

                <div className="space-y-3">
                  {day.topics.map((topic, tIdx) => {
                    const isHigh = topic.priority === 'high';
                    const isMed = topic.priority === 'medium';
                    const priorityColor = isHigh
                      ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                      : isMed
                        ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                        : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
                    const priorityIcon = isHigh ? (
                      <Flame size={12} className="mr-1" />
                    ) : isMed ? (
                      <Zap size={12} className="mr-1" />
                    ) : null;

                    return (
                      <motion.div
                        layout
                        key={tIdx}
                        onClick={() => onTopicToggle(day.date, tIdx)}
                        className={`group/topic flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${topic.completed ? 'bg-muted/50 border-transparent opacity-60' : 'bg-background border-border hover:border-primary/50 hover:shadow-sm'}`}
                      >
                        <button
                          className={`mt-0.5 shrink-0 transition-colors ${topic.completed ? 'text-primary' : 'text-muted-foreground group-hover/topic:text-primary/70'}`}
                        >
                          {topic.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium transition-all ${topic.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                          >
                            {topic.topic}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock size={12} className="mr-1" /> {topic.minutes}m
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center uppercase font-bold tracking-wider ${priorityColor}`}
                            >
                              {priorityIcon} {topic.priority}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
