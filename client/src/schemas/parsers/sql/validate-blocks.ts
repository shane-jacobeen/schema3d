import { REGEX } from "./regex";
import { findMatchingParen } from "./helpers";

/**
 * Identify valid SQL blocks and their positions in the text
 */
export function identifyValidSqlBlocks(
  sql: string
): Array<{ start: number; end: number; isValid: boolean }> {
  const blocks: Array<{ start: number; end: number; isValid: boolean }> = [];

  // Find all CREATE TABLE, ALTER TABLE, and CREATE VIEW statements
  const createTableStartRegex = new RegExp(
    REGEX.CREATE_TABLE.source,
    REGEX.CREATE_TABLE.flags
  );
  const createViewRegex = new RegExp(
    REGEX.CREATE_VIEW.source,
    REGEX.CREATE_VIEW.flags
  );

  let match;
  const validRanges: Array<{ start: number; end: number }> = [];

  // Find CREATE TABLE statements
  while ((match = createTableStartRegex.exec(sql)) !== null) {
    const startIndex = match.index;
    const openParenIndex = match.index + match[0].length - 1;
    const closeParenIndex = findMatchingParen(sql, openParenIndex);

    if (closeParenIndex !== -1) {
      // Find the semicolon or end of statement
      let endIndex = closeParenIndex + 1;
      while (endIndex < sql.length && /\s/.test(sql[endIndex])) {
        endIndex++;
      }
      if (sql[endIndex] === ";") {
        endIndex++;
      }
      validRanges.push({
        start: startIndex,
        end: endIndex,
      });
    }
  }

  // Find ALTER TABLE statements (any ALTER TABLE operation, not just ADD)
  const alterTableAnyRegex =
    /ALTER\s+TABLE\s+(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?[`"]?\s+/gi;
  while ((match = alterTableAnyRegex.exec(sql)) !== null) {
    const startIndex = match.index;
    // Find the end of the statement (semicolon or next statement)
    let endIndex = startIndex + match[0].length;
    let parenDepth = 0;
    let inQuotes = false;
    let quoteChar = "";

    while (endIndex < sql.length) {
      const char = sql[endIndex];

      // Handle quoted strings
      if (
        (char === '"' || char === "'" || char === "`") &&
        (endIndex === 0 || sql[endIndex - 1] !== "\\")
      ) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = "";
        }
      }

      if (!inQuotes) {
        if (char === "(") {
          parenDepth++;
        } else if (char === ")") {
          parenDepth--;
        } else if (char === ";" && parenDepth === 0) {
          endIndex++;
          break;
        }

        // Check for next statement (only when not in parentheses or quotes)
        if (
          parenDepth === 0 &&
          sql
            .substring(endIndex)
            .match(/^\s*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT)\s+/i)
        ) {
          break;
        }
      }

      endIndex++;
    }

    validRanges.push({
      start: startIndex,
      end: endIndex,
    });
  }

  // Find CREATE VIEW statements
  while ((match = createViewRegex.exec(sql)) !== null) {
    const startIndex = match.index;
    // Find the end of the statement (semicolon or next statement)
    let endIndex = startIndex + match[0].length;
    let parenDepth = 0;
    let inQuotes = false;
    let quoteChar = "";

    // Views typically end with a semicolon or the next statement
    // Need to handle SELECT statements in the view definition
    while (endIndex < sql.length) {
      const char = sql[endIndex];

      // Handle quoted strings
      if (
        (char === '"' || char === "'" || char === "`") &&
        (endIndex === 0 || sql[endIndex - 1] !== "\\")
      ) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = "";
        }
      }

      if (!inQuotes) {
        if (char === "(") {
          parenDepth++;
        } else if (char === ")") {
          parenDepth--;
        } else if (char === ";" && parenDepth === 0) {
          endIndex++;
          break;
        }

        // Check for next statement (only when not in parentheses or quotes)
        // For views, we need to be careful not to match SELECT inside the view definition
        if (
          parenDepth === 0 &&
          sql
            .substring(endIndex)
            .match(/^\s*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\s+/i)
        ) {
          break;
        }
      }

      endIndex++;
    }

    validRanges.push({
      start: startIndex,
      end: endIndex,
    });
  }

  // Sort ranges by start position
  validRanges.sort((a, b) => a.start - b.start);

  // Create blocks covering the entire text
  let currentPos = 0;
  for (const range of validRanges) {
    // Add invalid block before this valid block
    if (currentPos < range.start) {
      blocks.push({
        start: currentPos,
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
    currentPos = range.end;
  }

  // Add remaining invalid block at the end
  if (currentPos < sql.length) {
    blocks.push({
      start: currentPos,
      end: sql.length,
      isValid: false,
    });
  }

  // If no valid blocks found, mark everything as invalid
  if (blocks.length === 0) {
    blocks.push({
      start: 0,
      end: sql.length,
      isValid: false,
    });
  }

  return blocks;
}
