import type { DatabaseSchema, Table } from "@/shared/types/schema";
import { extractTables } from "./sql/extract-tables";
import { extractViews, applyAlterTableStatements } from "./sql/extract-views";
import {
  convertParsedTableToTable,
  convertParsedViewToTable,
  addViewRelationships,
} from "./sql/convert";

export { identifyValidSqlBlocks } from "./sql/validate-blocks";
export { schemaToSql } from "./sql/generate";

/**
 * Parse SQL schema definitions (CREATE TABLE, ALTER TABLE, CREATE VIEW statements)
 * into a DatabaseSchema object for visualization.
 *
 * Supports:
 * - Standard SQL CREATE TABLE statements with column definitions
 * - Table-level FOREIGN KEY constraints
 * - ALTER TABLE statements to modify existing tables
 * - CREATE VIEW statements (parsed as special tables)
 * - T-SQL syntax: bracketed identifiers [table_name] and schema prefixes schema.table
 * - Column-level and table-level constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL)
 *
 * @param sql - SQL script containing CREATE TABLE, ALTER TABLE, and CREATE VIEW statements
 * @returns Parsed DatabaseSchema object with tables, columns, and relationships, or null if parsing fails
 *
 * @example
 * ```typescript
 * const sql = `
 *   CREATE TABLE users (
 *     id SERIAL PRIMARY KEY,
 *     username VARCHAR(50) UNIQUE
 *   );
 *   CREATE TABLE posts (
 *     id SERIAL PRIMARY KEY,
 *     user_id INTEGER REFERENCES users(id),
 *     title VARCHAR(200)
 *   );
 * `;
 * const schema = parseSqlSchema(sql);
 * ```
 */
export function parseSqlSchema(sql: string): DatabaseSchema | null {
  try {
    const tables = extractTables(sql);
    applyAlterTableStatements(sql, tables);
    const views = extractViews(sql, tables);

    if (tables.length === 0 && views.length === 0) {
      throw new Error("No valid CREATE TABLE or CREATE VIEW statements found");
    }

    const totalTables = tables.length + views.length;
    const categoryMap = new Map<string, string>();

    // Convert parsed tables to Table objects
    const schemaTablesList: Table[] = tables.map((table, index) =>
      convertParsedTableToTable(table, index, totalTables, categoryMap)
    );

    // Convert parsed views to Table objects
    const schemaViewsList: Table[] = views.map((view, index) =>
      convertParsedViewToTable(
        view,
        tables.length + index,
        totalTables,
        categoryMap,
        schemaTablesList
      )
    );

    // Add view-to-table relationships
    addViewRelationships(views, schemaViewsList, schemaTablesList);

    return {
      name: "Custom Database",
      format: "sql",
      tables: [...schemaTablesList, ...schemaViewsList],
    };
  } catch (_error) {
    return null;
  }
}
