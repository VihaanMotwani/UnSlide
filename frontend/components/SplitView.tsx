'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-gray-100">Loading PDF...</div>,
});

interface SplitViewProps {
  file: File | null;
  markdownContent: string;
  onFileUpload: (file: File) => void;
}

export default function SplitView({ file, markdownContent, onFileUpload }: SplitViewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => Math.min(Math.max(prevPageNumber + offset, 1), numPages));
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Panel: PDF Viewer */}
      <div className="w-1/2 h-full border-r border-gray-200 flex flex-col">
        <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
          <h2 className="font-semibold text-gray-700">Original Slide</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {pageNumber} of {numPages || '--'}
              </span>
              <button
                onClick={() => changePage(1)}
                disabled={pageNumber >= numPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {!file && (
                <label className="cursor-pointer bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 flex items-center gap-2">
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
        
        <div className="flex-1 bg-gray-100 overflow-auto relative">
            {file ? (
                <PDFViewer 
                    file={file} 
                    onLoadSuccess={onDocumentLoadSuccess} 
                    pageNumber={pageNumber} 
                />
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                    <Upload className="w-12 h-12 opacity-20" />
                    <p>Upload a lecture slide to begin</p>
                    <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
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
      </div>

      {/* Right Panel: AI Explanation */}
      <div className="w-1/2 h-full bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 shadow-sm z-10">
          <h2 className="font-semibold text-gray-700">UnSlide Explanation</h2>
        </div>
        <div className="flex-1 overflow-auto p-8 prose prose-slate max-w-none">
          {markdownContent ? (
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          ) : (
            <div className="text-gray-400 italic text-center mt-20">
              AI explanation will appear here...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
