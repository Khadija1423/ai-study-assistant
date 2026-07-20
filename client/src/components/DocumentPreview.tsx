import React, { useEffect, useState } from 'react';
import { Document, Summary } from '../../../shared';
import { X, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { DocumentSummary } from './DocumentSummary';

interface DocumentPreviewProps {
  documentId: string | null;
  onClose: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ documentId, onClose }) => {
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (!documentId) return;

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${apiUrl}/documents/${documentId}`);
        if (!res.ok) throw new Error('Failed to fetch document details');
        const data = await res.json();
        setDoc(data);

        // Try to fetch summary if it exists
        try {
          const summaryRes = await fetch(`${apiUrl}/documents/${documentId}/summary`);
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            setSummary(summaryData);
          }
        } catch (e) {
          // Summary fetch failed, ignore (it might not exist yet)
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const handleGenerateSummary = async () => {
    if (!documentId) return;
    setGeneratingSummary(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiUrl}/documents/${documentId}/summary`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to generate summary');
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (!documentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground leading-none truncate max-w-xs">
                {doc?.originalFilename || 'Loading...'}
              </h3>
              {doc && <p className="text-xs text-muted-foreground mt-1">Status: {doc.status}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!summary && !loading && !error && doc?.status === 'ready' && (
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {generatingSummary ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Summarize
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Loading document details...</p>
            </div>
          )}

          {error && (
            <div className="h-full flex flex-col items-center justify-center text-destructive">
              <AlertCircle size={32} className="mb-4" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && doc && (
            <div className="space-y-8">
              {/* Raw Text Preview */}
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4">Extracted Text Preview</h3>
                {doc.extractedText ? (
                  <div className="h-64 overflow-y-auto bg-muted/50 rounded p-4 border border-border">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                      {doc.extractedText}
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-center py-8">
                    No text could be extracted from this document, or extraction failed.
                  </p>
                )}
              </div>

              {/* Summary Section */}
              {(summary || generatingSummary) && (
                <DocumentSummary
                  summary={summary}
                  isGenerating={generatingSummary}
                  onRegenerate={handleGenerateSummary}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
