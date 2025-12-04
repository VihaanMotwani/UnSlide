'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight, Upload, Sparkles, Copy, Check } from 'lucide-react';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-gray-950 text-gray-500 animate-pulse">Loading PDF...</div>,
});

interface SplitViewProps {
  file: File | null;
  markdownContent: string;
  onFileUpload: (file: File) => void;
  pageNumber: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export default function SplitView({ file, markdownContent, onFileUpload, pageNumber, onPageChange, isLoading = false }: SplitViewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function changePage(offset: number) {
    onPageChange(Math.min(Math.max(pageNumber + offset, 1), numPages));
  }

  const handleCopy = () => {
    if (!markdownContent) return;
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black text-gray-100 font-sans">
      {/* Left Panel: PDF Viewer */}
      <div className="w-1/2 h-full border-r border-zinc-800 flex flex-col bg-zinc-950">
        <div className="bg-zinc-950/80 backdrop-blur-sm p-4 border-b border-zinc-800 flex justify-between items-center z-10 sticky top-0">
          <h2 className="font-medium text-zinc-400 text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Original Slide
          </h2>
          <div className="flex items-center gap-4">
            {!file && (
                <label className="cursor-pointer bg-white text-black px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-200 flex items-center gap-2 transition-all">
                    <Upload className="w-3 h-3" />
                    Upload PDF
                    <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
                    />
                </label>
            )}
          </div>
        </div>
        
        <div className="flex-1 bg-zinc-900/30 relative flex items-center justify-center overflow-hidden">
            {/* Navigation Arrows */}
            {file && (
              <>
                <button
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  className="absolute left-6 z-20 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md disabled:opacity-0 disabled:pointer-events-none transition-all border border-white/5 hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= numPages}
                  className="absolute right-6 z-20 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md disabled:opacity-0 disabled:pointer-events-none transition-all border border-white/5 hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="h-full w-full overflow-auto flex justify-center p-8">
                {file ? (
                    <div className="shadow-2xl shadow-black/50">
                        <PDFViewer 
                            file={file} 
                            onLoadSuccess={onDocumentLoadSuccess} 
                            pageNumber={pageNumber} 
                        />
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-8">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-violet-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative p-8 rounded-full bg-zinc-900 border border-zinc-800 ring-1 ring-white/5">
                                <Upload className="w-10 h-10 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-xl font-medium text-zinc-200">Upload a lecture slide</p>
                            <p className="text-sm text-zinc-500">PDF format supported</p>
                        </div>
                        <label className="cursor-pointer bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors shadow-lg hover:shadow-xl hover:shadow-white/10 transform hover:-translate-y-0.5 transition-all duration-200">
                            Select PDF
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                className="hidden" 
                                onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
                            />
                        </label>
                    </div>
                )}
            </div>
            
            {/* Page Indicator Overlay */}
            {file && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-xs font-mono text-zinc-400 backdrop-blur-md border border-white/5 shadow-lg">
                PAGE {pageNumber} <span className="text-zinc-600 mx-2">/</span> {numPages || '--'}
              </div>
            )}
        </div>
      </div>

      {/* Right Panel: AI Explanation */}
      <div className="w-1/2 h-full bg-black flex flex-col relative border-l border-zinc-800">
        <div className="p-4 border-b border-zinc-800 z-10 flex justify-between items-center bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60 sticky top-0">
          <h2 className="font-medium text-zinc-400 text-xs uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            UnSlide Intelligence
          </h2>
          <button 
            onClick={handleCopy}
            className="text-zinc-500 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-900"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-8 md:p-12 prose prose-invert prose-zinc max-w-none relative scroll-smooth">
          {/* Loading State Overlay */}
          {isLoading && !markdownContent && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20">
               <div className="relative">
                 <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-pulse-ring"></div>
                 <div className="relative bg-black p-6 rounded-full border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                    <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                 </div>
               </div>
               <p className="mt-8 text-zinc-400 font-light tracking-wide animate-pulse">Analyzing slide content...</p>
            </div>
          )}

          {markdownContent ? (
            <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
                <ReactMarkdown
                    components={{
                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold tracking-tight text-white mb-6" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-10 mb-4 border-b border-zinc-800 pb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xl font-medium text-zinc-200 mt-8 mb-3" {...props} />,
                        p: ({node, ...props}) => <p className="text-zinc-300 leading-relaxed mb-4" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 space-y-2 text-zinc-300 mb-4" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 space-y-2 text-zinc-300 mb-4" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500/50 pl-4 italic text-zinc-400 my-6" {...props} />,
                        code: ({node, ...props}) => <code className="bg-zinc-900 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
            </div>
          ) : !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4 opacity-50">
              <Sparkles className="w-12 h-12 stroke-1" />
              <p className="text-sm font-mono">Waiting for content...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
