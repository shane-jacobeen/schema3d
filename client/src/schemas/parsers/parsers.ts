import type { DatabaseSchema } from "@/shared/types/schema";
import { parseSqlSchema, identifyValidSqlBlocks } from "./sql-parser";
import {
  parseMermaidSchema,
  identifyValidMermaidBlocks,
} from "./mermaid-parser";
import { parseDrawdbSchema } from "./drawdb/drawdb-to-schema";
import { tryParseDrawdbJson } from "./drawdb/detect";

export type SchemaFormat = "sql" | "mermaid" | "drawdb";

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
 * Provides a consistent API for parsing SQL, Mermaid ER diagrams, and DrawDB JSON.
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
  drawdb: {
    parse: parseDrawdbSchema,
    identifyBlocks: (_text: string): ValidationBlock[] => {
      // DrawDB JSON is validated as a whole document, not block ranges
      return [];
    },
  },
} as const;

/**
 * Parse schema text in the specified format.
 * If format is not provided, auto-detects DrawDB JSON, then SQL, then Mermaid.
 */
export function parseSchema(
  text: string,
  format?: SchemaFormat
): DatabaseSchema | null {
  if (format) {
    return parsers[format].parse(text);
  }

  // Prefer DrawDB when the payload is clearly JSON diagram-shaped
  if (tryParseDrawdbJson(text)) {
    const drawdbResult = parsers.drawdb.parse(text);
    if (drawdbResult && drawdbResult.tables.length > 0) {
      return drawdbResult;
    }
  }

  const sqlResult = parsers.sql.parse(text);
  if (sqlResult && sqlResult.tables.length > 0) {
    return sqlResult;
  }

  const mermaidResult = parsers.mermaid.parse(text);
  if (mermaidResult && mermaidResult.tables.length > 0) {
    return mermaidResult;
  }

  return sqlResult || mermaidResult;
}

/**
 * Identify valid syntax blocks for live syntax highlighting in the editor.
 * DrawDB JSON has no block ranges; falls back to SQL/Mermaid heuristics.
 */
export function identifyValidBlocks(
  text: string,
  format?: SchemaFormat
): ValidationBlock[] {
  if (format === "drawdb") {
    return parsers.drawdb.identifyBlocks(text);
  }

  if (format) {
    return parsers[format].identifyBlocks(text);
  }

  if (tryParseDrawdbJson(text)) {
    return [];
  }

  const sqlBlocks = parsers.sql.identifyBlocks(text);
  const mermaidBlocks = parsers.mermaid.identifyBlocks(text);

  const sqlValidCount = sqlBlocks.filter((b) => b.isValid).length;
  const mermaidValidCount = mermaidBlocks.filter((b) => b.isValid).length;

  return mermaidValidCount > sqlValidCount ? mermaidBlocks : sqlBlocks;
}

/**
 * Validate and parse schema text, returning both the parsed schema and validation status.
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
