import React, { useState, useEffect, useCallback } from 'react';
import { Flashcard } from '../../../shared';
import { ChevronLeft, ChevronRight, Star, Loader2, LayoutGrid, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlashcardsProps {
  documentId: string;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ documentId }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'study' | 'grid'>('study');

  const fetchFlashcards = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiUrl}/documents/${documentId}/flashcards`);
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to fetch flashcards');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiUrl}/documents/${documentId}/flashcards`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data);
        setCurrentIndex(0);
        setIsFlipped(false);
      } else {
        throw new Error('Generation failed');
      }
    } catch (e) {
      alert('Failed to generate flashcards.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic update
    setFlashcards((prev) =>
      prev.map((fc) => (fc._id === id ? { ...fc, isFavorited: !fc.isFavorited } : fc)),
    );

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiUrl}/flashcards/${id}/favorite`, { method: 'PATCH' });
    } catch (e) {
      // Revert on failure
      setFlashcards((prev) =>
        prev.map((fc) => (fc._id === id ? { ...fc, isFavorited: !fc.isFavorited } : fc)),
      );
    }
  };

  const nextCard = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150);
    }
  }, [currentIndex, flashcards.length]);

  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev - 1), 150);
    }
  }, [currentIndex]);

  const handleDragEnd = (_event: any, info: any) => {
    // Threshold for swipe
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      prevCard();
    } else if (info.offset.x < -swipeThreshold) {
      nextCard();
    }
  };

  useEffect(() => {
    if (viewMode !== 'study') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextCard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevCard();
      } else if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, prevCard, viewMode]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={24} />
        <span>Loading flashcards...</span>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-foreground mb-8 self-start">
          Generating Flashcards...
        </h2>
        <div className="w-full max-w-2xl h-80 bg-card border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center animate-pulse">
          <Loader2 size={48} className="text-primary/50 animate-spin mb-4" />
          <div className="h-6 w-48 bg-muted rounded-full mb-2"></div>
          <div className="h-4 w-32 bg-muted/50 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
          <Play size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2">No flashcards yet</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Generate AI flashcards from your document to start studying key concepts.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Play size={18} /> Generate Flashcards
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* Header controls */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Study Flashcards</h2>
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setViewMode('study')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode === 'study' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Play size={16} /> Study
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid size={16} /> Grid View
          </button>
        </div>
      </div>

      {viewMode === 'study' && (
        <div className="flex flex-col items-center overflow-hidden">
          <div className="w-full max-w-2xl relative h-80 [perspective:1000px] mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
              >
                <div
                  className="w-full h-full transition-all duration-500 [transform-style:preserve-3d] shadow-sm hover:shadow-md hover:scale-[1.01]"
                  style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                  {/* Front (Question) */}
                  <div className="absolute inset-0 w-full h-full bg-card border-2 border-border rounded-2xl flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
                    <div className="absolute top-4 left-4 text-xs font-semibold px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                      {flashcards[currentIndex].topic}
                    </div>
                    <button
                      onClick={(e) => handleToggleFavorite(flashcards[currentIndex]._id!, e)}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-amber-500 transition-colors"
                    >
                      <Star
                        size={24}
                        className={
                          flashcards[currentIndex].isFavorited
                            ? 'fill-amber-500 text-amber-500'
                            : ''
                        }
                      />
                    </button>
                    <h3 className="text-2xl font-bold text-center text-foreground">
                      {flashcards[currentIndex].question}
                    </h3>
                    <p className="absolute bottom-4 text-xs text-muted-foreground">
                      Click to flip, Swipe to navigate
                    </p>
                  </div>

                  {/* Back (Answer) */}
                  <div className="absolute inset-0 w-full h-full bg-primary border-2 border-primary rounded-2xl flex flex-col items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto">
                    <button
                      onClick={(e) => handleToggleFavorite(flashcards[currentIndex]._id!, e)}
                      className="absolute top-4 right-4 text-primary-foreground/70 hover:text-white transition-colors"
                    >
                      <Star
                        size={24}
                        className={
                          flashcards[currentIndex].isFavorited ? 'fill-white text-white' : ''
                        }
                      />
                    </button>
                    <p className="text-xl font-medium text-center text-primary-foreground">
                      {flashcards[currentIndex].answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button
              onClick={prevCard}
              disabled={currentIndex === 0}
              className="p-3 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="font-medium text-muted-foreground w-32 text-center">
              Card {currentIndex + 1} of {flashcards.length}
            </div>
            <button
              onClick={nextCard}
              disabled={currentIndex === flashcards.length - 1}
              className="p-3 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flashcards.map((fc) => (
            <div
              key={fc._id}
              className="bg-card border border-border rounded-xl p-5 relative group"
            >
              <div
                className="absolute top-3 right-3 text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
                onClick={() => handleToggleFavorite(fc._id!)}
              >
                <Star size={18} className={fc.isFavorited ? 'fill-amber-500 text-amber-500' : ''} />
              </div>
              <div className="text-xs font-semibold px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full w-fit mb-3">
                {fc.topic}
              </div>
              <h4 className="font-bold text-foreground mb-2 pr-8">{fc.question}</h4>
              <p className="text-muted-foreground text-sm">{fc.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
