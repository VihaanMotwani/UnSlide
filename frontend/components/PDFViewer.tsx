'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: File | string | null;
  onLoadSuccess?: (data: { numPages: number }) => void;
  pageNumber?: number;
}

export default function PDFViewer({ file, onLoadSuccess, pageNumber = 1 }: PDFViewerProps) {
  return (
    <div className="flex justify-center items-center bg-gray-100 h-full overflow-auto p-4">
      {file ? (
        <Document
          file={file}
          onLoadSuccess={onLoadSuccess}
          className="shadow-lg"
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={false} 
            renderAnnotationLayer={false}
            width={600}
          />
        </Document>
      ) : (
        <div className="text-gray-400">No PDF loaded</div>
      )}
    </div>
  );
}
