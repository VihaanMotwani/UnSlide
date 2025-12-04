'use client';

import { useState, useRef, useEffect } from 'react';
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
  
  const activeRequestRef = useRef<AbortController | null>(null);
  const prefetchRequestRef = useRef<AbortController | null>(null);

  // Helper to generate content for a single slide
  const generateSlideContent = async (
    slide: Slide, 
    prev: Slide | undefined, 
    next: Slide | undefined, 
    signal: AbortSignal,
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    let fullContent = "";
    try {
      const res = await fetch('/api/stream-expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slide_content: slide.content,
          slide_number: slide.slide_number,
          prev_context: prev?.content || "",
          next_context: next?.content || "",
          course_topic: "General"
        }),
        signal
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
            if (onChunk) onChunk(chunkValue);
        }
      }
      return fullContent;
    } catch (error) {
      throw error;
    }
  };

  const fetchExpansion = async (currentSlide: Slide, prevSlide?: Slide, nextSlide?: Slide) => {
    // Abort previous active request
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }
    // Abort any ongoing prefetch to prioritize current slide
    if (prefetchRequestRef.current) {
      prefetchRequestRef.current.abort();
    }

    const controller = new AbortController();
    activeRequestRef.current = controller;

    // Check cache first
    if (currentSlide.expandedContent) {
      setMarkdownContent(currentSlide.expandedContent);
      // Trigger prefetch since we are idle
      prefetchNextSlides(currentSlide.slide_number);
      return;
    }

    setMarkdownContent("");
    setIsLoading(true);

    try {
      const content = await generateSlideContent(
        currentSlide, 
        prevSlide, 
        nextSlide, 
        controller.signal, 
        (chunk) => setMarkdownContent((prev) => prev + chunk)
      );

      // Cache the result
      setSlides(prevSlides => prevSlides.map(s => 
        s.slide_number === currentSlide.slide_number 
          ? { ...s, expandedContent: content }
          : s
      ));
      
      // Start prefetching after current slide is done
      prefetchNextSlides(currentSlide.slide_number);

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error(error);
      setMarkdownContent("# Error\n\nFailed to generate explanation.");
    } finally {
      if (activeRequestRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  const prefetchNextSlides = async (currentSlideNum: number) => {
    // Prefetch next 2 slides
    const PREFETCH_COUNT = 2;
    
    // Create a new controller for this batch of prefetches
    const controller = new AbortController();
    prefetchRequestRef.current = controller;

    try {
      for (let i = 1; i <= PREFETCH_COUNT; i++) {
        if (controller.signal.aborted) break;

        const targetSlideNum = currentSlideNum + i;
        const targetSlideIndex = targetSlideNum - 1;
        
        // Check bounds
        if (targetSlideIndex >= slides.length) break;
        
        const targetSlide = slides[targetSlideIndex];
        
        // Skip if already has content
        if (targetSlide.expandedContent) continue;

        console.log(`Prefetching slide ${targetSlideNum}...`);
        
        const prev = slides[targetSlideIndex - 1];
        const next = slides[targetSlideIndex + 1];

        const content = await generateSlideContent(
            targetSlide, 
            prev, 
            next, 
            controller.signal
        );

        // Update cache silently
        setSlides(prevSlides => prevSlides.map(s => 
            s.slide_number === targetSlideNum 
            ? { ...s, expandedContent: content }
            : s
        ));
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Prefetch error:", error);
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

  const handleContentUpdate = (newContent: string) => {
    setMarkdownContent(newContent);
    setSlides(prevSlides => prevSlides.map(s => 
      s.slide_number === slides[pageNumber - 1].slide_number 
        ? { ...s, expandedContent: newContent }
        : s
    ));
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
        onContentUpdate={handleContentUpdate}
      />
    </main>
  );
}
