import React, { useState } from 'react';
import { Summary } from '../../../shared';
import { FileText, Sparkles, BookOpen, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface DocumentSummaryProps {
  summary: Summary | null;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export const DocumentSummary: React.FC<DocumentSummaryProps> = ({
  summary,
  onRegenerate,
  isGenerating,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'keyPoints' | 'definitions' | 'examFocus'
  >('overview');

  if (isGenerating) {
    return (
      <div className="w-full space-y-6 mt-8 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-muted rounded-xl w-full"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-xl w-full"></div>
          <div className="h-24 bg-muted rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="text-primary" /> AI Summary
        </h3>
        <button
          onClick={() => {
            if (window.confirm('Regenerating costs an API call. Are you sure?')) {
              onRegenerate();
            }
          }}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw size={16} /> Regenerate
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6 overflow-x-auto hide-scrollbar">
        {['overview', 'keyPoints', 'definitions', 'examFocus'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'keyPoints' && 'Key Points'}
            {tab === 'definitions' && 'Definitions'}
            {tab === 'examFocus' && 'Exam Focus'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[300px]">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {summary.shortSummary}
            </p>
          </motion.div>
        )}

        {activeTab === 'keyPoints' && (
          <div className="space-y-4">
            {summary.keyPoints.map((point, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="flex items-start gap-3 p-4 rounded-lg bg-background border border-border"
              >
                <div className="mt-1 p-1.5 bg-primary/10 rounded-md text-primary shrink-0">
                  <FileText size={16} />
                </div>
                <p className="text-foreground">{point}</p>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'definitions' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summary.definitions.map((def, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={i}
                className="group relative h-32 [perspective:1000px]"
              >
                <div className="absolute inset-0 w-full h-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  {/* Front */}
                  <div className="absolute inset-0 w-full h-full p-6 bg-background border border-border rounded-xl flex items-center justify-center [backface-visibility:hidden]">
                    <h4 className="text-lg font-bold text-center text-foreground">{def.term}</h4>
                  </div>
                  {/* Back */}
                  <div className="absolute inset-0 w-full h-full p-4 bg-primary text-primary-foreground rounded-xl flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto">
                    <p className="text-sm text-center">{def.definition}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'examFocus' && (
          <div className="space-y-4">
            {summary.examFocusNotes.map((note, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="flex items-start gap-4 p-5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900"
              >
                <div className="mt-0.5 text-amber-600 dark:text-amber-500 shrink-0">
                  <BookOpen size={24} />
                </div>
                <p className="text-amber-900 dark:text-amber-200 font-medium">{note}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
