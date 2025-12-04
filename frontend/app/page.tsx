'use client';

import { useState } from 'react';
import SplitView from '@/components/SplitView';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>("");

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    // TODO: Trigger backend upload and processing here
    setMarkdownContent("# Processing...\n\nAI is analyzing your slide. Please wait.");
    
    // Mocking a response for now
    setTimeout(() => {
      setMarkdownContent(`
# Introduction to Neural Networks

## What is a Neural Network?
A **Neural Network** is a computational model inspired by the way biological neural networks in the human brain process information.

### Key Components:
*   **Neurons (Nodes)**: The basic units of computation.
*   **Weights**: Parameters that adjust the strength of the connection between neurons.
*   **Biases**: Additional parameters that allow the model to shift the activation function.

## Why do we use them?
Neural networks are powerful because they can learn non-linear relationships between inputs and outputs. This makes them ideal for tasks like:
1.  Image Recognition
2.  Natural Language Processing
3.  Predictive Analytics

> "The analogy to the brain is useful, but don't take it too literally. Artificial neurons are much simpler than biological ones."

### External Resources
*   [3Blue1Brown: But what is a Neural Network?](https://www.youtube.com/watch?v=aircAruvnKk)
*   [DeepLearning.AI: Neural Networks and Deep Learning](https://www.coursera.org/learn/neural-networks-deep-learning)
      `);
    }, 2000);
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-gray-50">
      <SplitView 
        file={file} 
        markdownContent={markdownContent} 
        onFileUpload={handleFileUpload} 
      />
    </main>
  );
}
