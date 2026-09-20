/**
 * Identify valid Mermaid syntax blocks for live validation
 * Returns an array of blocks with start/end positions and validity
 */
export function identifyValidMermaidBlocks(
  mermaid: string
): Array<{ start: number; end: number; isValid: boolean }> {
  const blocks: Array<{ start: number; end: number; isValid: boolean }> = [];
  const validRanges: Array<{ start: number; end: number }> = [];

  // Track character positions in the original string
  let pos = 0;
  const lines = mermaid.split("\n");
  let inTableBlock = false;
  let tableBlockStart = 0;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = pos;
    const trimmedLine = line.trim();

    if (trimmedLine.toLowerCase().startsWith("erdiagram")) {
      // Valid erDiagram header
      validRanges.push({
        start: lineStart,
        end: lineStart + line.length,
      });
    } else if (trimmedLine) {
      // Check if it's a relationship line: TABLE1 ||--o{ TABLE2 : label
      const relationshipMatch = trimmedLine.match(
        /^([A-Za-z_][A-Za-z0-9_-]*)\s+([|o\-{}]+)\s+([A-Za-z_][A-Za-z0-9_-]*)\s*(?::\s*(.*))?$/
      );
      if (relationshipMatch && !inTableBlock) {
        validRanges.push({
          start: lineStart,
          end: lineStart + line.length,
        });
      } else {
        // Check if it's a table definition start: TABLE {
        const tableDefMatch = trimmedLine.match(
          /^([A-Za-z_][A-Za-z0-9_-]*)\s*\{/
        );
        if (tableDefMatch && !inTableBlock) {
          inTableBlock = true;
          tableBlockStart = lineStart;
          braceDepth = 1;
          // Include the opening brace line
          validRanges.push({
            start: lineStart,
            end: lineStart + line.length,
          });
        } else if (inTableBlock) {
          // We're inside a table block
          // Check for closing brace
          for (let j = 0; j < line.length; j++) {
            if (line[j] === "{") {
              braceDepth++;
            } else if (line[j] === "}") {
              braceDepth--;
              if (braceDepth === 0) {
                // Found closing brace - mark the entire table block as valid
                validRanges.push({
                  start: tableBlockStart,
                  end: lineStart + j + 1,
                });
                inTableBlock = false;
                break;
              }
            }
          }

          // If still in table block, check if this line is a valid column definition
          if (inTableBlock) {
            const colMatch = trimmedLine.match(
              /^(\w+(?:\([^)]+\))?)\s+([A-Za-z_][A-Za-z0-9_-]*)(?:\s+(PK|UK|FK))?\s*$/
            );
            if (colMatch) {
              // Valid column definition
              validRanges.push({
                start: lineStart,
                end: lineStart + line.length,
              });
            }
          }
        } else {
          // Not a recognized pattern - might be invalid, but we'll let the parser decide
          // For now, we'll mark it as potentially invalid (gray)
        }
      }
    }

    pos += line.length + 1; // +1 for newline character
  }

  // Sort valid ranges by start position
  validRanges.sort((a, b) => a.start - b.start);

  // Merge overlapping ranges
  const mergedRanges: Array<{ start: number; end: number }> = [];
  for (const range of validRanges) {
    if (mergedRanges.length === 0) {
      mergedRanges.push(range);
    } else {
      const lastRange = mergedRanges[mergedRanges.length - 1];
      if (range.start <= lastRange.end) {
        // Overlapping or adjacent - merge
        lastRange.end = Math.max(lastRange.end, range.end);
      } else {
        mergedRanges.push(range);
      }
    }
  }

  // Build blocks array - mark valid ranges and invalid ranges
  let lastEnd = 0;
  for (const range of mergedRanges) {
    // Add invalid block before this valid range
    if (range.start > lastEnd) {
      blocks.push({
        start: lastEnd,
        end: range.start,
        isValid: false,
      });
    }
    // Add valid block
    blocks.push({
      start: range.start,
      end: range.end,
      isValid: true,
    });
    lastEnd = range.end;
  }

  // Add final invalid block if there's remaining text
  if (lastEnd < mermaid.length) {
    blocks.push({
      start: lastEnd,
      end: mermaid.length,
      isValid: false,
    });
  }

  // If no blocks found but text exists, mark everything as invalid
  if (blocks.length === 0 && mermaid.length > 0) {
    blocks.push({
      start: 0,
      end: mermaid.length,
      isValid: false,
    });
  }

  return blocks;
}
