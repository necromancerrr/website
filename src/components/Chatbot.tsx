'use client';

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { X, Minus, Send, Bot, ChevronDown, Loader2, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: Array<{ type: string; text: string }>;
}

interface ChatContextType {
  openChat: (jobId?: string, jobTitle?: string, jobCompany?: string, jobPostingUrl?: string) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

interface ActiveJob {
  id?: string;
  title?: string;
  company?: string;
  postingUrl?: string;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [windowState, setWindowState] = useState<'closed' | 'minimized' | 'open'>('closed');
  const [activeJob, setActiveJob] = useState<ActiveJob>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const openChat = (jobId?: string, jobTitle?: string, jobCompany?: string, jobPostingUrl?: string) => {
    console.log('[Chatbot] Opening chat with:', { jobId, jobTitle, jobCompany, jobPostingUrl });
    setActiveJob({ id: jobId, title: jobTitle, company: jobCompany, postingUrl: jobPostingUrl });
    setMessages([]);
    setInput('');
    setWindowState('open');
  };

  const closeChat = () => {
    setWindowState('closed');
  };

  const minimizeWindow = () => {
    setWindowState('minimized');
  };

  const toggleWindow = () => {
    setWindowState(prev => prev === 'open' ? 'minimized' : 'open');
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsScraping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          jobPostingUrl: activeJob.postingUrl,
          context: activeJob.title && activeJob.company
            ? `Job: ${activeJob.title} at ${activeJob.company}`
            : undefined,
        }),
      });

      setIsScraping(false);
      const data = await response.json();

      console.log('[Chatbot] API response:', data);

      if (data.messages && data.messages.length > 0) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.messages[0].content || '',
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (data.error) {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${data.error}`,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      setIsScraping(false);
      console.error('[Chatbot] Send error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <ChatContext.Provider value={{ openChat, closeChat }}>
      {children}

      <AnimatePresence>
        {windowState === 'open' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            style={{ boxShadow: '0 0 40px rgba(106, 13, 255, 0.3)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-electric" />
                <span className="font-semibold text-white">Job Assistant</span>
                {activeJob.title && (
                  <span className="text-xs text-electric px-2 py-0.5 bg-electric/20 rounded-full">
                    {activeJob.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={minimizeWindow}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Minimize"
                >
                  <Minus className="w-4 h-4 text-muted hover:text-white" />
                </button>
                <button
                  onClick={closeChat}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-muted hover:text-white" />
                </button>
              </div>
            </div>

            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-electric/50 mx-auto mb-3" />
                  <p className="text-white font-medium mb-1">How can I help?</p>
                  <p className="text-sm text-muted">
                    Ask me about this job posting
                  </p>
                </div>
              )}

              {messages.map(message => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-electric text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="text-sm prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 rounded-2xl px-4 py-3">
                    {isScraping ? (
                      <div className="flex items-center gap-2 text-sm text-purple-300">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>reading webpage...</span>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-electric/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-electric/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-electric/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this job..."
                  disabled={isLoading}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-muted focus:outline-none focus:border-electric transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-electric hover:bg-electric-alt disabled:opacity-50 disabled:hover:bg-electric rounded-xl transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {windowState !== 'closed' && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={toggleWindow}
            className="fixed bottom-6 right-6 p-4 bg-electric hover:bg-electric-alt rounded-full shadow-lg transition-colors z-50"
            style={{ boxShadow: '0 0 20px rgba(106, 13, 255, 0.5)' }}
          >
            <Bot className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {windowState === 'minimized' && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={toggleWindow}
            className="fixed bottom-6 right-6 p-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-colors z-50 flex items-center gap-2"
          >
            <Bot className="w-5 h-5 text-electric" />
            <span className="text-sm text-white font-medium">Job Assistant</span>
            <ChevronDown className="w-4 h-4 text-muted" />
          </motion.button>
        )}
      </AnimatePresence>

      {windowState === 'closed' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => openChat()}
          className="fixed bottom-6 right-6 p-4 bg-electric hover:bg-electric-alt rounded-full shadow-lg transition-colors z-50"
          style={{ boxShadow: '0 0 20px rgba(106, 13, 255, 0.5)' }}
        >
          <Bot className="w-6 h-6 text-white" />
        </motion.button>
      )}
    </ChatContext.Provider>
  );
}

interface ChatbotIconProps {
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobPostingUrl?: string;
}

export function ChatbotIcon({ jobId, jobTitle, jobCompany, jobPostingUrl }: ChatbotIconProps) {
  const { openChat } = useChatContext();

  const handleClick = () => {
    openChat(jobId, jobTitle, jobCompany, jobPostingUrl);
  };

  return (
    <button
      onClick={handleClick}
      className="p-1.5 text-electric/60 hover:text-electric hover:bg-electric/10 rounded-lg transition-colors"
      title="Chat about this job"
    >
      <MessageCircle className="w-4 h-4" />
    </button>
  );
}
