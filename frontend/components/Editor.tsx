'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, List, ListOrdered } from 'lucide-react';
import { useEffect } from 'react';

interface EditorProps {
  content: string;
  onUpdate: (content: string) => void;
  editable?: boolean;
}

export default function Editor({ content, onUpdate, editable = true }: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Markdown.configure({
        html: false,
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
    },
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any).markdown.getMarkdown();
      onUpdate(markdown);
    },
  });

  // Update content if it changes externally (e.g. new slide loaded)
  useEffect(() => {
    if (editor && content !== (editor.storage as any).markdown.getMarkdown()) {
      editor.commands.setContent(content);
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
