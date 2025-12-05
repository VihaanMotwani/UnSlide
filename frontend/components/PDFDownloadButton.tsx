'use client';

import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDFDocument } from './PDFExport';
import { Download, Sparkles } from 'lucide-react';

interface SlideData {
  slide_number: number;
  content: string;
  expandedContent?: string;
  image?: string;
}

interface PDFDownloadButtonProps {
  slides: SlideData[];
  layout: 'vertical' | 'horizontal';
  title: string;
  fileName: string;
}

const PDFDownloadButton = ({ slides, layout, title, fileName }: PDFDownloadButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const blob = await pdf(
        <PDFDocument slides={slides} layout={layout} title={title} />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {isGenerating ? 'Generating...' : 'Download PDF'}
    </button>
  );
};

export default PDFDownloadButton;
