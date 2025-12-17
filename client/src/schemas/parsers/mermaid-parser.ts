import type { DatabaseSchema, Table, Column } from "@/shared/types/schema";
import type { Cardinality } from "@/visualizer/3d/types";
import { parseCardinality } from "@/visualizer/3d/components/relationships/relationship-utils";
import {
  COLOR_PALETTE,
  guessCategory,
  calculatePosition,
} from "./parser-utils";

/**
 * Parse Mermaid ER diagram syntax into a DatabaseSchema object for visualization.
 *
 * Supports the Mermaid ER diagram format with:
 * - Entity definitions with column specifications
 * - Relationship syntax with cardinality notation
 * - Column constraints: PK (Primary Key), FK (Foreign Key), UK (Unique)
 * - Multiple constraints per column (e.g., "PK, FK")
 * - Tables defined by relationships even without explicit column blocks
 *
 * Cardinality notation mapping:
 * - `||` = one (required) → "1"
 * - `o` = zero or one (optional) → "0..1"
 * - `{` = many (zero or more) → "0..N"
 * - `|{` = one or many → "1..N"
 * - `}` = many (one or more) → "1..N"
 *
 * @param mermaid - Mermaid ER diagram text starting with "erDiagram"
 * @returns Parsed DatabaseSchema object with tables, columns, and relationships, or null if parsing fails
 *
 * @example
 * ```typescript
 * const mermaid = `
 *   erDiagram
 *       USER ||--o{ POST : creates
 *       USER {
 *           int id PK
 *           string username
 *       }
 *       POST {
 *           int id PK
 *           int user_id FK
 *           string title
 *       }
 * `;
 * const schema = parseMermaidSchema(mermaid);
 * ```
 */
export function parseMermaidSchema(mermaid: string): DatabaseSchema | null {
  try {
    const lines = mermaid.split("\n").map((line) => line.trim());

    // Find the erDiagram line
    const erDiagramIndex = lines.findIndex((line) =>
      line.toLowerCase().startsWith("erdiagram")
    );

    if (erDiagramIndex === -1) {
      return null; // Not a Mermaid ER diagram
    }

    const tables = new Map<string, ParsedTable>();
    const relationships: Array<{
      from: string;
      to: string;
      rawCardinality: string;
      cardinality: Cardinality;
    }> = [];

    // Parse table definitions and relationships
    for (let i = erDiagramIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Check if it's a relationship line: TABLE1 ||--o{ TABLE2 : label
      // Examples: "CUSTOMER ||--o{ ORDER : places", "ORDER ||--|{ LINE-ITEM : contains"
      // The relationship syntax is: TABLE1 [cardinality] TABLE2 [: label]
      // Regex breakdown:
      // - Group 1: table name (starts with letter/underscore, alphanumeric/dash/underscore)
      // - Group 2: cardinality symbols (|, o, -, {, })
      // - Group 3: referenced table name
      // - Group 4 (optional): relationship label after colon
      const relationshipMatch = line.match(
        /^([A-Za-z_][A-Za-z0-9_-]*)\s+([|o\-{}-]+)\s+([A-Za-z_][A-Za-z0-9_-]*)\s*(?::\s*(.*))?$/
      );
      if (relationshipMatch) {
        const [, fromTable, rawCardinality, toTable] = relationshipMatch;

        const parsedCardinality = parseMermaidCardinality(rawCardinality);

        relationships.push({
          from: fromTable,
          to: toTable,
          rawCardinality,
          cardinality: parsedCardinality,
        });
        // Ensure both tables exist in our map
        if (!tables.has(fromTable)) {
          tables.set(fromTable, { name: fromTable, columns: [] });
        }
        if (!tables.has(toTable)) {
          tables.set(toTable, { name: toTable, columns: [] });
        }
        continue;
      }

      // Check if it's a table definition: TABLE {
      // Examples: "CUSTOMER {", "ORDER {"
      const tableDefMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*\{/);
      if (tableDefMatch) {
        const tableName = tableDefMatch[1];
        const columns: Array<{
          name: string;
          type: string;
          isPrimaryKey: boolean;
          isUnique?: boolean;
          isForeignKey?: boolean;
        }> = [];

        // Parse columns until we find the closing brace
        i++; // Move to next line after table name
        while (i < lines.length) {
          const colLine = lines[i];
          if (colLine === "}") break;

          // Parse column: type name [PK] [UK] [FK] or combinations like "PK, FK"
          // Examples: "string name PK", "int id PK", "varchar email", "VARCHAR(255) email"
          // Also supports: "int order_id FK" or "int faculty_id PK, FK" for multiple constraints
          // Regex breakdown:
          // - Group 1: column type (word chars, optionally with size like VARCHAR(255))
          // - Group 2: column name (starts with letter/underscore, alphanumeric/dash/underscore)
          // - Group 3 (optional): constraint string (PK, FK, UK, or combinations)
          const colMatch = colLine.match(
            /^(\w+(?:\([^)]+\))?)\s+([A-Za-z_][A-Za-z0-9_-]*)(?:\s+(.+))?$/i
          );
          if (colMatch) {
            const [, type, name, constraintStr] = colMatch;
            const constraints = constraintStr
              ? constraintStr
                  .toUpperCase()
                  .split(/[,\s]+/)
                  .filter((c) => c === "PK" || c === "UK" || c === "FK")
              : [];
            columns.push({
              name,
              type: type.toUpperCase().replace(/\([^)]+\)/g, ""), // Remove size constraints like (255)
              isPrimaryKey: constraints.includes("PK"),
              isUnique: constraints.includes("UK"),
              isForeignKey: constraints.includes("FK"),
            });
          }
          i++;
        }

        // Always set the table, even if it has no columns (might be defined by relationships only)
        tables.set(tableName, { name: tableName, columns });
        continue;
      }
    }

    if (tables.size === 0) {
      return null; // No tables found
    }

    // Process relationships to add foreign key references
    // For each relationship, we need to determine which column is the FK
    // In Mermaid: USER ||--o{ POST means USER (one) to POST (many)
    // The FK should be in POST (the "many" side"), pointing to USER (the "one" side)
    relationships.forEach((rel) => {
      const fromTable = tables.get(rel.from);
      const toTable = tables.get(rel.to);

      if (!fromTable || !toTable) return;

      // Determine which table should have the FK based on cardinality
      // Parse cardinality to see which side is "many"
      const {
        left: _left,
        right: _right,
        leftIsMany: _leftIsMany,
        rightIsMany,
      } = parseCardinality(rel.cardinality);

      // The FK goes in the table on the "many" side
      // If right is many, FK is in toTable; if left is many, FK is in fromTable
      const fkTable = rightIsMany ? toTable : fromTable;
      const referencedTable = rightIsMany ? fromTable : toTable;
      const referencedTableName = rightIsMany ? rel.from : rel.to;

      // Find PK in the referenced table
      const pkColumn = referencedTable.columns.find((col) => col.isPrimaryKey);
      if (!pkColumn) return;

      // Try to find existing FK column that matches the pattern
      // Common patterns: referencedTableName_id, referencedTableNameId, or already marked as FK
      const fkColumnName = `${referencedTableName.toLowerCase()}_id`;
      const referencedTableNameLower = referencedTableName.toLowerCase();

      // First, try to find a column that's already marked as FK and matches the pattern
      // This handles the case where the column definition explicitly marks it as FK
      let fkColumn = fkTable.columns.find((col) => {
        if (!col.isForeignKey) return false;
        const colNameLower = col.name.toLowerCase();
        // Match exact pattern (most common: table_id)
        if (colNameLower === fkColumnName) return true;
        // Match alternative pattern (tableId)
        if (colNameLower === `${referencedTableNameLower}id`) return true;
        // Match if column name contains referenced table name
        if (colNameLower.includes(referencedTableNameLower)) return true;
        return false;
      });

      // If not found, try to find by name pattern (even if not marked as FK)
      if (!fkColumn) {
        fkColumn = fkTable.columns.find((col) => {
          const colNameLower = col.name.toLowerCase();
          // Match exact pattern first (most common: table_id)
          if (colNameLower === fkColumnName) return true;
          // Match alternative pattern (tableId)
          if (colNameLower === `${referencedTableNameLower}id`) return true;
          // Match if column name is the same as PK name (less common)
          if (colNameLower === pkColumn.name.toLowerCase()) return true;
          return false;
        });
      }

      if (!fkColumn) {
        // Create a new FK column
        fkColumn = {
          name: fkColumnName,
          type: pkColumn.type,
          isPrimaryKey: false,
          isForeignKey: true,
        };
        fkTable.columns.push(fkColumn);
      }

      // Mark as foreign key and add reference with cardinality
      // Ensure we set both isForeignKey and references
      fkColumn.isForeignKey = true;
      if (!fkColumn.references) {
        fkColumn.references = {
          table: referencedTableName,
          column: pkColumn.name,
          cardinality: rel.cardinality,
        };
      } else {
        // Update existing references if needed
        fkColumn.references.table = referencedTableName;
        fkColumn.references.column = pkColumn.name;
        fkColumn.references.cardinality = rel.cardinality;
      }
    });

    // Convert to DatabaseSchema format
    const categoryMap = new Map<string, string>();
    const tableList = Array.from(tables.values());
    const schemaTables: Table[] = tableList.map((table, index) => {
      const category = guessCategory(table.name);

      if (!categoryMap.has(category)) {
        categoryMap.set(
          category,
          COLOR_PALETTE[categoryMap.size % COLOR_PALETTE.length]
        );
      }

      const color = categoryMap.get(category)!;
      const position = calculatePosition(index, tableList.length);

      const columns: Column[] = table.columns.map((col) => {
        // Ensure references object is properly typed
        const references = col.references
          ? {
              table: col.references.table,
              column: col.references.column,
              cardinality: col.references.cardinality,
            }
          : undefined;

        return {
          name: col.name,
          type: col.type,
          isPrimaryKey: col.isPrimaryKey,
          isUnique: col.isUnique,
          isForeignKey: col.isForeignKey || !!col.references,
          references,
        };
      });

      return {
        name: table.name,
        columns,
        position,
        color,
        category,
      };
    });

    return {
      name: "Custom Database",
      format: "mermaid",
      tables: schemaTables,
    };
  } catch (_error) {
    return null;
  }
}

interface ParsedTable {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isUnique?: boolean;
    isForeignKey?: boolean;
    references?: { table: string; column: string; cardinality?: string };
  }>;
}

/**
 * Parse a Mermaid cardinality segment (e.g. "||--o{", "}o--||")
 * into a textual cardinality representation like "1:N", "0..1:1..N", "0..N:1".
 *
 * Mermaid ER syntax uses these symbols:
 * - "|"  : exactly one
 * - "o"  : zero or one
 * - "{"  : zero or many
 * - "}"  : one or many
 *
 * We map them into our shared CardinalitySymbol set:
 * - "1"     : exactly one
 * - "0..1"  : zero or one
 * - "0..N"  : zero or many
 * - "1..N"  : one or many
 */
function parseMermaidCardinality(segment: string): Cardinality {
  const [left, right] = segment.split("--");

  const mapSide = (side: string | undefined): string => {
    if (!side) return "0..N";

    // Check for "many" symbols first (they take precedence)
    const hasOpenBrace = side.includes("{");
    const hasCloseBrace = side.includes("}");
    const hasOptional = side.includes("o");
    const hasOne = side.includes("|");

    // Handle "many" cases
    if (hasOpenBrace || hasCloseBrace) {
      // If it has both | and {/}, it means "one or many" (1..N)
      // If it has o and {, it means "zero or many" (0..N)
      // If it has just }, it means "one or many" (1..N)
      // If it has just {, it means "zero or many" (0..N)
      if (hasCloseBrace) {
        return "1..N"; // } always means one-or-many
      } else if (hasOpenBrace) {
        // { can be zero-or-many (0..N) or one-or-many (1..N) depending on context
        // If there's a | before it, it's one-or-many (1..N)
        // Otherwise it's zero-or-many (0..N)
        return hasOne ? "1..N" : "0..N";
      }
    }

    // Handle "one" cases (no many symbols)
    if (hasOptional && hasOne) {
      // Both o and | - this is ambiguous, but typically means zero-or-one
      return "0..1";
    } else if (hasOptional) {
      // Just o - zero or one
      return "0..1";
    } else if (hasOne) {
      // Just | - exactly one
      return "1";
    }

    // Fallback to many if we can't interpret the token
    return "0..N";
  };

  const leftSymbol = mapSide(left);
  const rightSymbol = mapSide(right);

  return `${leftSymbol}:${rightSymbol}` as Cardinality;
}

/**
 * Detect if text is Mermaid format
 */
export function detectMermaidFormat(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.toLowerCase().startsWith("erdiagram");
}

/**
 * Detect if text is SQL format
 */
export function detectSqlFormat(text: string): boolean {
  const trimmed = text.trim().toUpperCase();
  return (
    trimmed.includes("CREATE TABLE") ||
    trimmed.includes("CREATE VIEW") ||
    trimmed.includes("ALTER TABLE")
  );
}

/**
 * Auto-detect format and return 'sql', 'mermaid', or null
 */
export function detectFormat(text: string): "sql" | "mermaid" | null {
  if (!text.trim()) return null;

  if (detectMermaidFormat(text)) {
    return "mermaid";
  }

  if (detectSqlFormat(text)) {
    return "sql";
  }

  return null; // Unknown format
}

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
