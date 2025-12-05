'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { Markdown } from 'tiptap-markdown';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, List, ListOrdered } from 'lucide-react';
import { useEffect } from 'react';

interface EditorProps {
  content: string;
  onUpdate: (content: string) => void;
  editable?: boolean;
  onAnnotationHover?: (index: number | null) => void;
  onAnnotationClick?: (index: number) => void;
  selectedAnnotationId?: number | null;
}

const CustomHighlight = Highlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes['data-id']) {
            return {}
          }
          return {
            'data-id': attributes['data-id'],
            'class': 'annotation-mark bg-indigo-500/30 text-indigo-200 px-0.5 rounded cursor-pointer hover:bg-indigo-500/50 transition-colors duration-200',
          }
        },
      },
    }
  },
});

export default function Editor({ content, onUpdate, editable = true, onAnnotationHover, onAnnotationClick, selectedAnnotationId }: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      CustomHighlight.configure({ multicolor: true }),
      Markdown.configure({
        html: true, // Enable HTML to support <mark> tags
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: content,
    editable: editable,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-zinc max-w-none focus:outline-none min-h-[50vh]',
      },
      handleDOMEvents: {
        click: (view, event) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'MARK' && target.hasAttribute('data-id')) {
                event.stopPropagation(); // Prevent clearing selection
                const index = parseInt(target.getAttribute('data-id') || '-1');
                if (index >= 0 && onAnnotationClick) {
                    onAnnotationClick(index);
                }
            }
            return false;
        },
        mouseover: (view, event) => {
          const target = event.target as HTMLElement;
          if (target.tagName === 'MARK' && target.hasAttribute('data-id')) {
             const index = parseInt(target.getAttribute('data-id') || '-1');
             if (index >= 0 && onAnnotationHover) {
                 onAnnotationHover(index);
             }
          }
          return false;
        },
        mouseout: (view, event) => {
           const target = event.target as HTMLElement;
           if (target.tagName === 'MARK' && onAnnotationHover) {
               onAnnotationHover(null);
           }
           return false;
        }
      }
    },
    onUpdate: ({ editor }) => {
      const storage = (editor.storage as any).markdown;
      if (storage && typeof storage.getMarkdown === 'function') {
        const markdown = storage.getMarkdown();
        onUpdate(markdown);
      }
    },
  });

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // Handle selection highlighting
  useEffect(() => {
      if (!editor) return;
      
      // Remove previous selection styles
      const marks = document.querySelectorAll('.annotation-mark');
      marks.forEach(mark => {
          mark.classList.remove('ring-2', 'ring-yellow-400', 'bg-yellow-400/20', 'text-yellow-200');
          mark.classList.add('bg-indigo-500/30', 'text-indigo-200');
      });

      if (selectedAnnotationId !== null && selectedAnnotationId !== undefined) {
          const selectedMark = document.querySelector(`.annotation-mark[data-id="${selectedAnnotationId}"]`);
          if (selectedMark) {
              selectedMark.classList.remove('bg-indigo-500/30', 'text-indigo-200');
              selectedMark.classList.add('ring-2', 'ring-yellow-400', 'bg-yellow-400/20', 'text-yellow-200');
              selectedMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [selectedAnnotationId, editor]);

  // Update content if it changes externally (e.g. new slide loaded)
  useEffect(() => {
    if (!editor) return;

    const storage = (editor.storage as any).markdown;
    if (storage && typeof storage.getMarkdown === 'function') {
      const currentContent = storage.getMarkdown();
      // Only update if content is different AND editor is not focused
      // This prevents cursor jumping while typing
      if (content !== currentContent && !editor.isFocused) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      {editor && (
        <BubbleMenu 
          editor={editor} 
          className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-1 overflow-hidden"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${editor.isActive('bold') ? 'text-indigo-400 bg-zinc-800' : 'text-zinc-400'}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${editor.isActive('italic') ? 'text-indigo-400 bg-zinc-800' : 'text-zinc-400'}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${editor.isActive('strike') ? 'text-indigo-400 bg-zinc-800' : 'text-zinc-400'}`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${editor.isActive('code') ? 'text-indigo-400 bg-zinc-800' : 'text-zinc-400'}`}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'text-indigo-400 bg-zinc-800' : 'text-zinc-400'}`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-indigo-400 bg-zinc-800' : 'text-zinc-400'}`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${editor.isActive('bulletList') ? 'text-indigo-400 bg-zinc-800' : 'text-zinc-400'}`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${editor.isActive('orderedList') ? 'text-indigo-400 bg-zinc-800' : 'text-zinc-400'}`}
            title="Ordered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
