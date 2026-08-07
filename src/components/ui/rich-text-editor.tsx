import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  RemoveFormattingIcon,
  Strikethrough,
  Subscript,
  Superscript as SuperscriptIcon,
  Underline as UnderlineIcon,
  Undo,
  Unlink,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import "./rich-text-editor.css";

type Props = {
  value?: string;
  placeholder?: string;
  onChange?: (content: string) => void;
  className?: string;
  compact?: boolean;
  minHeightClass?: string;
};

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <ToggleGroupItem
      type="button"
      value={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      data-state={active ? "on" : "off"}
      className="size-8 p-0"
    >
      {children}
    </ToggleGroupItem>
  );
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "",
  className,
  compact = false,
  minHeightClass,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: compact ? false : { levels: [2, 3] },
      }),
      Underline,
      Highlight,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      TextAlign.configure({
        types: compact ? ["paragraph"] : ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Superscript,
      SubScript,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "tiptap block w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm outline-none",
          minHeightClass ?? (compact ? "min-h-[64px]" : "min-h-[88px]"),
        ),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input bg-background shadow-xs",
        className,
      )}
    >
      <div className="flex flex-wrap gap-1 border-b bg-muted/30 p-1.5">
        <ToggleGroup type="multiple" variant="outline" size="sm" className="flex-wrap">
          <ToolbarButton
            label="Bold"
            active={editor.isActive("bold")}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive("italic")}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={editor.isActive("underline")}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Strike"
            active={editor.isActive("strike")}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-3.5" />
          </ToolbarButton>
          {!compact ? (
            <>
              <ToolbarButton
                label="Highlight"
                active={editor.isActive("highlight")}
                disabled={!editor.can().chain().focus().toggleHighlight().run()}
                onClick={() => editor.chain().focus().toggleHighlight().run()}
              >
                <Highlighter className="size-3.5" />
              </ToolbarButton>
              <ToolbarButton
                label="Code"
                active={editor.isActive("code")}
                disabled={!editor.can().chain().focus().toggleCode().run()}
                onClick={() => editor.chain().focus().toggleCode().run()}
              >
                <Code className="size-3.5" />
              </ToolbarButton>
            </>
          ) : null}
        </ToggleGroup>

        {!compact ? (
          <ToggleGroup type="multiple" variant="outline" size="sm" className="flex-wrap">
            <ToolbarButton
              label="Heading 2"
              active={editor.isActive("heading", { level: 2 })}
              disabled={
                !editor.can().chain().focus().toggleHeading({ level: 2 }).run()
              }
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              label="Heading 3"
              active={editor.isActive("heading", { level: 3 })}
              disabled={
                !editor.can().chain().focus().toggleHeading({ level: 3 }).run()
              }
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              <Heading3 className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              label="Quote"
              active={editor.isActive("blockquote")}
              disabled={!editor.can().chain().focus().toggleBlockquote().run()}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="size-3.5" />
            </ToolbarButton>
          </ToggleGroup>
        ) : null}

        <ToggleGroup type="multiple" variant="outline" size="sm" className="flex-wrap">
          <ToolbarButton
            label="Bullet list"
            active={editor.isActive("bulletList")}
            disabled={!editor.can().chain().focus().toggleBulletList().run()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Ordered list"
            active={editor.isActive("orderedList")}
            disabled={!editor.can().chain().focus().toggleOrderedList().run()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-3.5" />
          </ToolbarButton>
          {!compact ? (
            <ToolbarButton
              label="Horizontal rule"
              active={false}
              disabled={!editor.can().chain().focus().setHorizontalRule().run()}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus className="size-3.5" />
            </ToolbarButton>
          ) : null}
        </ToggleGroup>

        <ToggleGroup type="multiple" variant="outline" size="sm" className="flex-wrap">
          <ToolbarButton
            label="Link"
            active={editor.isActive("link")}
            disabled={
              !editor
                .can()
                .chain()
                .focus()
                .setLink({ href: "https://example.com" })
                .run()
            }
            onClick={setLink}
          >
            <LinkIcon className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Unlink"
            active={false}
            disabled={!editor.can().chain().focus().unsetLink().run()}
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Unlink className="size-3.5" />
          </ToolbarButton>
        </ToggleGroup>

        {!compact ? (
          <ToggleGroup type="multiple" variant="outline" size="sm" className="flex-wrap">
            <ToolbarButton
              label="Align left"
              active={editor.isActive({ textAlign: "left" })}
              disabled={!editor.can().chain().focus().setTextAlign("left").run()}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
            >
              <AlignLeft className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              label="Align center"
              active={editor.isActive({ textAlign: "center" })}
              disabled={!editor.can().chain().focus().setTextAlign("center").run()}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
            >
              <AlignCenter className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              label="Align right"
              active={editor.isActive({ textAlign: "right" })}
              disabled={!editor.can().chain().focus().setTextAlign("right").run()}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
            >
              <AlignRight className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              label="Align justify"
              active={editor.isActive({ textAlign: "justify" })}
              disabled={!editor.can().chain().focus().setTextAlign("justify").run()}
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            >
              <AlignJustify className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              label="Superscript"
              active={editor.isActive("superscript")}
              disabled={!editor.can().chain().focus().toggleSuperscript().run()}
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
            >
              <SuperscriptIcon className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              label="Subscript"
              active={editor.isActive("subscript")}
              disabled={!editor.can().chain().focus().toggleSubscript().run()}
              onClick={() => editor.chain().focus().toggleSubscript().run()}
            >
              <Subscript className="size-3.5" />
            </ToolbarButton>
          </ToggleGroup>
        ) : null}

        <ToggleGroup type="multiple" variant="outline" size="sm" className="flex-wrap">
          <ToolbarButton
            label="Clear formatting"
            active={false}
            disabled={
              !editor.can().chain().focus().clearNodes().unsetAllMarks().run()
            }
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
          >
            <RemoveFormattingIcon className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Undo"
            active={false}
            disabled={!editor.can().chain().focus().undo().run()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            active={false}
            disabled={!editor.can().chain().focus().redo().run()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo className="size-3.5" />
          </ToolbarButton>
        </ToggleGroup>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
