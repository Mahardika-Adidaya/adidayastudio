"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Code as CodeIcon,
  SquareCode,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";

type Props = {
  value?: string;
  onChange: (v: string) => void;
  onUploadImage: (file: File) => Promise<string>;
};

export default function InsightEditor({ value, onChange, onUploadImage }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  /* ---------------------------------------------------
   EDITOR INITIALIZATION
  --------------------------------------------------- */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),

      Placeholder.configure({
        placeholder: "Write your story…",
      }),

      Underline,

      TextAlign.configure({
        types: ["heading", "paragraph", "blockquote"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),

      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-adidaya-red underline hover:text-red-400 cursor-pointer",
        },
      }),

      Image.configure({ inline: true }),
    ],

    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },

    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[280px] text-[15px] leading-relaxed focus:outline-none [&_[style*='text-align:_center']]:text-center [&_[style*='text-align:_right']]:text-right [&_[style*='text-align:_justify']]:text-justify [&_[style*='text-align:_left']]:text-left",
      },
    },

    immediatelyRender: false,
  });

  // Sync external value changes (e.g. when loaded asynchronously from DB)
  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  /* ---------------------------------------------------
   IMAGE HANDLING
  --------------------------------------------------- */
  async function handleChooseImage() {
    if (!onUploadImage) {
      return alert("Image upload handler missing.");
    }
    fileRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await onUploadImage(file);
      editor?.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error(err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (!editor) {
    return <p className="text-gray-400">Loading editor…</p>;
  }

  /* ---------------------------------------------------
   GENERIC BUTTON COMPONENT
  --------------------------------------------------- */
  const Btn = ({
    active,
    onClick,
    icon,
    disabled,
    title,
  }: {
    active?: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    disabled?: boolean;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg ring-0 outline-none select-none shrink-0
        transition cursor-pointer
        ${
          active
            ? "bg-white text-black font-semibold shadow-sm"
            : "text-gray-300 hover:bg-white/10 hover:text-white"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
      `}
    >
      {icon}
    </button>
  );

  /* ---------------------------------------------------
   UI
  --------------------------------------------------- */
  return (
    <div className="space-y-4">
      {/* ---------------------------------------------------
       TOOLBAR (sticky single row with horizontal scroll)
      --------------------------------------------------- */}
      <div
        className="
        sticky top-20 sm:top-24 z-30
        flex items-center gap-1
        overflow-x-auto no-scrollbar
        bg-black/30 backdrop-blur-2xl
        border border-white/10
        rounded-2xl px-3 py-2
        shadow-[0_8px_32px_rgba(0,0,0,0.5)]
      "
      >
        <Btn
          icon={<Bold size={16} />}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        />

        <Btn
          icon={<Italic size={16} />}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        />

        <Btn
          icon={<UnderlineIcon size={16} />}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        />

        <div className="w-[1px] h-5 bg-white/10 mx-1 shrink-0" />

        <Btn
          icon={<Heading2 size={16} />}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        />

        <Btn
          icon={<Heading3 size={16} />}
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        />

        <Btn
          icon={<Quote size={16} />}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        />

        <div className="w-[1px] h-5 bg-white/10 mx-1 shrink-0" />

        <Btn
          icon={<List size={16} />}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        />

        <Btn
          icon={<ListOrdered size={16} />}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        />

        <Btn
          icon={<Minus size={16} />}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        />

        <div className="w-[1px] h-5 bg-white/10 mx-1 shrink-0" />

        <Btn
          icon={<AlignLeft size={16} />}
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align Left (Rata Kiri)"
        />

        <Btn
          icon={<AlignCenter size={16} />}
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align Center (Rata Tengah)"
        />

        <Btn
          icon={<AlignRight size={16} />}
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align Right (Rata Kanan)"
        />

        <Btn
          icon={<AlignJustify size={16} />}
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          title="Justify (Rata Kanan-Kiri)"
        />

        <div className="w-[1px] h-5 bg-white/10 mx-1 shrink-0" />

        <Btn
          icon={<CodeIcon size={16} />}
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        />

        <Btn
          icon={<SquareCode size={16} />}
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        />

        <Btn
          icon={<LinkIcon size={16} />}
          active={editor.isActive("link")}
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
            } else {
              const url = prompt("Enter URL:", "https://");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }
          }}
          title={editor.isActive("link") ? "Remove Link" : "Insert Link"}
        />

        <Btn
          icon={<ImageIcon size={16} />}
          onClick={handleChooseImage}
          disabled={uploading}
          title="Upload Image"
        />
      </div>

      {/* ---------------------------------------------------
       HIDDEN FILE INPUT
      --------------------------------------------------- */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* ---------------------------------------------------
       EDITOR BOX
      --------------------------------------------------- */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 focus-within:border-white/25 transition-colors">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
