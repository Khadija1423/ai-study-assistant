import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Check, Loader2 } from 'lucide-react';
import { Document } from '../../../shared';

interface StudyPlanSetupProps {
  documents: Document[];
  onGenerate: (options: { examDate: string; hoursPerDay: number; documentIds: string[] }) => void;
  isGenerating: boolean;
}

export const StudyPlanSetup: React.FC<StudyPlanSetupProps> = ({
  documents,
  onGenerate,
  isGenerating,
}) => {
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const toggleDoc = (id: string) => {
    const next = new Set(selectedDocs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDocs(next);
  };

  const handleStart = () => {
    if (!examDate) return alert('Please select an exam date.');
    if (selectedDocs.size === 0) return alert('Please select at least one document.');

    onGenerate({
      examDate,
      hoursPerDay,
      documentIds: Array.from(selectedDocs),
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-xl shadow-sm border border-border">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Create a Study Plan</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <CalendarIcon size={16} className="text-primary" /> Exam Date
          </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Hours Per Day
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="font-bold text-foreground w-12 text-right">{hoursPerDay}h</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-foreground mb-4">
          Select Documents to Study
        </label>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground italic p-4 border border-dashed rounded-lg">
            No documents available. Please upload some first.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
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
                  <p className="text-xs text-muted-foreground truncate">{doc.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleStart}
        disabled={isGenerating || selectedDocs.size === 0 || !examDate}
        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="animate-spin mr-2" /> Generating Plan...
          </>
        ) : (
          'Generate Study Plan'
        )}
      </button>
    </div>
  );
};
