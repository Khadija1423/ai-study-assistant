import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../../shared';
import { Send, Bot, User, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPanelProps {
  documentId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ documentId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${apiUrl}/documents/${documentId}/chat`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (e) {
        console.error('Failed to fetch chat history', e);
      }
    };
    fetchHistory();
  }, [documentId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const question = input.trim();
    setInput('');
    setIsStreaming(true);

    const newUserMsg: ChatMessage = {
      documentId,
      userId: 'user_123',
      role: 'user',
      content: question,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);

    const placeholderModelMsg: ChatMessage = {
      _id: 'temp_' + Date.now(),
      documentId,
      userId: 'user_123',
      role: 'model',
      content: '',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, placeholderModelMsg]);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiUrl}/documents/${documentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          conversationHistory: messages.slice(-5), // Send last 5 for context
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      let aiText = '';
      let sourceChunks: any[] = [];
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n\n')) >= 0) {
            const chunk = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 2);

            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.sourceChunks) {
                    sourceChunks = data.sourceChunks;
                  }

                  if (data.text) {
                    aiText += data.text;
                    setMessages((prev) => {
                      const newMsg = [...prev];
                      const lastMsg = newMsg[newMsg.length - 1];
                      lastMsg.content = aiText;
                      lastMsg.sourceChunks = sourceChunks;
                      return newMsg;
                    });
                  }
                } catch (e) {
                  // ignore
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => {
        const newMsg = [...prev];
        const lastMsg = newMsg[newMsg.length - 1];
        lastMsg.content = 'Sorry, an error occurred while connecting to the AI.';
        return newMsg;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Bot size={18} className="text-primary" />
          Document Chat
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Ask questions about this document.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && !isStreaming && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-6">
            <Bot size={48} className="mb-4 opacity-20" />
            <p>Hello! I'm your AI Study Assistant.</p>
            <p className="text-sm mt-2">I've read this document. What would you like to know?</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isAI = msg.role === 'model';
            const isExpanded = expandedSourceId === msg._id;

            return (
              <motion.div
                key={msg._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isAI ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                >
                  {isAI ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div
                  className={`flex flex-col gap-1 max-w-[80%] ${isAI ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`p-3 rounded-2xl ${isAI ? 'bg-muted text-foreground rounded-tl-none' : 'bg-primary text-primary-foreground rounded-tr-none'}`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content || (isStreaming && i === messages.length - 1 ? '' : '')}
                    </p>

                    {/* Streaming indicator */}
                    {isStreaming && i === messages.length - 1 && !msg.content && (
                      <div className="flex gap-1 mt-2">
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-foreground/50"
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        />
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-foreground/50"
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-foreground/50"
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Grounded Sources */}
                  {isAI && msg.sourceChunks && msg.sourceChunks.length > 0 && (
                    <div className="mt-1 w-full">
                      <button
                        onClick={() => setExpandedSourceId(isExpanded ? null : msg._id || null)}
                        className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded transition-colors"
                      >
                        <BookOpen size={12} />
                        Grounded in {msg.sourceChunks.length}{' '}
                        {msg.sourceChunks.length === 1 ? 'section' : 'sections'}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 space-y-2 p-3 bg-background border border-border rounded-lg text-xs text-muted-foreground shadow-inner">
                              {msg.sourceChunks.map((c, idx) => (
                                <div
                                  key={idx}
                                  className="pb-2 border-b border-border/50 last:border-0 last:pb-0"
                                >
                                  <span className="font-semibold text-foreground mb-1 block">
                                    Source {idx + 1}
                                  </span>
                                  <p className="italic">"{c.excerpt}"</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-card border-t border-border">
        <div className="relative flex items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a question... (Enter to send)"
            disabled={isStreaming}
            className="w-full bg-background border border-border rounded-xl pl-4 pr-12 py-3 max-h-32 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm disabled:opacity-50"
            rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 4) : 1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bottom-2 p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
