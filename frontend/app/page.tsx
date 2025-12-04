'use client';

import { useState } from 'react';
import SplitView from '@/components/SplitView';

interface Slide {
  slide_number: number;
  content: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchExpansion = async (currentSlide: Slide, prevSlide?: Slide, nextSlide?: Slide) => {
    setMarkdownContent("");
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slide_content: currentSlide.content,
          slide_number: currentSlide.slide_number,
          prev_context: prevSlide?.content || "",
          next_context: nextSlide?.content || "",
          course_topic: "General"
        })
      });
      
      if (!res.ok) throw new Error("Failed to fetch expansion");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        setMarkdownContent((prev) => prev + chunkValue);
      }
    } catch (error) {
      console.error(error);
      setMarkdownContent("# Error\n\nFailed to generate explanation. Please check if the backend is running and API keys are set.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setMarkdownContent("# Uploading...\n\nExtracting text from slides.");
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await fetch('/api/v1/upload/pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setSlides(data.slides);
      setPageNumber(1);

      // Expand the first slide
      if (data.slides.length > 0) {
        await fetchExpansion(data.slides[0], undefined, data.slides[1]);
      }
    } catch (error) {
      console.error(error);
      setMarkdownContent("# Error\n\nFailed to upload or process PDF.");
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPageNumber(newPage);
    const currentSlide = slides[newPage - 1];
    if (currentSlide) {
      const prevSlide = slides[newPage - 2];
      const nextSlide = slides[newPage];
      fetchExpansion(currentSlide, prevSlide, nextSlide);
    }
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-gray-950">
      <SplitView 
        file={file} 
        markdownContent={markdownContent} 
        onFileUpload={handleFileUpload}
        pageNumber={pageNumber}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </main>
  );
}
