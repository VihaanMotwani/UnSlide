'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight, Upload, Sparkles, Copy, Check, Pencil, Save, X, MessageSquare, FileText, ZoomIn, ZoomOut, LayoutTemplate, GripHorizontal, Maximize2, Minimize2, Columns, Rows } from 'lucide-react';
import { PanelResizeHandle, Panel, PanelGroup } from "react-resizable-panels";

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-gray-950 text-gray-500 animate-pulse">Loading PDF...</div>,
});

// Dynamically import Editor to avoid SSR issues
const Editor = dynamic(() => import('./Editor'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-zinc-500">Loading Editor...</div>,
});

// Dynamically import ChatAssistant to avoid SSR issues
const ChatAssistant = dynamic(() => import('./ChatAssistant'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-zinc-500">Loading Chat...</div>,
});

interface Annotation {
  label: string;
  box_2d: [number, number, number, number];
}

interface SplitViewProps {
  file: File | null;
  markdownContent: string;
  onFileUpload: (file: File) => void;
  pageNumber: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  onContentUpdate?: (newContent: string) => void;
  slideContent?: string;
  slideNumber?: number;
  onAddToNotes?: (text: string) => void;
  annotations?: Annotation[];
}

export default function SplitView({ 
  file, 
  markdownContent, 
  onFileUpload, 
  pageNumber, 
  onPageChange, 
  isLoading = false, 
  onContentUpdate,
  slideContent = "",
  slideNumber = 0,
  onAddToNotes = () => {},
  annotations = []
}: SplitViewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [activeTab, setActiveTab] = useState<'notes' | 'chat'>('notes');
  const [scale, setScale] = useState(1.0);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  
  // Right Panel State
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [rightPanelLayout, setRightPanelLayout] = useState<'tabs' | 'vertical' | 'horizontal'>('tabs');
  const [viewOrder, setViewOrder] = useState<('notes' | 'chat')[]>(['notes', 'chat']);
  
  // Drag & Drop State
  const [dragPosition, setDragPosition] = useState<'top' | 'bottom' | 'left' | 'right' | 'center' | null>(null);
  const [dragTarget, setDragTarget] = useState<'main' | 'panel1' | 'panel2' | null>(null);
  const [draggedItem, setDraggedItem] = useState<'notes' | 'chat' | null>(null);
  
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<number | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<number | null>(null);

  // Reset editing state when page changes
  useEffect(() => {
    setIsEditing(false);
    setSelectedAnnotationId(null);
  }, [pageNumber]);

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

  const handleEditClick = () => {
    setEditedContent(markdownContent);
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    if (onContentUpdate) {
      onContentUpdate(editedContent);
    }
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));

  const handleAnnotationClick = (id: number) => {
      setSelectedAnnotationId(id === selectedAnnotationId ? null : id);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
      // Only clear if clicking directly on the background or non-interactive elements
      // We'll rely on stopPropagation in the interactive elements
      setSelectedAnnotationId(null);
  };

  const handleDragOver = (e: React.DragEvent, target: 'main' | 'panel1' | 'panel2') => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    
    // If dragging over header (top 40px), it's a merge/center operation
    if (y < 50) {
        setDragPosition('center');
        setDragTarget(target);
        return;
    }

    // Calculate split zones
    const relativeX = x / width;
    const relativeY = y / height;

    let pos: 'top' | 'bottom' | 'left' | 'right' | 'center' = 'center';

    if (relativeX < 0.25) pos = 'left';
    else if (relativeX > 0.75) pos = 'right';
    else if (relativeY < 0.25) pos = 'top';
    else if (relativeY > 0.75) pos = 'bottom';
    else pos = 'center';

    // Check if the operation is a no-op
    if (draggedItem && rightPanelLayout !== 'tabs') {
        const targetView = target === 'panel1' ? viewOrder[0] : viewOrder[1];
        const otherView = target === 'panel1' ? viewOrder[1] : viewOrder[0];
        
        // If we are dragging the item that is already in this panel
        if (draggedItem === targetView) {
            // If we drop it on itself, it's a no-op unless we are merging (which is handled by center)
            // But wait, if we drag 'notes' onto 'notes' panel, and pos is 'left', it means nothing.
            // If pos is 'center', it means merge (but we are already split, so merge to tabs makes sense)
            if (pos !== 'center') {
                setDragPosition(null);
                setDragTarget(null);
                return;
            }
        }

        // If we are dragging the OTHER item onto this panel
        if (draggedItem === otherView) {
            // e.g. dragging 'chat' onto 'notes' panel
            // If we drop 'chat' to the RIGHT of 'notes', and 'chat' is ALREADY on the right (panel2), it's a no-op.
            const isVertical = rightPanelLayout === 'vertical';
            const isFirstPanel = target === 'panel1';
            
            // If layout is horizontal (side-by-side)
            if (!isVertical) {
                if (isFirstPanel) { // Target is Left Panel
                    if (pos === 'right') { // Dragging Right Panel to Right of Left Panel -> No-op (it's already there)
                        setDragPosition(null);
                        setDragTarget(null);
                        return;
                    }
                } else { // Target is Right Panel
                    if (pos === 'left') { // Dragging Left Panel to Left of Right Panel -> No-op
                        setDragPosition(null);
                        setDragTarget(null);
                        return;
                    }
                }
            } else {
                // Vertical layout (Top/Bottom)
                if (isFirstPanel) { // Target is Top Panel
                    if (pos === 'bottom') { // Dragging Bottom Panel to Bottom of Top Panel -> No-op
                        setDragPosition(null);
                        setDragTarget(null);
                        return;
                    }
                } else { // Target is Bottom Panel
                    if (pos === 'top') { // Dragging Top Panel to Top of Bottom Panel -> No-op
                        setDragPosition(null);
                        setDragTarget(null);
                        return;
                    }
                }
            }
        }
    }

    setDragPosition(pos);
    setDragTarget(target);
  };

  const handleDrop = (e: React.DragEvent, target: 'main' | 'panel1' | 'panel2') => {
    e.preventDefault();
    e.stopPropagation();
    const source = e.dataTransfer.getData('view') as 'notes' | 'chat';
    setDraggedItem(null);
    
    if (!source) return;

    // Reset drag state
    setDragPosition(null);
    setDragTarget(null);

    if (target === 'main') {
        // We are in tabs mode
        if (dragPosition === 'center') {
            // Just switch tab
            if (source !== activeTab) setActiveTab(source);
        } else if (dragPosition) {
            // Split view
            const newLayout = (dragPosition === 'top' || dragPosition === 'bottom') ? 'vertical' : 'horizontal';
            setRightPanelLayout(newLayout);
            
            // Determine order
            if (dragPosition === 'top' || dragPosition === 'left') {
                setViewOrder([source, activeTab === source ? (source === 'notes' ? 'chat' : 'notes') : activeTab]);
            } else {
                setViewOrder([activeTab === source ? (source === 'notes' ? 'chat' : 'notes') : activeTab, source]);
            }
        }
    } else {
        // We are in split mode
        if (dragPosition === 'center') {
            // Merge to tabs
            setRightPanelLayout('tabs');
            setActiveTab(source);
        } else if (dragPosition) {
            // Rearrange or change split direction
            const otherView = source === 'notes' ? 'chat' : 'notes';
            const newLayout = (dragPosition === 'top' || dragPosition === 'bottom') ? 'vertical' : 'horizontal';
            setRightPanelLayout(newLayout);
            
            if (dragPosition === 'top' || dragPosition === 'left') {
                setViewOrder([source, otherView]);
            } else {
                setViewOrder([otherView, source]);
            }
        }
    }
  };

  const DropOverlay = ({ position }: { position: 'top' | 'bottom' | 'left' | 'right' | 'center' | null }) => {
    if (!position) return null;
    
    const styles: Record<string, string> = {
        top: 'inset-x-0 top-0 h-1/2',
        bottom: 'inset-x-0 bottom-0 h-1/2',
        left: 'inset-y-0 left-0 w-1/2',
        right: 'inset-y-0 right-0 w-1/2',
        center: 'inset-0',
    };

    return (
        <div className={`absolute bg-zinc-500/20 border-2 border-zinc-500 z-50 pointer-events-none transition-all duration-200 ${styles[position] || ''}`}>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md">
                    {position === 'center' ? 'Merge Tabs' : `Split ${position.charAt(0).toUpperCase() + position.slice(1)}`}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-black text-gray-100 font-sans">
      <PanelGroup direction={layout}>
        {/* Left Panel: PDF Viewer */}
        <Panel defaultSize={50} minSize={20}>
          <div className="h-full flex flex-col bg-zinc-950">
            <div className="bg-zinc-950/80 backdrop-blur-sm p-4 border-b border-zinc-800 flex justify-between items-center z-10 sticky top-0">
              <h2 className="font-medium text-zinc-400 text-xs uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Uploaded Slides
              </h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                  title={layout === 'horizontal' ? "Switch to Vertical Layout" : "Switch to Horizontal Layout"}
                >
                  <LayoutTemplate className={`w-4 h-4 ${layout === 'vertical' ? 'rotate-90' : ''}`} />
                </button>
                {file && (
                  <div className="flex items-center gap-1 bg-zinc-900 rounded-md border border-zinc-800 p-0.5">
                    <button 
                      onClick={handleZoomOut}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono text-zinc-500 w-8 text-center">{Math.round(scale * 100)}%</span>
                    <button 
                      onClick={handleZoomIn}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                )}
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

                <div className="h-full w-full overflow-auto flex p-8">
                    {file ? (
                        <div className="m-auto shadow-2xl shadow-black/50 transition-transform duration-200 ease-out">
                            <PDFViewer 
                                file={file} 
                                onLoadSuccess={onDocumentLoadSuccess} 
                                pageNumber={pageNumber}
                                scale={scale}
                                annotations={annotations}
                                hoveredAnnotationId={hoveredAnnotationId}
                                selectedAnnotationId={selectedAnnotationId}
                                onAnnotationClick={handleAnnotationClick}
                            />
                        </div>
                    ) : (
                        <div className="m-auto h-full flex flex-col items-center justify-center text-zinc-500 gap-8">
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
        </Panel>

        <PanelResizeHandle className={`${layout === 'horizontal' ? 'w-1' : 'h-1'} bg-zinc-800 hover:bg-indigo-500 transition-colors`} />

        {/* Right Panel: AI Explanation & Chat */}
        <Panel defaultSize={50} minSize={20}>
          {rightPanelLayout === 'tabs' ? (
            <div 
                className="h-full bg-black flex flex-col relative"
                onDragOver={(e) => handleDragOver(e, 'main')}
                onDragLeave={() => { setDragPosition(null); setDragTarget(null); }}
                onDrop={(e) => handleDrop(e, 'main')}
            >
                {dragTarget === 'main' && <DropOverlay position={dragPosition} />}
                <div 
                    className="border-b border-zinc-800 z-10 flex justify-between items-center bg-zinc-950 sticky top-0"
                >
                <div className="flex items-center">
                    <button 
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('view', 'notes'); setDraggedItem('notes'); }}
                    onClick={() => setActiveTab('notes')}
                    className={`px-4 py-2 text-xs font-medium flex items-center gap-2 transition-all cursor-grab active:cursor-grabbing border-r border-zinc-800 ${activeTab === 'notes' ? 'bg-zinc-900 text-white' : 'bg-transparent text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'}`}
                    >
                    <GripHorizontal className="w-3 h-3" />
                    Notes
                    </button>
                    <button 
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('view', 'chat'); setDraggedItem('chat'); }}
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 text-xs font-medium flex items-center gap-2 transition-all cursor-grab active:cursor-grabbing border-r border-zinc-800 ${activeTab === 'chat' ? 'bg-zinc-900 text-white' : 'bg-transparent text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'}`}
                    >
                    <GripHorizontal className="w-3 h-3" />
                    Chat
                    </button>
                </div>

                <div className="flex items-center gap-2 px-4 py-2">
                    <button 
                        onClick={() => setRightPanelLayout('vertical')}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-md transition-colors"
                        title="Split View"
                    >
                        <Columns className="w-4 h-4 rotate-90" />
                    </button>
                    {activeTab === 'notes' && (
                    isEditing ? (
                        <>
                        <button 
                            onClick={handleCancelClick}
                            className="text-zinc-400 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-900 flex items-center gap-2 text-xs font-medium"
                            title="Cancel editing"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveClick}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white transition-colors px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium"
                            title="Save changes"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                        </>
                    ) : (
                        <>
                        {markdownContent && (
                            <button 
                            onClick={handleEditClick}
                            className="text-zinc-500 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-900"
                            title="Edit notes"
                            >
                            <Pencil className="w-4 h-4" />
                            </button>
                        )}
                        <button 
                            onClick={handleCopy}
                            className="text-zinc-500 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-900"
                            title="Copy to clipboard"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        </>
                    )
                    )}
                </div>
                </div>
                
                <div className="flex-1 relative overflow-hidden">
                {/* Notes Tab */}
                <div className={`absolute inset-0 flex flex-col ${activeTab === 'notes' ? 'z-10 visible' : 'z-0 invisible'}`}>
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

                    {isEditing ? (
                        <div className="h-full animate-in fade-in duration-300">
                            <Editor 
                                content={editedContent} 
                                onUpdate={setEditedContent} 
                            />
                        </div>
                    ) : markdownContent ? (
                        <div className="h-full animate-in fade-in duration-700 slide-in-from-bottom-4" onClick={handleBackgroundClick}>
                            <Editor 
                                content={markdownContent} 
                                onUpdate={() => {}} 
                                editable={false}
                                onAnnotationHover={setHoveredAnnotationId}
                                onAnnotationClick={handleAnnotationClick}
                                selectedAnnotationId={selectedAnnotationId}
                            />
                        </div>
                    ) : !isLoading && (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4 opacity-50">
                        <Sparkles className="w-12 h-12 stroke-1" />
                        <p className="text-sm font-mono">Waiting for content...</p>
                        </div>
                    )}
                    </div>
                </div>

                {/* Chat Tab */}
                <div className={`absolute inset-0 flex flex-col ${activeTab === 'chat' ? 'z-10 visible' : 'z-0 invisible'}`}>
                    <ChatAssistant 
                        slideContent={slideContent}
                        slideNumber={slideNumber}
                        onAddToNotes={(text) => {
                        onAddToNotes(text);
                        setActiveTab('notes'); // Switch back to notes when adding
                        }}
                        messages={chatMessages}
                        onMessagesChange={setChatMessages}
                    />
                </div>
                </div>
            </div>
          ) : (
            <PanelGroup direction={rightPanelLayout === 'vertical' ? 'vertical' : 'horizontal'}>
                <Panel defaultSize={50} minSize={20}>
                    <div 
                        className="h-full flex flex-col bg-black border-b border-zinc-800 relative"
                        onDragOver={(e) => handleDragOver(e, 'panel1')}
                        onDragLeave={() => { setDragPosition(null); setDragTarget(null); }}
                        onDrop={(e) => handleDrop(e, 'panel1')}
                    >
                        {dragTarget === 'panel1' && <DropOverlay position={dragPosition} />}
                        <div 
                            className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800 cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => { e.dataTransfer.setData('view', viewOrder[0]); setDraggedItem(viewOrder[0]); }}
                        >
                            <div className="px-4 py-2 bg-zinc-800 text-white text-xs font-medium border-r border-zinc-700 flex items-center gap-2">
                                <GripHorizontal className="w-3 h-3 text-zinc-500" />
                                {viewOrder[0] === 'notes' ? 'Notes' : 'Chat'}
                            </div>
                            <div className="flex items-center gap-1 px-2">
                                <button onClick={() => setRightPanelLayout(prev => prev === 'vertical' ? 'horizontal' : 'vertical')} className="p-1 hover:bg-zinc-800 rounded text-zinc-500">
                                    {rightPanelLayout === 'vertical' ? <Columns className="w-3 h-3" /> : <Rows className="w-3 h-3" />}
                                </button>
                                <button onClick={() => { setRightPanelLayout('tabs'); setActiveTab(viewOrder[0]); }} className="p-1 hover:bg-zinc-800 rounded text-zinc-500">
                                    <Maximize2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden relative" onClick={handleBackgroundClick}>
                            {viewOrder[0] === 'notes' ? (
                                <div className="h-full overflow-auto p-8">
                                    <Editor 
                                        content={markdownContent} 
                                        onUpdate={() => {}} 
                                        editable={false}
                                        onAnnotationHover={setHoveredAnnotationId}
                                        onAnnotationClick={handleAnnotationClick}
                                        selectedAnnotationId={selectedAnnotationId}
                                    />
                                </div>
                            ) : (
                                <ChatAssistant 
                                    slideContent={slideContent}
                                    slideNumber={slideNumber}
                                    onAddToNotes={onAddToNotes}
                                    messages={chatMessages}
                                    onMessagesChange={setChatMessages}
                                />
                            )}
                        </div>
                    </div>
                </Panel>
                <PanelResizeHandle className={`${rightPanelLayout === 'vertical' ? 'h-1 w-full' : 'w-1 h-full'} bg-zinc-800 hover:bg-indigo-500 transition-colors`} />
                <Panel defaultSize={50} minSize={20}>
                    <div 
                        className="h-full flex flex-col bg-black relative"
                        onDragOver={(e) => handleDragOver(e, 'panel2')}
                        onDragLeave={() => { setDragPosition(null); setDragTarget(null); }}
                        onDrop={(e) => handleDrop(e, 'panel2')}
                    >
                        {dragTarget === 'panel2' && <DropOverlay position={dragPosition} />}
                        <div 
                            className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800 cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => { e.dataTransfer.setData('view', viewOrder[1]); setDraggedItem(viewOrder[1]); }}
                        >
                            <div className="px-4 py-2 bg-zinc-800 text-white text-xs font-medium border-r border-zinc-700 flex items-center gap-2">
                                <GripHorizontal className="w-3 h-3 text-zinc-500" />
                                {viewOrder[1] === 'notes' ? 'Notes' : 'Chat'}
                            </div>
                            <div className="flex items-center gap-1 px-2">
                                <button onClick={() => { setRightPanelLayout('tabs'); setActiveTab(viewOrder[1]); }} className="p-1 hover:bg-zinc-800 rounded text-zinc-500">
                                    <Maximize2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            {viewOrder[1] === 'notes' ? (
                                <div className="h-full overflow-auto p-8 prose prose-invert prose-zinc max-w-none">
                                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                                </div>
                            ) : (
                                <ChatAssistant 
                                    slideContent={slideContent}
                                    slideNumber={slideNumber}
                                    onAddToNotes={onAddToNotes}
                                    messages={chatMessages}
                                    onMessagesChange={setChatMessages}
                                />
                            )}
                        </div>
                    </div>
                </Panel>
            </PanelGroup>
          )}
        </Panel>
      </PanelGroup>
    </div>
  );
}