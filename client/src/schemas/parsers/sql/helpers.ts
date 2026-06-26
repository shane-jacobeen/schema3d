import type { Table, Column } from "@/shared/types/schema";
import { REGEX } from "./regex";
import type { ParsedTable } from "./types";

/**
 * Clean SQL by removing GO statements and comments
 */
export function cleanSql(sql: string): string {
  return sql
    .replace(REGEX.GO_STATEMENT, "") // Remove GO statements
    .replace(REGEX.SINGLE_LINE_COMMENT, "") // Remove single-line comments
    .replace(REGEX.MULTI_LINE_COMMENT, ""); // Remove multi-line comments
}

/**
 * Find the matching closing parenthesis for an opening parenthesis
 * @param text - The text to search in
 * @param startIndex - Index of the opening parenthesis
 * @returns Index of the matching closing parenthesis, or -1 if not found
 */
export function findMatchingParen(text: string, startIndex: number): number {
  let depth = 1;
  let i = startIndex + 1;

  while (i < text.length && depth > 0) {
    if (text[i] === "(") {
      depth++;
    } else if (text[i] === ")") {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
    i++;
  }

  return -1; // Not found
}

/**
 * Extract identifier from brackets/quotes or return as-is
 * Handles: [identifier], `identifier`, "identifier", or plain identifier
 */
export function extractIdentifier(id: string): string {
  if (!id) return id;
  const trimmed = id.trim();

  // Remove brackets
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1);
  }

  // Remove quotes/backticks
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith("`") && trimmed.endsWith("`"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/**
 * Normalize data type: remove brackets, convert to uppercase, add precision if present
 */
export function normalizeDataType(type: string, precision?: string): string {
  let normalized = type.trim();

  // Remove brackets from data type if present
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    normalized = normalized.slice(1, -1);
  }

  normalized = normalized.toUpperCase();

  // Add precision/scale if present
  if (precision) {
    normalized += `(${precision})`;
  }

  return normalized;
}

/**
 * Resolve table name from alias map or find in tables array
 */
export function resolveTableName(
  tableOrAlias: string,
  aliasMap: Map<string, string>,
  tables?: ParsedTable[]
): string {
  // First try alias map
  const resolved = aliasMap.get(tableOrAlias.toLowerCase());

  if (resolved) return resolved;

  // Try direct table lookup
  if (tables) {
    const found = findTableByName(tables, tableOrAlias);
    if (found) return found.name;
  }

  // Check if any alias maps to this name
  for (const mappedTable of Array.from(aliasMap.values())) {
    if (mappedTable.toLowerCase() === tableOrAlias.toLowerCase()) {
      return mappedTable;
    }
  }

  // Fallback to original value
  return tableOrAlias;
}

/**
 * Find a column in a table by name (case-insensitive)
 */
export function findColumnByName(
  columns: ParsedTable["columns"],
  name: string
): ParsedTable["columns"][number] | undefined {
  return columns.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

/**
 * Detect constraints in a column definition string
 */
export function detectColumnConstraints(columnDef: string): {
  isPrimaryKey: boolean;
  isUnique: boolean;
  isNullable?: boolean;
  references?: { table: string; column: string };
} {
  const isPrimaryKey =
    REGEX.PRIMARY_KEY.test(columnDef) || REGEX.IDENTITY.test(columnDef);
  const isUnique = REGEX.UNIQUE.test(columnDef);

  // Detect NULL/NOT NULL constraint
  // Default to nullable (true) unless explicitly marked as NOT NULL
  // Primary keys are implicitly NOT NULL, so we check that too
  let isNullable: boolean | undefined;

  // Check for NOT NULL first (more specific)
  if (REGEX.NOT_NULL.test(columnDef)) {
    isNullable = false; // NOT NULL explicitly specified
  } else if (isPrimaryKey) {
    // Primary keys are implicitly NOT NULL
    isNullable = false;
  } else {
    // Check for explicit NULL constraint (rare, but some databases allow it)
    // Only match if it's a standalone NULL word, not part of "NOT NULL"
    const nullMatch = columnDef.match(/\bNULL\b/i);
    if (nullMatch) {
      // Check if it's NOT NULL by looking at the context
      const beforeNull = columnDef.substring(0, nullMatch.index || 0);
      if (!beforeNull.match(/\bNOT\s+$/i)) {
        // Explicitly NULL (though this is rare, as NULL is usually the default)
        isNullable = true;
      }
    }
    // If neither NULL nor NOT NULL is specified, leave undefined (defaults to nullable in most SQL dialects)
  }

  let references: { table: string; column: string } | undefined;
  const referencesMatch = columnDef.match(REGEX.REFERENCES);
  if (referencesMatch) {
    references = {
      table: extractIdentifier(referencesMatch[2] || referencesMatch[1] || ""),
      column: extractIdentifier(referencesMatch[3] || ""),
    };
  }

  return { isPrimaryKey, isUnique, isNullable, references };
}

/**
 * Infer column type from SQL expression
 */
export function inferColumnType(expression: string): string {
  if (REGEX.AGGREGATE_FUNCTIONS.test(expression)) {
    return "INTEGER";
  }
  if (REGEX.DATE_TIME_TYPES.test(expression)) {
    return "TIMESTAMP";
  }
  if (REGEX.NUMERIC_TYPES.test(expression)) {
    return "DECIMAL";
  }
  return "TEXT"; // Default
}

/**
 * Extract column name from SELECT expression (handles AS aliases)
 */
export function extractColumnNameFromSelect(expression: string): string {
  const aliasMatch = expression.match(REGEX.AS_ALIAS);
  if (aliasMatch) {
    return extractIdentifier(aliasMatch[1]);
  }

  // Extract last identifier (column name)
  const parts = expression.trim().split(/\s+/);
  const lastPart = parts[parts.length - 1];
  return extractIdentifier(lastPart || expression);
}

/**
 * Extract table name from regex match (handles schema.table or just table)
 */
export function getTableNameFromMatch(match: RegExpMatchArray): string {
  return match[2] || match[1] || "";
}

/**
 * Extract table name from FROM/JOIN match (handles schema.table or just table)
 */
export function extractTableNameFromMatch(match: RegExpMatchArray): string {
  return extractIdentifier(match[2] || match[1] || "");
}

/**
 * Add table to alias map (normalizes name and adds self-reference)
 */
function addTableToAliasMap(
  aliasMap: Map<string, string>,
  tableName: string,
  alias?: string
): void {
  const normalizedTable = extractIdentifier(tableName);
  if (normalizedTable) {
    // Add self-reference
    if (!aliasMap.has(normalizedTable.toLowerCase())) {
      aliasMap.set(normalizedTable.toLowerCase(), normalizedTable);
    }
    // Add alias if provided
    if (alias) {
      aliasMap.set(alias.toLowerCase(), normalizedTable);
    }
  }
}

/**
 * Build alias map from FROM/JOIN clauses
 * Maps alias -> table name and table name -> table name (for self-reference)
 */
export function buildAliasMap(fromClause: string): Map<string, string> {
  const aliasMap = new Map<string, string>();

  // Match first table with alias: table [AS] alias or [schema].[table] [AS] alias
  const firstTableMatch = fromClause.match(REGEX.FIRST_TABLE_WITH_ALIAS);
  if (firstTableMatch) {
    const tableName = extractTableNameFromMatch(firstTableMatch);
    const alias = extractIdentifier(firstTableMatch[3] || "");
    addTableToAliasMap(aliasMap, tableName, alias);
  }

  // Match JOIN clauses with aliases: JOIN table [AS] alias
  let aliasMatch;
  const joinAliasRegex = new RegExp(
    REGEX.JOIN_WITH_ALIAS.source,
    REGEX.JOIN_WITH_ALIAS.flags
  );
  while ((aliasMatch = joinAliasRegex.exec(fromClause)) !== null) {
    const tableName = extractTableNameFromMatch(aliasMatch);
    const alias = extractIdentifier(aliasMatch[3] || "");
    addTableToAliasMap(aliasMap, tableName, alias);
  }

  // Add table names without aliases (table name is its own alias)
  // Match first table without alias
  const firstTableNoAliasMatch = fromClause.match(REGEX.FIRST_TABLE_NO_ALIAS);
  if (firstTableNoAliasMatch) {
    const tableName = extractTableNameFromMatch(firstTableNoAliasMatch);
    addTableToAliasMap(aliasMap, tableName);
  }

  // Match JOIN tables without aliases
  let tableMatchForAlias;
  const joinTableNoAliasRegex = new RegExp(
    REGEX.JOIN_NO_ALIAS.source,
    REGEX.JOIN_NO_ALIAS.flags
  );
  while (
    (tableMatchForAlias = joinTableNoAliasRegex.exec(fromClause)) !== null
  ) {
    const tableName = extractTableNameFromMatch(tableMatchForAlias);
    addTableToAliasMap(aliasMap, tableName);
  }

  return aliasMap;
}

/**
 * Find the end of an ALTER TABLE statement (handles parentheses and quotes)
 */
export function findAlterTableEnd(sql: string, startIndex: number): number {
  let endIndex = startIndex;
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

      // Check for next statement (only when not in parentheses)
      if (
        parenDepth === 0 &&
        REGEX.SQL_STATEMENT_START.test(sql.substring(endIndex))
      ) {
        break;
      }
    }

    endIndex++;
  }

  return endIndex;
}

/**
 * Find a table by name (case-insensitive)
 */
export function findTableByName(
  tables: ParsedTable[],
  name: string
): ParsedTable | undefined {
  return tables.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

/**
 * Find a table by name in Table array (case-insensitive)
 */
export function findTableInSchema(
  tables: Table[],
  name: string
): Table | undefined {
  return tables.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

/**
 * Find a primary key column in a table
 */
export function findPrimaryKeyColumn(table: Table): Column | undefined {
  return table.columns.find((c) => c.isPrimaryKey);
}
