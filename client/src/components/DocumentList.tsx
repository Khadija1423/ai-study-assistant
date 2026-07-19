import React, { useState } from 'react';
import { Document } from '../../../shared';
import { FileText, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
  onPreview: (doc: Document) => void;
  isLoading: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDelete,
  onPreview,
  isLoading,
}) => {
  const [, setDeletingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={24} />
        <span>Loading documents...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-border rounded-xl bg-card/50">
        <div className="inline-flex p-4 rounded-full bg-secondary/50 text-muted-foreground mb-4">
          <FileText size={32} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No documents yet</h3>
        <p className="text-muted-foreground">Upload your first document above to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
              <FileText size={24} />
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-background shrink-0">
              {doc.status === 'processing' && (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-amber-700 dark:text-amber-400">Processing</span>
                </>
              )}
              {doc.status === 'ready' && (
                <>
                  <CheckCircle2 size={12} className="text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-400">Ready</span>
                </>
              )}
              {doc.status === 'failed' && (
                <>
                  <AlertCircle size={12} className="text-red-600 dark:text-red-400" />
                  <span className="text-red-700 dark:text-red-400">Failed</span>
                </>
              )}
            </div>
          </div>

          <h4 className="font-semibold text-foreground mb-1 truncate" title={doc.originalFilename}>
            {doc.originalFilename}
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            {format(new Date(doc.createdAt), 'MMM d, yyyy h:mm a')}
          </p>

          <div className="mt-auto flex gap-2 pt-4 border-t border-border">
            <button
              onClick={() => onPreview(doc)}
              disabled={doc.status !== 'ready'}
              className="flex-1 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Preview
            </button>

            {/* Delete Dialog */}
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                  <Trash2 size={18} />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-40" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
                  <Dialog.Title className="text-lg font-semibold">Delete Document</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    Are you sure you want to delete "{doc.originalFilename}"? This action cannot be
                    undone.
                  </Dialog.Description>
                  <div className="flex justify-end gap-3 mt-4">
                    <Dialog.Close asChild>
                      <button className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded font-medium text-sm transition-colors">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <Dialog.Close asChild>
                      <button
                        onClick={() => {
                          setDeletingId(doc._id as string);
                          onDelete(doc._id as string);
                        }}
                        className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded font-medium text-sm transition-colors flex items-center"
                      >
                        Delete
                      </button>
                    </Dialog.Close>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      ))}
    </div>
  );
};
