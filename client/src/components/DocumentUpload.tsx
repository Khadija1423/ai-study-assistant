import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, AlertCircle, X } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';
import axios from 'axios';

interface DocumentUploadProps {
  onUploadComplete: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);
    if (fileRejections.length > 0) {
      setError(fileRejections[0].errors[0].message);
      return;
    }
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 5,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
  });

  const removeFile = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setUploadProgress({});

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      // Group all files in one request but track progress using axios
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      await axios.post(`${apiUrl}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          );
          // Since it's a batch upload, we'll assign the total progress to all files
          const newProgress: { [key: string]: number } = {};
          files.forEach((f) => {
            newProgress[f.name] = percentCompleted;
          });
          setUploadProgress(newProgress);
        },
      });

      setTimeout(() => {
        setFiles([]);
        setUploading(false);
        setUploadProgress({});
        onUploadComplete();
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Upload failed');
      setUploading(false);
      setUploadProgress({});
    }
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border bg-card hover:bg-muted/50'
        }`}
      >
        <input {...getInputProps()} />
        <div
          className={`p-4 rounded-full bg-primary/10 text-primary mb-4 transition-transform ${isDragActive ? 'scale-110' : ''}`}
        >
          <UploadCloud size={32} />
        </div>
        <p className="text-foreground font-medium mb-1 text-center">
          {isDragActive ? 'Drop your files here!' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Supports PDF, DOCX, TXT up to 20MB (Max 5 files)
        </p>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="w-full mt-6 space-y-2 relative z-10" onClick={(e) => e.stopPropagation()}>
            {files.map((file, i) => (
              <div
                key={i}
                className="flex flex-col bg-background rounded-lg border border-border overflow-hidden"
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <File size={20} className="text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  {!uploading && (
                    <button
                      onClick={(e) => removeFile(e, i)}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* File Progress */}
                {uploading && uploadProgress[file.name] !== undefined && (
                  <div className="px-3 pb-3">
                    <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                      <span>Uploading...</span>
                      <span>{uploadProgress[file.name]}%</span>
                    </div>
                    <Progress.Root
                      className="relative overflow-hidden bg-secondary rounded-full w-full h-1.5"
                      value={uploadProgress[file.name]}
                    >
                      <Progress.Indicator
                        className="bg-primary w-full h-full transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${100 - uploadProgress[file.name]}%)` }}
                      />
                    </Progress.Root>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            className="w-full mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && !uploading && (
          <div
            className="w-full mt-4 flex justify-end relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleUpload}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Upload {files.length} {files.length === 1 ? 'file' : 'files'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
