'use client';

import { useState, useRef } from 'react';
import SplitView from '@/components/SplitView';

interface Slide {
  slide_number: number;
  content: string;
  expandedContent?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchExpansion = async (currentSlide: Slide, prevSlide?: Slide, nextSlide?: Slide) => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Check cache first
    if (currentSlide.expandedContent) {
      setMarkdownContent(currentSlide.expandedContent);
      return;
    }

    setMarkdownContent("");
    setIsLoading(true);
    let fullContent = "";

    try {
      const res = await fetch('/api/stream-expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slide_content: currentSlide.content,
          slide_number: currentSlide.slide_number,
          prev_context: prevSlide?.content || "",
          next_context: nextSlide?.content || "",
          course_topic: "General"
        }),
        signal: controller.signal
      });
      
      if (!res.ok) throw new Error("Failed to fetch expansion");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
            const chunkValue = decoder.decode(value, { stream: true });
            fullContent += chunkValue;
            setMarkdownContent((prev) => prev + chunkValue);
        }
      }

      // Cache the result
      setSlides(prevSlides => prevSlides.map(s => 
        s.slide_number === currentSlide.slide_number 
          ? { ...s, expandedContent: fullContent }
          : s
      ));

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error(error);
      setMarkdownContent("# Error\n\nFailed to generate explanation. Please check if the backend is running and API keys are set.");
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
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
