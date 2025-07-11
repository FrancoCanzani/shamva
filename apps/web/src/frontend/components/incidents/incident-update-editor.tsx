import { cn } from "@/frontend/lib/utils";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export function IncidentUpdateEditor({
  onSubmit,
  loading,
}: {
  onSubmit: (content: string) => void;
  loading?: boolean;
}) {
  const [submitted, setSubmitted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-xs max-w-none focus:outline-none min-h-[200px] p-4 border rounded-md shadow-xs",
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    const html = editor.getHTML();
    if (!html) return;
    setSubmitted(true);
    onSubmit(html);
    editor.commands.clearContent();
    setSubmitted(false);
  };

  if (!editor) return null;

  const toolbarItems = [
    {
      icon: Undo,
      onClick: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().undo(),
      tooltip: "Undo",
    },
    {
      icon: Redo,
      onClick: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().redo(),
      tooltip: "Redo",
    },
    { separator: true },
    {
      icon: Heading1,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive("heading", { level: 1 }),
      tooltip: "Heading 1",
    },
    {
      icon: Heading2,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
      tooltip: "Heading 2",
    },
    {
      icon: Heading3,
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
      tooltip: "Heading 3",
    },
    { separator: true },
    {
      icon: Bold,
      onClick: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      tooltip: "Bold",
    },
    {
      icon: Italic,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      tooltip: "Italic",
    },
    {
      icon: Strikethrough,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive("strike"),
      tooltip: "Strikethrough",
    },
    { separator: true },
    {
      icon: List,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
      tooltip: "Bullet List",
    },
    {
      icon: ListOrdered,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
      tooltip: "Numbered List",
    },
    { separator: true },
    {
      icon: Quote,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
      tooltip: "Quote",
    },
    {
      icon: Code,
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      active: editor.isActive("codeBlock"),
      tooltip: "Code Block",
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="bg-carbon-50 dark:bg-carbon-800 flex items-center gap-1 overflow-auto rounded-md border shadow-xs">
        {toolbarItems.map((item, index) => {
          if (item.separator) {
            return (
              <Separator
                key={`separator-${index}`}
                orientation="vertical"
                className="h-6"
              />
            );
          }

          const Icon = item.icon;
          if (!Icon) return null;

          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(
                "h-8 w-8 p-0",
                item.active && "bg-muted text-foreground",
                item.disabled && "cursor-not-allowed opacity-50"
              )}
              title={item.tooltip}
              type="button"
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
      <EditorContent editor={editor} />
      <div className="flex items-center justify-end">
        <Button type="submit" size="xs" disabled={loading || submitted}>
          {loading ? "Posting..." : "Post Update"}
        </Button>
      </div>
    </form>
  );
}
