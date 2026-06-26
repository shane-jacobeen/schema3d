import { REGEX } from "./regex";
import {
  extractIdentifier,
  normalizeDataType,
  detectColumnConstraints,
  findColumnByName,
} from "./helpers";
import type { ParsedTable } from "./types";

/**
 * Parse column definitions from a columns part string
 */
export function parseColumns(columnsPart: string) {
  const columns: ParsedTable["columns"] = [];
  // Split by comma, but be careful with nested parentheses (for T-SQL functions/expressions)
  const lines = splitColumnDefinitions(columnsPart);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Skip constraint definitions, indexes, etc.
    if (
      trimmedLine.toUpperCase().startsWith("PRIMARY KEY") ||
      trimmedLine.toUpperCase().startsWith("FOREIGN KEY") ||
      trimmedLine.toUpperCase().startsWith("CONSTRAINT") ||
      trimmedLine.toUpperCase().startsWith("UNIQUE") ||
      trimmedLine.toUpperCase().startsWith("CHECK") ||
      trimmedLine.toUpperCase().startsWith("INDEX") ||
      trimmedLine.toUpperCase().startsWith("KEY")
    ) {
      continue;
    }

    // Handle T-SQL square brackets and standard SQL quotes/backticks
    // Match: [column_name] or `column_name` or "column_name" or column_name
    // Followed by data type (including T-SQL types like NVARCHAR, DATETIME2, etc.)
    // Data type may be bracketed: [nvarchar](50) or plain: NVARCHAR(50)
    // May include IDENTITY, NULL/NOT NULL, DEFAULT, etc.
    const columnMatch = trimmedLine.match(REGEX.COLUMN_DEF);
    if (!columnMatch) continue;

    const columnName = extractIdentifier(columnMatch[1]);
    const columnType = normalizeDataType(columnMatch[2], columnMatch[3]);

    const constraints = detectColumnConstraints(trimmedLine);

    columns.push({
      name: columnName,
      type: columnType,
      ...constraints,
    });
  }

  return columns;
}

/**
 * Parse table-level FOREIGN KEY constraints and apply them to columns
 * Format: FOREIGN KEY (column_name) REFERENCES table_name(column_name)
 * Supports: FOREIGN KEY ([column_name]) REFERENCES [table_name]([column_name])
 */
export function parseTableLevelForeignKeys(
  columnsPart: string,
  columns: ParsedTable["columns"]
): void {
  // Match table-level FOREIGN KEY constraints
  // Format: FOREIGN KEY (column) REFERENCES table(column)
  // Supports bracketed identifiers: FOREIGN KEY ([column]) REFERENCES [table]([column])
  const fkRegex = new RegExp(REGEX.TABLE_FK.source, REGEX.TABLE_FK.flags);

  let match;
  while ((match = fkRegex.exec(columnsPart)) !== null) {
    const fkColumnName = extractIdentifier(match[1]);
    const parentTableName = extractIdentifier(match[3] || match[2]);
    const parentColumnName = extractIdentifier(match[4]);

    if (fkColumnName && parentTableName && parentColumnName) {
      const column = findColumnByName(columns, fkColumnName);
      if (column) {
        column.references = {
          table: extractIdentifier(parentTableName),
          column: extractIdentifier(parentColumnName),
        };
      }
    }
  }
}

// Helper function to split column definitions while respecting nested parentheses
/**
 * Split column definitions by comma, respecting nested parentheses
 */
function splitColumnDefinitions(columnsPart: string): string[] {
  const lines: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < columnsPart.length; i++) {
    const char = columnsPart[i];

    if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      if (current.trim()) {
        lines.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    lines.push(current.trim());
  }

  return lines;
}
