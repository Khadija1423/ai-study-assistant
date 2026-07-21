import React, { useState } from 'react';
import { Document } from '../../../shared';
import { Clock, AlertTriangle, FileText, Check, Loader2 } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';

interface ExamSetupProps {
  documents: Document[];
  onStartExam: (options: {
    documentIds: string[];
    durationMinutes: number;
    questionCount: number;
  }) => void;
  isGenerating: boolean;
}

export const ExamSetup: React.FC<ExamSetupProps> = ({ documents, onStartExam, isGenerating }) => {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questionCount, setQuestionCount] = useState(15);

  const toggleDoc = (id: string) => {
    const next = new Set(selectedDocs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDocs(next);
  };

  const handleStart = () => {
    if (selectedDocs.size === 0) return alert('Please select at least one document.');
    onStartExam({
      documentIds: Array.from(selectedDocs),
      durationMinutes,
      questionCount,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-xl shadow-sm border border-border">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Exam Mode</h2>
          <p className="text-sm text-muted-foreground">
            Strict conditions. No hints. No going back.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-foreground mb-4">
            Select Source Documents
          </label>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground italic p-4 border border-dashed rounded-lg">
              No documents available. Please upload some first.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => toggleDoc(doc._id!)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-colors ${selectedDocs.has(doc._id!) ? 'bg-primary/5 border-primary' : 'bg-background border-border hover:bg-muted/50'}`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border ${selectedDocs.has(doc._id!) ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'}`}
                  >
                    {selectedDocs.has(doc._id!) && <Check size={14} />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-foreground truncate">
                      {doc.originalFilename}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock size={16} /> Duration
              </label>
              <span className="text-sm font-bold text-primary">{durationMinutes} mins</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[durationMinutes]}
              onValueChange={(val) => setDurationMinutes(val[0])}
              max={120}
              min={5}
              step={5}
            >
              <Slider.Track className="bg-secondary relative grow rounded-full h-2">
                <Slider.Range className="absolute bg-primary rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-primary rounded-full shadow hover:bg-primary/90 focus:outline-none" />
            </Slider.Root>
          </div>

          <div>
            <div className="flex justify-between mb-4">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText size={16} /> Questions
              </label>
              <span className="text-sm font-bold text-primary">{questionCount}</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[questionCount]}
              onValueChange={(val) => setQuestionCount(val[0])}
              max={50}
              min={5}
              step={5}
            >
              <Slider.Track className="bg-secondary relative grow rounded-full h-2">
                <Slider.Range className="absolute bg-primary rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-primary rounded-full shadow hover:bg-primary/90 focus:outline-none" />
            </Slider.Root>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <strong>Warning:</strong> Once started, you cannot pause the timer or return to previous
          questions. The exam will automatically submit when time expires.
        </div>

        <button
          onClick={handleStart}
          disabled={isGenerating || selectedDocs.size === 0}
          className="w-full py-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" /> Generating Exam...
            </>
          ) : (
            'Start Exam Now'
          )}
        </button>
      </div>
    </div>
  );
};
