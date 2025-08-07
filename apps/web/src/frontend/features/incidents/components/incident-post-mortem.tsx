import { Button } from "@/frontend/components/ui/button";
import { Separator } from "@/frontend/components/ui/separator";
import { cn } from "@/frontend/utils/utils";
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
import { ComponentType, useEffect, useMemo, useState } from "react";
import { useUpdateIncident } from "../api/mutations";

interface IncidentPostMortemProps {
  incidentId: string;
  contentHtml: string;
}

type IconType = ComponentType<{ className?: string }>;

interface ToolbarButton {
  kind: "button";
  key: string;
  icon: IconType;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title: string;
}

interface ToolbarSeparator {
  kind: "separator";
  key: string;
}

type ToolbarItem = ToolbarButton | ToolbarSeparator;

export default function IncidentPostMortem({
  incidentId,
  contentHtml,
}: IncidentPostMortemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [contentLength, setContentLength] = useState<number>(
    (contentHtml || "").trim().length
  );
  const updateIncidentMutation = useUpdateIncident();

  const postMortem = (contentHtml || "").trim();
  const shouldClampPostMortem =
    postMortem.length > 600 || postMortem.split(/\r?\n/).length > 10;

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content: postMortem,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-[240px] max-h-[480px] overflow-y-auto p-2 border rounded",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = postMortem;
    if (incoming && incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, false);
    }
    // reset expand state when content changes
    setExpanded(false);
    setContentLength(incoming.length);
    const updateHandler = () => {
      const html = editor.getHTML();
      setContentLength(html.length);
    };
    editor.on("update", updateHandler);
    return () => {
      editor.off("update", updateHandler);
    };
  }, [editor, postMortem]);

  const toolbarItems: ToolbarItem[] = useMemo(() => {
    if (!editor) return [];
    const items: ToolbarItem[] = [
      {
        kind: "button",
        key: "undo",
        icon: Undo,
        onClick: () => editor.chain().focus().undo().run(),
        disabled: !editor.can().undo(),
        title: "Undo",
      },
      {
        kind: "button",
        key: "redo",
        icon: Redo,
        onClick: () => editor.chain().focus().redo().run(),
        disabled: !editor.can().redo(),
        title: "Redo",
      },
      { kind: "separator", key: "sep-1" },
      {
        kind: "button",
        key: "h1",
        icon: Heading1,
        onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        active: editor.isActive("heading", { level: 1 }),
        title: "Heading 1",
      },
      {
        kind: "button",
        key: "h2",
        icon: Heading2,
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        active: editor.isActive("heading", { level: 2 }),
        title: "Heading 2",
      },
      {
        kind: "button",
        key: "h3",
        icon: Heading3,
        onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        active: editor.isActive("heading", { level: 3 }),
        title: "Heading 3",
      },
      { kind: "separator", key: "sep-2" },
      {
        kind: "button",
        key: "bold",
        icon: Bold,
        onClick: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive("bold"),
        title: "Bold",
      },
      {
        kind: "button",
        key: "italic",
        icon: Italic,
        onClick: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive("italic"),
        title: "Italic",
      },
      {
        kind: "button",
        key: "strike",
        icon: Strikethrough,
        onClick: () => editor.chain().focus().toggleStrike().run(),
        active: editor.isActive("strike"),
        title: "Strikethrough",
      },
      { kind: "separator", key: "sep-3" },
      {
        kind: "button",
        key: "bullets",
        icon: List,
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        active: editor.isActive("bulletList"),
        title: "Bullet List",
      },
      {
        kind: "button",
        key: "ordered",
        icon: ListOrdered,
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        active: editor.isActive("orderedList"),
        title: "Numbered List",
      },
      { kind: "separator", key: "sep-4" },
      {
        kind: "button",
        key: "quote",
        icon: Quote,
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
        active: editor.isActive("blockquote"),
        title: "Quote",
      },
      {
        kind: "button",
        key: "code",
        icon: Code,
        onClick: () => editor.chain().focus().toggleCodeBlock().run(),
        active: editor.isActive("codeBlock"),
        title: "Code Block",
      },
    ];
    return items;
  }, [editor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    const html = editor.getHTML();
    if (!html) return;
    if (html.length > 100000) return;
    await updateIncidentMutation.mutateAsync({
      incidentId,
      data: { post_mortem: html },
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Post-mortem</span>
        {isEditing ? (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        ) : (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      {!isEditing ? (
        postMortem.length > 0 ? (
          shouldClampPostMortem ? (
            <div className="relative rounded border bg-stone-50 p-2 dark:bg-stone-950">
              <div
                className={!expanded ? "max-h-64 overflow-hidden" : undefined}
              >
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: postMortem }}
                />
              </div>
              {!expanded && (
                <div className="from-background via-background/80 pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t to-transparent py-6">
                  <Button
                    size="xs"
                    variant="outline"
                    className="pointer-events-auto"
                    onClick={() => setExpanded(true)}
                  >
                    Show more
                  </Button>
                </div>
              )}
              {expanded && (
                <div className="mt-2 flex justify-end">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setExpanded(false)}
                  >
                    Show less
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: postMortem }}
            />
          )
        ) : (
          <div className="text-muted-foreground rounded border border-dashed p-4 text-center text-xs">
            No post-mortem written
          </div>
        )
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center gap-1 overflow-auto rounded border bg-stone-50 shadow-xs dark:bg-stone-950">
            {toolbarItems.map((item) => {
              if (item.kind === "separator") {
                return (
                  <Separator
                    key={item.key}
                    orientation="vertical"
                    className="h-6"
                  />
                );
              }
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  variant="ghost"
                  size="sm"
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={cn(
                    "h-8 w-8 p-0",
                    item.active && "bg-muted text-foreground",
                    item.disabled && "cursor-not-allowed opacity-50"
                  )}
                  title={item.title}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
          <EditorContent editor={editor} />
          <div className="flex items-center justify-between gap-2">
            <span
              className={
                contentLength > 100000
                  ? "text-xs text-red-600"
                  : "text-muted-foreground text-xs"
              }
            >
              {contentLength}/100000
            </span>
            <Button
              type="submit"
              size="xs"
              variant={"outline"}
              disabled={
                updateIncidentMutation.isPending || contentLength > 100000
              }
            >
              {updateIncidentMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
