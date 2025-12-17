import type { DatabaseSchema } from "@/shared/types/schema";
import { parseSqlSchema, identifyValidSqlBlocks } from "./sql-parser";
import {
  parseMermaidSchema,
  identifyValidMermaidBlocks,
} from "./mermaid-parser";

export type SchemaFormat = "sql" | "mermaid";

export interface ParserResult {
  schema: DatabaseSchema | null;
  isValid: boolean;
}

export interface ValidationBlock {
  start: number;
  end: number;
  isValid: boolean;
}

/**
 * Unified parser interface for all schema formats.
 * Provides a consistent API for parsing SQL and Mermaid ER diagrams.
 */
export const parsers = {
  sql: {
    parse: parseSqlSchema,
    identifyBlocks: identifyValidSqlBlocks,
  },
  mermaid: {
    parse: parseMermaidSchema,
    identifyBlocks: identifyValidMermaidBlocks,
  },
} as const;

/**
 * Parse schema text in the specified format.
 * If format is not provided, auto-detects by trying both SQL and Mermaid parsers.
 *
 * @param text - The schema text to parse (SQL CREATE TABLE statements or Mermaid ER diagram)
 * @param format - Optional format specification ("sql" or "mermaid"). If omitted, auto-detects.
 * @returns Parsed DatabaseSchema object, or null if parsing fails
 *
 * @example
 * ```typescript
 * // Parse SQL
 * const schema = parseSchema("CREATE TABLE users (id INT PRIMARY KEY);", "sql");
 *
 * // Auto-detect format
 * const schema = parseSchema(sqlText);
 * ```
 */
export function parseSchema(
  text: string,
  format?: SchemaFormat
): DatabaseSchema | null {
  if (format) {
    return parsers[format].parse(text);
  }

  // Auto-detect format by trying both parsers
  // Try SQL first (more common), then Mermaid
  const sqlResult = parsers.sql.parse(text);
  if (sqlResult && sqlResult.tables.length > 0) {
    return sqlResult;
  }

  const mermaidResult = parsers.mermaid.parse(text);
  if (mermaidResult && mermaidResult.tables.length > 0) {
    return mermaidResult;
  }

  // If neither worked, return the first non-null result (might have tables but empty)
  return sqlResult || mermaidResult;
}

/**
 * Identify valid syntax blocks for live syntax highlighting in the editor.
 * Returns an array of text ranges with their validation status.
 * If format is not provided, tries both SQL and Mermaid and uses the one with more valid blocks.
 *
 * @param text - The schema text to analyze
 * @param format - Optional format specification. If omitted, auto-detects by comparing valid block counts.
 * @returns Array of validation blocks with start/end positions and isValid flag
 *
 * @example
 * ```typescript
 * const blocks = identifyValidBlocks("CREATE TABLE users (id INT);", "sql");
 * // Returns: [{ start: 0, end: 35, isValid: true }]
 * ```
 */
export function identifyValidBlocks(
  text: string,
  format?: SchemaFormat
): ValidationBlock[] {
  if (format) {
    return parsers[format].identifyBlocks(text);
  }

  // Try both formats and use the one with more valid blocks
  const sqlBlocks = parsers.sql.identifyBlocks(text);
  const mermaidBlocks = parsers.mermaid.identifyBlocks(text);

  const sqlValidCount = sqlBlocks.filter((b) => b.isValid).length;
  const mermaidValidCount = mermaidBlocks.filter((b) => b.isValid).length;

  return mermaidValidCount > sqlValidCount ? mermaidBlocks : sqlBlocks;
}

/**
 * Validate and parse schema text, returning both the parsed schema and validation status.
 * If format is not provided, auto-detects by trying both parsers.
 *
 * @param text - The schema text to validate and parse
 * @param format - Optional format specification. If omitted, auto-detects.
 * @returns ParserResult object containing the parsed schema (or null) and isValid flag
 *
 * @example
 * ```typescript
 * const result = validateAndParse("CREATE TABLE users (id INT PRIMARY KEY);");
 * if (result.isValid) {
 *   console.log("Schema is valid:", result.schema);
 * }
 * ```
 */
export function validateAndParse(
  text: string,
  format?: SchemaFormat
): ParserResult {
  const schema = parseSchema(text, format);
  return {
    schema,
    isValid: schema !== null && (schema.tables?.length ?? 0) > 0,
  };
}
