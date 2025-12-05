'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface Annotation {
  label: string;
  box_2d: [number, number, number, number];
  id?: number;
}

interface PDFViewerProps {
  file: File | string | null;
  onLoadSuccess?: (data: { numPages: number }) => void;
  pageNumber?: number;
  scale?: number;
  annotations?: Annotation[];
  hoveredAnnotationId?: number | null;
  selectedAnnotationId?: number | null;
  onAnnotationClick?: (id: number) => void;
}

export default function PDFViewer({ 
  file, 
  onLoadSuccess, 
  pageNumber = 1, 
  scale = 1, 
  annotations = [], 
  hoveredAnnotationId = null,
  selectedAnnotationId = null,
  onAnnotationClick
}: PDFViewerProps) {
  return (
    <div className="flex justify-center items-start h-full w-full overflow-auto p-8">
      {file ? (
        <Document
          file={file}
          onLoadSuccess={onLoadSuccess}
          className="shadow-2xl"
        >
          <div className="relative border-4 border-gray-800 rounded-sm overflow-hidden w-fit h-fit" id="pdf-page-container">
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false} 
              renderAnnotationLayer={false}
              scale={scale}
            />
            {annotations?.map((ann, i) => {
              const id = ann.id !== undefined ? ann.id : i;
              const isHovered = id === hoveredAnnotationId;
              const isSelected = id === selectedAnnotationId;
              
              // Visibility Logic:
              // - If selected: Visible, Highlighted
              // - If hovered: Visible, Highlighted
              // - If nothing selected/hovered: Invisible (opacity-0) but interactive (pointer-events-auto)
              // - Wait, if invisible, how to hover? 
              //   - We make the background transparent but keep the div present.
              //   - On hover, we show the border/bg.
              
              let containerClasses = "absolute z-10 transition-all duration-200 cursor-pointer ";
              
              if (isSelected) {
                  containerClasses += "border-4 border-yellow-400 bg-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.4)] opacity-100";
              } else if (isHovered) {
                  containerClasses += "border-4 border-yellow-400 bg-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.4)] opacity-100";
              } else {
                  // Default state: Invisible but hoverable
                  // We use opacity-0 so it doesn't obscure the text, but hover:opacity-100 to reveal it
                  containerClasses += "border-2 border-indigo-500 bg-indigo-500/10 opacity-0 hover:opacity-100";
              }

              return (
                <div
                  key={i}
                  className={containerClasses}
                  onClick={(e) => {
                      e.stopPropagation();
                      if (onAnnotationClick) onAnnotationClick(id);
                  }}
                  style={{
                    top: `${ann.box_2d[0] / 10}%`,
                    left: `${ann.box_2d[1] / 10}%`,
                    height: `${(ann.box_2d[2] - ann.box_2d[0]) / 10}%`,
                    width: `${(ann.box_2d[3] - ann.box_2d[1]) / 10}%`,
                  }}
                >
                  <span className={`absolute -top-8 left-0 bg-black/90 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-blur-md transition-opacity whitespace-nowrap pointer-events-none ${isHovered || isSelected ? 'opacity-100 scale-105' : 'opacity-0'}`}>
                    {ann.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Document>
      ) : (
        <div className="text-gray-500">No PDF loaded</div>
      )}
    </div>
  );
}
