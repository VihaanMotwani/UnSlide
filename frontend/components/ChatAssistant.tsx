'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Plus, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAssistantProps {
  slideContent: string;
  slideNumber: number;
  onAddToNotes: (text: string) => void;
  className?: string;
  messages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
}

export default function ChatAssistant({ 
  slideContent, 
  slideNumber, 
  onAddToNotes, 
  className,
  messages: externalMessages,
  onMessagesChange
}: ChatAssistantProps) {
  const [internalMessages, setInternalMessages] = useState<Message[]>([]);
  const messages = externalMessages || internalMessages;
  
  const updateMessages = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    if (onMessagesChange && externalMessages) {
      const resolvedMessages = typeof newMessages === 'function' ? newMessages(externalMessages) : newMessages;
      onMessagesChange(resolvedMessages);
    } else {
      setInternalMessages(newMessages);
    }
  };

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    updateMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          slide_content: slideContent,
          slide_number: slideNumber,
          course_topic: "General",
          history: messages // Pass current history
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      updateMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error(error);
      updateMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-black ${className || ''}`}> 
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center p-4">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Ask questions about the current slide.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}> 
            <div 
              className={`max-w-[85%] rounded-lg p-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
              }`}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
            {msg.role === 'assistant' && !isLoading && (
              <button
                onClick={() => onAddToNotes(msg.content)}
                className="mt-1 text-xs text-zinc-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add to notes
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-black border-t border-zinc-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}