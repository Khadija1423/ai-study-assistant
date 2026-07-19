import React, { useEffect, useState } from 'react';
import { Document } from '../../../shared';
import { X, FileText, Loader2, AlertCircle } from 'lucide-react';

interface DocumentPreviewProps {
  documentId: string | null;
  onClose: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ documentId, onClose }) => {
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  if (!documentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground leading-none">
                {doc?.originalFilename || 'Loading...'}
              </h3>
              {doc && <p className="text-xs text-muted-foreground mt-1">Status: {doc.status}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Extracting text preview...</p>
            </div>
          )}

          {error && (
            <div className="h-full flex flex-col items-center justify-center text-destructive">
              <AlertCircle size={32} className="mb-4" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && doc && (
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
              {doc.extractedText ? (
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                  {doc.extractedText}
                </pre>
              ) : (
                <p className="text-muted-foreground italic text-center py-8">
                  No text could be extracted from this document, or extraction failed.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
