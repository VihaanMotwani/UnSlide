'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Plus, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAssistantProps {
  slideContent: string;
  slideNumber: number;
  onAddToNotes: (text: string) => void;
}

export default function ChatAssistant({ slideContent, slideNumber, onAddToNotes }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
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
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          slide_content: slideContent,
          slide_number: slideNumber,
          course_topic: "General"
        })
      });

      if (!res.ok) throw new Error("Failed to fetch chat response");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMessage = "";

      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
            const chunkValue = decoder.decode(value, { stream: true });
            assistantMessage += chunkValue;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return newMessages;
            });
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end transition-all duration-300 ${isOpen ? 'w-96' : 'w-auto'}`}>
      {/* Chat Window */}
      {isOpen && (
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300" style={{ height: '500px' }}>
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
            <h3 className="font-medium text-zinc-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Chat Assistant
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900/50">
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
          <form onSubmit={handleSubmit} className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2">
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
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 group"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-zinc-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-800 pointer-events-none">
            Ask AI
          </span>
        </button>
      )}
    </div>
  );
}
