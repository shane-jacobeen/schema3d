import { useLayoutEffect, useMemo, useRef } from "react";
import type { SchemaFormat } from "@/schemas/parsers";
import { identifyValidBlocks } from "@/schemas/parsers";

interface SchemaEditorProps {
  value: string;
  format?: SchemaFormat; // Optional - if not provided, auto-detects for highlighting
  onChange: (value: string) => void;
  className?: string;
}

interface HighlightSegment {
  key: string;
  text: string;
  color: string;
}

/**
 * Syntax-highlighted schema editor. Highlight spans are React children in a
 * mirror layer; typing goes through a textarea so React never sees innerHTML
 * writes or third-party DOM rewrites under a contentEditable node.
 */
export function SchemaEditor({
  value,
  format,
  onChange,
  className = "",
}: SchemaEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const pendingCaretRef = useRef<number | null>(null);

  const segments = useMemo(
    () => getHighlightSegments(value, format),
    [value, format]
  );

  useLayoutEffect(() => {
    const caret = pendingCaretRef.current;
    const textarea = textareaRef.current;
    if (caret === null || !textarea) return;
    pendingCaretRef.current = null;
    textarea.selectionStart = caret;
    textarea.selectionEnd = caret;
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text/plain");
    const { selectionStart, selectionEnd } = event.currentTarget;
    pendingCaretRef.current = selectionStart + pasted.length;
    onChange(
      value.slice(0, selectionStart) + pasted + value.slice(selectionEnd)
    );
  };

  const handleScroll = () => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  };

  return (
    <div className={`relative ${className}`} translate="no">
      <pre
        ref={highlightRef}
        aria-hidden
        className={`${EDITOR_LAYER_CLASS} overflow-hidden pointer-events-none text-inherit`}
      >
        {segments.map((segment) => (
          <span key={segment.key} style={{ color: segment.color }}>
            {segment.text}
          </span>
        ))}
        {"\n"}
      </pre>
      <textarea
        ref={textareaRef}
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        translate="no"
        aria-label="Schema source"
        className={`${EDITOR_LAYER_CLASS} ${EDITOR_SCROLLBAR_CLASS} resize-none overflow-auto border-0 text-transparent caret-white outline-none`}
        style={{ caretColor: "white" }}
        onChange={handleChange}
        onPaste={handlePaste}
        onScroll={handleScroll}
      />
    </div>
  );
}

const EDITOR_LAYER_CLASS =
  "absolute inset-0 box-border m-0 whitespace-pre-wrap break-words bg-transparent p-[inherit] font-[inherit] text-[length:inherit] leading-[inherit] [scrollbar-gutter:stable]";

const EDITOR_SCROLLBAR_CLASS =
  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-500/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-400/70 [scrollbar-width:thin] [scrollbar-color:rgb(100,116,139,0.5)_transparent]";

function getHighlightSegments(
  value: string,
  format?: SchemaFormat
): HighlightSegment[] {
  if (value.length === 0) {
    return [];
  }

  const blocks = identifyValidBlocks(value, format);
  if (blocks.length === 0) {
    return [{ key: "all", text: value, color: "#64748b" }];
  }

  return blocks.map((block) => ({
    key: `${block.start}-${block.end}`,
    text: value.substring(block.start, block.end),
    color: block.isValid ? "white" : "#64748b",
  }));
}
