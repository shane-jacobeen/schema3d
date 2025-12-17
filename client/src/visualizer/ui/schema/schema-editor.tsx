import { useEffect, useRef } from "react";
import type { SchemaFormat } from "@/schemas/parsers";
import { identifyValidBlocks } from "@/schemas/parsers";

interface SchemaEditorProps {
  value: string;
  format?: SchemaFormat; // Optional - if not provided, auto-detects for highlighting
  onChange: (value: string) => void;
  className?: string;
}

/**
 * ContentEditable text editor with format-aware syntax highlighting
 */
export function SchemaEditor({
  value,
  format,
  onChange,
  className = "",
}: SchemaEditorProps) {
  const editableRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const isPastingRef = useRef(false);

  // Update highlighting when value or format changes
  useEffect(() => {
    if (!editableRef.current) return;
    if (isUpdatingRef.current) return;

    const frameId = requestAnimationFrame(() => {
      if (!editableRef.current || isUpdatingRef.current) return;

      // Save cursor position
      const selection = window.getSelection();
      let cursorOffset = 0;
      if (
        selection &&
        selection.rangeCount > 0 &&
        editableRef.current.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editableRef.current);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        cursorOffset = preCaretRange.toString().length;
      }

      // Build HTML with syntax highlighting
      const blocks = identifyValidBlocks(value, format);
      const htmlParts: string[] = [];

      if (blocks.length === 0 && value.length > 0) {
        // All invalid
        const escaped = escapeHtml(value);
        htmlParts.push(`<span style="color: #64748b">${escaped}</span>`);
      } else if (value.length === 0) {
        htmlParts.push("");
      } else {
        blocks.forEach((block) => {
          const text = value.substring(block.start, block.end);
          const color = block.isValid ? "white" : "#64748b";
          const escaped = escapeHtml(text);
          htmlParts.push(`<span style="color: ${color}">${escaped}</span>`);
        });
      }

      // Update content
      isUpdatingRef.current = true;
      editableRef.current.innerHTML = htmlParts.join("");

      // Restore cursor
      if (cursorOffset > 0 && selection) {
        restoreCursor(editableRef.current, cursorOffset, selection);
      }

      isUpdatingRef.current = false;
    });

    return () => cancelAnimationFrame(frameId);
  }, [value, format]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (isUpdatingRef.current || isPastingRef.current) return;
    const newValue = e.currentTarget.textContent || "";
    onChange(newValue);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    isPastingRef.current = true;
    const text = e.clipboardData.getData("text/plain");
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    requestAnimationFrame(() => {
      const newValue = editableRef.current?.textContent || "";

      // Format will be auto-detected by the live validation in SchemaControls
      onChange(newValue);
      setTimeout(() => {
        isPastingRef.current = false;
      }, 0);
    });
  };

  return (
    <div
      ref={editableRef}
      contentEditable
      suppressContentEditableWarning
      className={className}
      style={{
        caretColor: "white",
        lineHeight: "1.5",
      }}
      onInput={handleInput}
      onPaste={handlePaste}
    />
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function restoreCursor(
  element: HTMLElement,
  offset: number,
  selection: Selection
): void {
  try {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    let currentOffset = 0;
    let targetNode: Node | null = null;
    let targetOffset = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const nodeText = node.textContent || "";
      const nodeLength = nodeText.length;

      if (currentOffset + nodeLength >= offset) {
        targetNode = node;
        targetOffset = Math.min(offset - currentOffset, nodeLength);
        break;
      }
      currentOffset += nodeLength;
    }

    if (targetNode) {
      const range = document.createRange();
      range.setStart(targetNode, targetOffset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } catch (_e) {
    // Ignore cursor restoration errors
  }
}
