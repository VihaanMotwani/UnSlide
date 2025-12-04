'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight, Upload, Sparkles } from 'lucide-react';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-gray-950 text-gray-500">Loading PDF...</div>,
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

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function changePage(offset: number) {
    onPageChange(Math.min(Math.max(pageNumber + offset, 1), numPages));
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black text-gray-100">
      {/* Left Panel: PDF Viewer */}
      <div className="w-1/2 h-full border-r border-gray-800 flex flex-col">
        <div className="bg-black p-4 border-b border-gray-800 flex justify-between items-center z-10">
          <h2 className="font-medium text-gray-400 text-sm uppercase tracking-wider">Original Slide</h2>
          <div className="flex items-center gap-4">
            {!file && (
                <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4" />
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
        
        <div className="flex-1 bg-zinc-900/50 relative flex items-center justify-center overflow-hidden">
            {/* Navigation Arrows */}
            {file && (
              <>
                <button
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  className="absolute left-4 z-20 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md disabled:opacity-30 transition-all border border-white/10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <button
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= numPages}
                  className="absolute right-4 z-20 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md disabled:opacity-30 transition-all border border-white/10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="h-full w-full overflow-auto flex justify-center p-8">
                {file ? (
                    <PDFViewer 
                        file={file} 
                        onLoadSuccess={onDocumentLoadSuccess} 
                        pageNumber={pageNumber} 
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-6">
                        <div className="p-6 rounded-full bg-zinc-900 border border-zinc-800">
                            <Upload className="w-8 h-8 opacity-50" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-lg font-medium text-zinc-300">Upload a lecture slide</p>
                            <p className="text-sm text-zinc-500">PDF format supported</p>
                        </div>
                        <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
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
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-1.5 rounded-full text-xs font-mono text-gray-400 backdrop-blur-md border border-white/10">
                PAGE {pageNumber} / {numPages || '--'}
              </div>
            )}
        </div>
      </div>

      {/* Right Panel: AI Explanation */}
      <div className="w-1/2 h-full bg-black flex flex-col relative">
        <div className="p-4 border-b border-gray-800 z-10 flex justify-between items-center bg-black">
          <h2 className="font-medium text-gray-400 text-sm uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            UnSlide Intelligence
          </h2>
        </div>
        
        <div className="flex-1 overflow-auto p-8 prose prose-invert max-w-none relative">
          {/* Loading State Overlay */}
          {isLoading && !markdownContent && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20">
               <div className="relative">
                 <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse-ring"></div>
                 <div className="relative bg-black p-4 rounded-full border border-white/10 shadow-2xl">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                 </div>
               </div>
               <p className="mt-8 text-zinc-400 font-light tracking-wide animate-pulse">Analyzing slide content...</p>
            </div>
          )}

          {markdownContent ? (
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          ) : !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
              <p className="text-sm font-mono">Waiting for content...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
