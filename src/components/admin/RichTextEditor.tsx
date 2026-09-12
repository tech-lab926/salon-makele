"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Image as ImageIcon, Loader2, Code, Eye } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto my-4',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] p-4 bg-white rounded-b-lg',
      },
    },
    immediatelyRender: false,
  });

  // Keep content in sync if value prop changes from outside (e.g. data load in edit page)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && mode === 'visual') {
      editor.commands.setContent(value);
    }
  }, [value, editor, mode]);

  if (!editor) {
    return <div className="h-[350px] border border-gray-300 rounded-lg animate-pulse bg-gray-50 flex items-center justify-center text-gray-400">エディタを読み込み中...</div>;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        if (mode === 'visual') {
          editor.chain().focus().setImage({ src: data.data.url }).run();
        } else {
          onChange(value + `\n<img src="${data.data.url}" alt="image" class="rounded-xl max-w-full h-auto my-4" />\n`);
        }
        toast.success("画像を挿入しました");
      } else {
        toast.error(data.error || "アップロードに失敗しました");
      }
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleH2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
  const toggleH3 = () => editor.chain().focus().toggleHeading({ level: 3 }).run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();

  const ToolbarButton = ({ onClick, isActive, disabled, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-gray-200 text-[#c2185b]' : 'text-gray-600'
      } disabled:opacity-50`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col">
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1 items-center">
        {mode === 'visual' ? (
          <>
            <ToolbarButton onClick={toggleBold} isActive={editor.isActive('bold')} title="太字">
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={toggleItalic} isActive={editor.isActive('italic')} title="斜体">
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <ToolbarButton onClick={toggleH2} isActive={editor.isActive('heading', { level: 2 })} title="見出し2">
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={toggleH3} isActive={editor.isActive('heading', { level: 3 })} title="見出し3">
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <ToolbarButton onClick={toggleBulletList} isActive={editor.isActive('bulletList')} title="箇条書き">
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={toggleOrderedList} isActive={editor.isActive('orderedList')} title="番号付きリスト">
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
          </>
        ) : (
          <div className="text-sm text-gray-500 px-2 py-1 flex-1">HTML編集モード</div>
        )}
        
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`flex items-center gap-1.5 px-3 py-1.5 ${mode === 'visual' ? 'ml-auto' : ''} text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50`}
          title="画像をアップロード"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          画像追加
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1 ml-auto md:ml-1"></div>
        <button
          type="button"
          onClick={() => {
            if (mode === 'html') {
              editor.commands.setContent(value);
            }
            setMode(mode === 'visual' ? 'html' : 'visual');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            mode === 'html' ? 'bg-[#c2185b] text-white hover:bg-[#880e4f]' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
          title="HTML/ビジュアル切り替え"
        >
          {mode === 'visual' ? (
            <>
              <Code className="w-4 h-4" />
              HTML編集
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              プレビューに戻る
            </>
          )}
        </button>
      </div>
      
      {mode === 'visual' ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[300px] p-4 font-mono text-sm bg-gray-900 text-gray-100 focus:outline-none rounded-b-lg"
          placeholder="<h1>HTMLを入力...</h1>"
        />
      )}
    </div>
  );
}
