'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string; // Additional classes for styling the container
}

export function RichTextEditor({ content, onChange, placeholder, className = '' }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit],
        content,
        editorProps: {
            attributes: {
                // Tailwind classes to style the editor area natively
                class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[150px] p-4 bg-background border border-border rounded-md',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className={`rich-text-container flex flex-col gap-2 ${className}`}>
            {/* Optional Toolbar: We can add bold/italic triggers here */}
            <div className="flex flex-wrap gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-2 py-1 text-sm border rounded ${editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                >
                    Bold
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-2 py-1 text-sm border rounded ${editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                >
                    Italic
                </button>
                {/* More buttons... */}
            </div>

            {/* Editor Content Surface */}
            <EditorContent editor={editor} />
        </div>
    );
}
