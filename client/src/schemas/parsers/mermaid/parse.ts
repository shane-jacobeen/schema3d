import type { DatabaseSchema, Table, Column } from "@/shared/types/schema";
import type { Cardinality } from "@/shared/types/cardinality";
import { parseCardinality } from "@/shared/types/cardinality";
import {
  guessCategory,
  calculatePosition,
  getOrAssignCategoryColor,
} from "../parser-utils";
import { parseMermaidCardinality } from "./cardinality";
import type { ParsedTable } from "./types";

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
    // Process relationships and assign foreign keys
    // The FK should be in the table on the "many" side, pointing to the table on the "one" side
    relationships.forEach((rel) => {
      const fromTable = tables.get(rel.from);
      const toTable = tables.get(rel.to);

      if (!fromTable || !toTable) return;

      // Determine which table should have the FK based on cardinality
      // Parse cardinality to see which side is "many"
      const {
        left: mermaidLeft,
        right: mermaidRight,
        leftIsMany: _leftIsMany,
        rightIsMany,
      } = parseCardinality(rel.cardinality);

      // The FK goes in the table on the "many" side
      // If right is many, FK is in toTable; if left is many, FK is in fromTable
      const fkTable = rightIsMany ? toTable : fromTable;
      const referencedTable = rightIsMany ? fromTable : toTable;
      const referencedTableName = rightIsMany ? rel.from : rel.to;

      // Normalize cardinality to our internal format convention:
      // - left = referenced table side (the "1" side)
      // - right = FK table side (the "many" side)
      //
      // Mermaid syntax can have FK on either side, so we need to normalize:
      // - If FK is on right side of Mermaid (toTable), cardinality is already correct
      // - If FK is on left side of Mermaid (fromTable), we need to swap left/right
      let normalizedCardinality: Cardinality;
      if (rightIsMany) {
        // FK is in toTable (right side of Mermaid), cardinality is already correct
        // mermaidLeft = referenced table, mermaidRight = FK table
        normalizedCardinality = rel.cardinality;
      } else {
        // FK is in fromTable (left side of Mermaid), need to swap
        // mermaidLeft = FK table, mermaidRight = referenced table
        // Swap to: left = referenced, right = FK
        normalizedCardinality = `${mermaidRight}:${mermaidLeft}` as Cardinality;
      }

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

      // Mark as foreign key and add reference with normalized cardinality
      // Ensure we set both isForeignKey and references
      fkColumn.isForeignKey = true;
      if (!fkColumn.references) {
        fkColumn.references = {
          table: referencedTableName,
          column: pkColumn.name,
          cardinality: normalizedCardinality,
        };
      } else {
        // Update existing references if needed
        fkColumn.references.table = referencedTableName;
        fkColumn.references.column = pkColumn.name;
        fkColumn.references.cardinality = normalizedCardinality;
      }
    });

    // Convert to DatabaseSchema format
    const categoryMap = new Map<string, string>();
    const tableList = Array.from(tables.values());
    const schemaTables: Table[] = tableList.map((table, index) => {
      const category = guessCategory(table.name);
      const color = getOrAssignCategoryColor(categoryMap, category);
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
