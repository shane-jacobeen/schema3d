/**
 * SQL Parser - Modularized Structure
 *
 * This file is organized into logical sections:
 * 1. Type Definitions - Interfaces for parsed structures
 * 2. Regex Patterns - Shared SQL pattern matching
 * 3. Utility Functions - Reusable helpers (cleanSql, findMatchingParen, etc.)
 * 4. Table Extraction - CREATE TABLE parsing
 * 5. View Extraction - CREATE VIEW parsing
 * 6. Alter Table Processing - ALTER TABLE statement handling
 * 7. Column Parsing - Column definition parsing
 * 8. SQL Block Identification - Valid SQL block detection
 * 9. SQL Generation - Schema to SQL conversion
 *
 * All code remains in this single file for easier maintenance and navigation.
 */

import type { DatabaseSchema, Table, Column } from "@/shared/types/schema";
import {
  COLOR_PALETTE,
  guessCategory,
  calculatePosition,
} from "./parser-utils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ParsedTable {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isUnique?: boolean; // True if column has UNIQUE constraint
    references?: { table: string; column: string };
  }>;
}

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
// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parse SQL schema definitions (CREATE TABLE, ALTER TABLE, CREATE VIEW statements)
 * into a DatabaseSchema object for visualization.
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

// ============================================================================
// REGEX PATTERN LIBRARY
// ============================================================================
// Centralized regex patterns for SQL parsing
// Supports T-SQL syntax with bracketed identifiers [table_name] and schema prefixes schema.table

/**
 * Identifier patterns - handles [schema].[table], [table], "table", `table`, or plain table
 */
const REGEX = {
  // Base identifier pattern: optional schema.table or just table
  // Group 1: optional schema, Group 2: table name
  SCHEMA_TABLE: /(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?/i,

  // Bracketed identifier with optional schema: [schema].[table] or [table]
  BRACKETED_IDENTIFIER: /\[?(\w+)\]?\.\[?([\w]+)\]?/i,

  // Full bracketed identifier pattern (supports spaces in names): [Order Details]
  FULL_BRACKETED: /(\[[^\]]+\]|[\w]+)/g,

  // Simple word identifier
  WORD: /^\w+$/i,

  // SQL Statement patterns
  SQL_STATEMENT_START:
    /^\s*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT)\s+/i,

  // CREATE TABLE: CREATE TABLE [schema].[table] (
  CREATE_TABLE:
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?[`"]?\s*\(/gi,

  // ALTER TABLE ADD: ALTER TABLE [schema].[table] ADD [COLUMN] ...
  ALTER_TABLE_ADD:
    /ALTER\s+TABLE\s+(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?[`"]?\s+ADD\s+(?:COLUMN\s+)?/gi,

  // ALTER TABLE ADD CONSTRAINT UNIQUE
  ALTER_TABLE_UNIQUE:
    /ALTER\s+TABLE\s+(?:(\[[^\]]+\]|[\w]+)\.)?(\[[^\]]+\]|[\w]+)\s+ADD\s+CONSTRAINT\s+(\[[^\]]+\]|[\w]+)\s+UNIQUE\s*\((\[[^\]]+\]|[\w]+)\)/gi,

  // ALTER TABLE ADD CONSTRAINT FOREIGN KEY
  ALTER_TABLE_FK:
    /ALTER\s+TABLE\s+(?:(\[[^\]]+\]|[\w]+)\.)?(\[[^\]]+\]|[\w]+)\s+(?:WITH\s+(?:NO)?CHECK\s+)?ADD\s+CONSTRAINT\s+(\[[^\]]+\]|[\w]+)\s+FOREIGN\s+KEY\s*\((\[[^\]]+\]|[\w]+)\)\s+REFERENCES\s+(?:(\[[^\]]+\]|[\w]+)\.)?(\[[^\]]+\]|[\w]+)\s*\((\[[^\]]+\]|[\w]+)\)/gi,

  // CREATE VIEW: CREATE [OR REPLACE] VIEW [schema].[view] [AS] ...
  CREATE_VIEW:
    /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?[`"]?\s*(?:AS\s+)?/gi,

  // SELECT ... FROM ... (with optional WHERE/ORDER BY)
  SELECT_FROM:
    /SELECT\s+([\s\S]*?)\s+FROM\s+([\s\S]*?)(?:\s+WHERE|\s+ORDER\s+BY|;|$)/i,

  // FROM/JOIN table extraction
  FROM_JOIN_TABLE: /\b(?:FROM|JOIN)\s+(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?/gi,

  // First table in FROM clause (with optional alias)
  FIRST_TABLE_WITH_ALIAS:
    /^(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?\s+(?:AS\s+)?(\w+)(?:\s|$)/i,

  // First table in FROM clause (without alias)
  FIRST_TABLE_NO_ALIAS:
    /^(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?(?:\s+JOIN|\s+WHERE|\s+ORDER|\s*$)/i,

  // JOIN with alias: JOIN table [AS] alias
  JOIN_WITH_ALIAS:
    /\bJOIN\s+(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?\s+(?:AS\s+)?(\w+)/gi,

  // JOIN without alias: JOIN table ON ...
  JOIN_NO_ALIAS:
    /\bJOIN\s+(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?(?:\s+ON|\s+WHERE|\s+ORDER|\s*$)/gi,

  // Column reference: table.column or schema.table.column
  COLUMN_REF: /(?:\[?(\w+)\]?\.)?\[?(\w+)\]?\.\[?(\w+)\]?/i,

  // Column definition: [column] TYPE or column TYPE
  COLUMN_DEF:
    /^[`"[\]]?(\w+)[`"[\]]?\s+(\[[^\]]+\]|[A-Z]+)(?:\s*\(([^)]+)\))?/i,

  // AS alias: ... AS alias
  AS_ALIAS: /\bAS\s+(\w+)$/i,

  // Constraint patterns
  PRIMARY_KEY: /PRIMARY\s+KEY/i,
  IDENTITY: /\bIDENTITY\b/i,
  UNIQUE: /\bUNIQUE\b/i,
  FOREIGN_KEY: /FOREIGN\s+KEY/i,

  // REFERENCES: REFERENCES [schema].[table]([column])
  REFERENCES:
    /REFERENCES\s+(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?\s*\(\[?([\w]+)\]?\)/i,

  // Table-level FOREIGN KEY: FOREIGN KEY (column) REFERENCES table(column)
  TABLE_FK:
    /FOREIGN\s+KEY\s*\(\[?([\w]+)\]?\)\s+REFERENCES\s+(?:\[?(\w+)\]?\.)?\[?([\w]+)\]?\s*\(\[?([\w]+)\]?\)/gi,

  // Data type inference patterns
  AGGREGATE_FUNCTIONS: /COUNT|SUM|AVG|MAX|MIN/i,
  DATE_TIME_TYPES: /DATE|TIME|TIMESTAMP/i,
  NUMERIC_TYPES: /DECIMAL|NUMERIC|FLOAT|DOUBLE/i,

  // Cleanup patterns
  GO_STATEMENT: /^\s*GO\s*$/gim,
  SINGLE_LINE_COMMENT: /--.*$/gm,
  MULTI_LINE_COMMENT: /\/\*[\s\S]*?\*\//g,

  // Column name pattern (for view relationships)
  COLUMN_NAME_PATTERN: /(\w+)_name/i,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clean SQL by removing GO statements and comments
 */
function cleanSql(sql: string): string {
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
function findMatchingParen(text: string, startIndex: number): number {
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
function extractIdentifier(id: string): string {
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
function normalizeDataType(type: string, precision?: string): string {
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
function resolveTableName(
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
function findColumnByName(
  columns: ParsedTable["columns"],
  name: string
): ParsedTable["columns"][number] | undefined {
  return columns.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

/**
 * Detect constraints in a column definition string
 */
function detectColumnConstraints(columnDef: string): {
  isPrimaryKey: boolean;
  isUnique: boolean;
  references?: { table: string; column: string };
} {
  const isPrimaryKey =
    REGEX.PRIMARY_KEY.test(columnDef) || REGEX.IDENTITY.test(columnDef);
  const isUnique = REGEX.UNIQUE.test(columnDef);

  let references: { table: string; column: string } | undefined;
  const referencesMatch = columnDef.match(REGEX.REFERENCES);
  if (referencesMatch) {
    references = {
      table: extractIdentifier(referencesMatch[2] || referencesMatch[1] || ""),
      column: extractIdentifier(referencesMatch[3] || ""),
    };
  }

  return { isPrimaryKey, isUnique, references };
}

/**
 * Infer column type from SQL expression
 */
function inferColumnType(expression: string): string {
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
function extractColumnNameFromSelect(expression: string): string {
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
function getTableNameFromMatch(match: RegExpMatchArray): string {
  return match[2] || match[1] || "";
}

/**
 * Extract table name from FROM/JOIN match (handles schema.table or just table)
 */
function extractTableNameFromMatch(match: RegExpMatchArray): string {
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
function buildAliasMap(fromClause: string): Map<string, string> {
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
function findAlterTableEnd(sql: string, startIndex: number): number {
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
function findTableByName(
  tables: ParsedTable[],
  name: string
): ParsedTable | undefined {
  return tables.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

/**
 * Find a table by name in Table array (case-insensitive)
 */
function findTableInSchema(tables: Table[], name: string): Table | undefined {
  return tables.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

/**
 * Find a primary key column in a table
 */
function findPrimaryKeyColumn(table: Table): Column | undefined {
  return table.columns.find((c) => c.isPrimaryKey);
}

/**
 * Convert ParsedTable to Table
 */
function convertParsedTableToTable(
  table: ParsedTable,
  index: number,
  totalTables: number,
  categoryMap: Map<string, string>
): Table {
  const category = guessCategory(table.name);

  if (!categoryMap.has(category)) {
    categoryMap.set(
      category,
      COLOR_PALETTE[categoryMap.size % COLOR_PALETTE.length] as string
    );
  }

  const color = categoryMap.get(category)!;
  const position = calculatePosition(index, totalTables);

  const columns: Column[] = table.columns.map(
    (col: ParsedTable["columns"][number]) => ({
      name: col.name,
      type: col.type,
      isPrimaryKey: col.isPrimaryKey,
      isUnique: col.isUnique,
      isForeignKey: !!col.references,
      references: col.references,
    })
  );

  return {
    name: table.name,
    columns,
    position,
    color,
    category,
  };
}

/**
 * Convert ParsedView to Table with foreign key relationships
 */
function convertParsedViewToTable(
  view: ParsedView,
  index: number,
  totalTables: number,
  categoryMap: Map<string, string>,
  schemaTablesList: Table[]
): Table {
  const category = "view";

  if (!categoryMap.has(category)) {
    categoryMap.set(
      category,
      COLOR_PALETTE[categoryMap.size % COLOR_PALETTE.length] as string
    );
  }

  const color = categoryMap.get(category)!;
  const position = calculatePosition(index, totalTables);

  // Use parsed columns from the view definition
  const columns: Column[] = view.columns.map((col) => ({
    name: col.name,
    type: col.type,
    isPrimaryKey: false,
    isForeignKey: false,
    sourceTable: col.sourceTable,
    sourceColumn: col.sourceColumn,
  }));

  // Add foreign key-like references to columns that reference tables
  view.columns.forEach((col, colIndex) => {
    const columnRefMatch = col.name.match(REGEX.COLUMN_NAME_PATTERN);
    if (columnRefMatch) {
      const possibleTable = columnRefMatch[1];
      const referencedTable = findTableInSchema(
        schemaTablesList,
        possibleTable
      );
      if (referencedTable) {
        const pkColumn = findPrimaryKeyColumn(referencedTable);
        if (pkColumn) {
          columns[colIndex].isForeignKey = true;
          columns[colIndex].references = {
            table: referencedTable.name,
            column: pkColumn.name,
          };
        }
      }
    }
  });

  return {
    name: view.name,
    columns,
    position,
    color,
    category,
    isView: true,
  };
}

/**
 * Add view-to-table relationships as virtual columns
 */
function addViewRelationships(
  views: ParsedView[],
  schemaViewsList: Table[],
  schemaTablesList: Table[]
): void {
  const viewRelationships: Array<{ viewName: string; tableName: string }> = [];

  views.forEach((view) => {
    view.referencedTables.forEach((tableName) => {
      viewRelationships.push({
        viewName: view.name,
        tableName,
      });
    });
  });

  viewRelationships.forEach((rel) => {
    const viewTable = findTableInSchema(schemaViewsList, rel.viewName);
    const targetTable = findTableInSchema(schemaTablesList, rel.tableName);

    if (viewTable && targetTable) {
      const pkColumn = findPrimaryKeyColumn(targetTable);
      if (pkColumn) {
        // Check if we already have a reference column
        const existingRef = viewTable.columns.find(
          (c) => c.references?.table === targetTable.name
        );
        if (!existingRef) {
          // Add a virtual column to represent the relationship
          viewTable.columns.push({
            name: `_ref_${targetTable.name}`,
            type: "INTEGER",
            isPrimaryKey: false,
            isForeignKey: true,
            references: {
              table: targetTable.name,
              column: pkColumn.name,
            },
          });
        }
      }
    }
  });
}

// ============================================================================
// TABLE EXTRACTION
// ============================================================================

/**
 * Extract CREATE TABLE statements from SQL
 */
function extractTables(sql: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const cleanedSql = cleanSql(sql);
  const createTableStartRegex = new RegExp(
    REGEX.CREATE_TABLE.source,
    REGEX.CREATE_TABLE.flags
  );
  let match;

  while ((match = createTableStartRegex.exec(cleanedSql)) !== null) {
    const tableName = extractIdentifier(getTableNameFromMatch(match));
    const openParenIndex = match.index + match[0].length - 1;
    const closeParenIndex = findMatchingParen(cleanedSql, openParenIndex);

    if (closeParenIndex !== -1) {
      const columnsPart = cleanedSql.substring(
        openParenIndex + 1,
        closeParenIndex
      );
      const columns = parseColumns(columnsPart);

      // Parse table-level FOREIGN KEY constraints and apply them to columns
      parseTableLevelForeignKeys(
        columnsPart,
        columns as ParsedTable["columns"]
      );

      // Only add table if it has at least one column
      if (columns.length > 0) {
        tables.push({
          name: tableName,
          columns,
        });
      }
    }
  }

  return tables;
}

// ============================================================================
// VIEW EXTRACTION
// ============================================================================

interface ParsedView {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    sourceTable?: string; // Source table for this column
    sourceColumn?: string; // Source column name (if different from view column name)
  }>;
  referencedTables: string[]; // Tables referenced via JOINs
}

/**
 * Extract CREATE VIEW statements from SQL
 */
function extractViews(sql: string, tables?: ParsedTable[]): ParsedView[] {
  const views: ParsedView[] = [];

  // Remove GO statements (T-SQL batch separators) and comments
  const cleanedSql = cleanSql(sql);

  // Find CREATE VIEW statements
  const createViewRegex = new RegExp(
    REGEX.CREATE_VIEW.source,
    REGEX.CREATE_VIEW.flags
  );
  let match;

  while ((match = createViewRegex.exec(cleanedSql)) !== null) {
    const viewName = extractIdentifier(getTableNameFromMatch(match));

    // Try to find the SELECT statement after AS
    const afterAs = cleanedSql.substring(match.index + match[0].length);

    // Match SELECT ... FROM ... (with optional JOINs)
    // This regex captures the SELECT list and everything up to WHERE/ORDER BY/;
    const selectMatch = afterAs.match(REGEX.SELECT_FROM);

    const columns: Array<{
      name: string;
      type: string;
      sourceTable?: string;
      sourceColumn?: string;
    }> = [];
    const referencedTables: string[] = [];

    if (selectMatch) {
      const selectList = selectMatch[1].trim();
      const fromClause = selectMatch[2].trim();

      // Build alias map: alias -> table name
      // Note: fromClause doesn't include "FROM" keyword (it was consumed by the SELECT regex)
      const aliasMap = buildAliasMap(fromClause);

      // Parse column list
      if (selectList === "*") {
        // SELECT * - try to find the referenced table and use its columns
        // Handle T-SQL syntax: [schema].[table], [table], table, etc.
        // First, try to extract the table name from the FROM clause
        // Match: FROM table [alias] or FROM [schema].[table] [alias]
        const fromTableMatch = fromClause.match(REGEX.FIRST_TABLE_NO_ALIAS);
        if (fromTableMatch && tables) {
          const tableOrAlias = extractIdentifier(
            fromTableMatch[2] || fromTableMatch[1] || ""
          );
          const tableName = resolveTableName(tableOrAlias, aliasMap, tables);
          const referencedTable = findTableByName(tables, tableName);
          if (referencedTable) {
            referencedTable.columns.forEach((col) => {
              columns.push({
                name: col.name,
                type: col.type,
                sourceTable: tableName,
                sourceColumn: col.name,
              });
            });
          }
        }
      } else {
        // Parse explicit column list
        // Split by comma, but be careful with function calls and expressions
        const columnParts = selectList.split(",");
        for (const part of columnParts) {
          const trimmed = part.trim();
          if (!trimmed) continue;

          const columnName = extractColumnNameFromSelect(trimmed);

          // Try to infer type from the expression
          let columnType = inferColumnType(trimmed);
          let sourceTable: string | undefined;
          let sourceColumn: string | undefined;

          // Check if it's a column reference (table.column or just column)
          const columnRefMatch = trimmed.match(REGEX.COLUMN_REF);
          if (columnRefMatch && tables) {
            const tableOrAlias = extractIdentifier(columnRefMatch[2] || "");
            sourceColumn = extractIdentifier(columnRefMatch[3] || "");
            sourceTable = resolveTableName(tableOrAlias, aliasMap, tables);

            const sourceTableObj = tables
              ? findTableByName(tables, sourceTable)
              : undefined;
            if (sourceTableObj) {
              const sourceCol = findColumnByName(
                sourceTableObj.columns,
                sourceColumn
              );
              if (sourceCol) {
                columnType = sourceCol.type;
              }
            }
          } else if (REGEX.WORD.test(trimmed) && tables) {
            // Just a column name, try to find it in the first table
            const firstTableMatch = fromClause.match(REGEX.SCHEMA_TABLE);
            if (firstTableMatch) {
              const firstTableOrAlias = extractIdentifier(
                firstTableMatch[2] || firstTableMatch[1] || ""
              );
              sourceTable = resolveTableName(
                firstTableOrAlias,
                aliasMap,
                tables
              );
              sourceColumn = trimmed;

              const firstTable = tables
                ? findTableByName(tables, sourceTable)
                : undefined;
              if (firstTable) {
                const col = findColumnByName(firstTable.columns, trimmed);
                if (col) {
                  columnType = col.type;
                }
              }
            }
          }

          columns.push({
            name: columnName,
            type: columnType,
            sourceTable,
            sourceColumn:
              sourceColumn || (sourceTable ? columnName : undefined),
          });
        }
      }

      // Extract referenced tables from FROM and JOIN clauses
      let tableMatch;
      const tableNameRegex = new RegExp(
        REGEX.FROM_JOIN_TABLE.source,
        REGEX.FROM_JOIN_TABLE.flags
      );
      while ((tableMatch = tableNameRegex.exec(fromClause)) !== null) {
        const tableName = extractTableNameFromMatch(tableMatch);
        if (tableName && !referencedTables.includes(tableName)) {
          referencedTables.push(tableName);
        }
      }
    }

    // If no columns were parsed, create default ones
    if (columns.length === 0) {
      columns.push(
        { name: "id", type: "INTEGER" },
        { name: "name", type: "TEXT" },
        { name: "value", type: "TEXT" }
      );
    }

    views.push({
      name: viewName,
      columns,
      referencedTables,
    });
  }

  return views;
}

/**
 * Apply ALTER TABLE statements to modify existing tables
 */
function applyAlterTableStatements(sql: string, tables: ParsedTable[]): void {
  // Remove GO statements and comments
  const cleanedSql = cleanSql(sql);

  // First, handle ALTER TABLE ADD column statements
  // This must come before FOREIGN KEY constraints so columns exist when we add constraints
  // ALTER TABLE [schema.]table_name ADD [COLUMN] column_name ...
  // Supports: ALTER TABLE table ADD column, ALTER TABLE table ADD (col1, col2), etc.
  // Exclude ADD CONSTRAINT statements (those are handled separately)
  const alterTableRegex = new RegExp(
    REGEX.ALTER_TABLE_ADD.source,
    REGEX.ALTER_TABLE_ADD.flags
  );
  let match;

  while ((match = alterTableRegex.exec(cleanedSql)) !== null) {
    // Skip if this is an ADD CONSTRAINT statement (handled separately)
    const afterAdd = cleanedSql.substring(match.index + match[0].length).trim();
    if (afterAdd.toUpperCase().startsWith("CONSTRAINT")) {
      continue;
    }

    const tableName = extractIdentifier(getTableNameFromMatch(match));
    const alterStartIndex = match.index + match[0].length;
    const endIndex = findAlterTableEnd(cleanedSql, alterStartIndex);

    const alterStatement = cleanedSql
      .substring(alterStartIndex, endIndex)
      .trim();

    // Find the table in our parsed tables
    const table = findTableByName(tables, tableName);
    if (table && alterStatement) {
      // Handle both single column and multiple columns in parentheses
      let columnsToAdd: string;
      if (alterStatement.startsWith("(") && alterStatement.endsWith(")")) {
        // Multiple columns: ALTER TABLE ... ADD (col1, col2, ...)
        columnsToAdd = alterStatement.slice(1, -1);
      } else {
        // Single column: ALTER TABLE ... ADD col1 ...
        columnsToAdd = alterStatement;
      }

      // Parse the column definition(s) from ALTER TABLE ADD
      const columns = parseColumns(columnsToAdd);
      table.columns.push(...columns);
    }
  }

  // Second, handle ALTER TABLE ADD CONSTRAINT UNIQUE statements
  // Format: ALTER TABLE TableName ADD CONSTRAINT ConstraintName UNIQUE (ColumnName);
  // Supports bracketed identifiers: ALTER TABLE [Table] ADD CONSTRAINT [Constraint] UNIQUE ([Column]);
  const alterTableUniqueRegex = new RegExp(
    REGEX.ALTER_TABLE_UNIQUE.source,
    REGEX.ALTER_TABLE_UNIQUE.flags
  );

  let uniqueMatch;
  while ((uniqueMatch = alterTableUniqueRegex.exec(cleanedSql)) !== null) {
    const tableName = extractIdentifier(getTableNameFromMatch(uniqueMatch));
    const columnName = extractIdentifier(uniqueMatch[4] || "");

    const table = findTableByName(tables, tableName);
    if (table && columnName) {
      const column = findColumnByName(table.columns, columnName);
      if (column) {
        column.isUnique = true;
      }
    }
  }

  // Third, handle ALTER TABLE ADD CONSTRAINT FOREIGN KEY statements
  // This comes after ADD column so that columns exist when we add constraints
  // Format: ALTER TABLE ChildTable ADD CONSTRAINT FK_Name FOREIGN KEY (ChildColumn) REFERENCES ParentTable (ParentColumn);
  // Supports bracketed identifiers: ALTER TABLE [ChildTable] ADD CONSTRAINT FK_Name FOREIGN KEY ([ChildColumn]) REFERENCES [ParentTable] ([ParentColumn]);
  // Handles identifiers with spaces: ALTER TABLE [Order Details] ADD CONSTRAINT FK_Name FOREIGN KEY ([OrderID]) REFERENCES [Orders] ([OrderID]);
  // Handles WITH NOCHECK/WITH CHECK: ALTER TABLE [Table] WITH NOCHECK ADD CONSTRAINT FK_Name FOREIGN KEY (...) REFERENCES ...
  // Note: \s matches newlines, so multi-line statements are supported
  const alterTableFkRegex = new RegExp(
    REGEX.ALTER_TABLE_FK.source,
    REGEX.ALTER_TABLE_FK.flags
  );

  let fkMatch;
  while ((fkMatch = alterTableFkRegex.exec(cleanedSql)) !== null) {
    const childTableName = extractIdentifier(fkMatch[2] || fkMatch[1] || "");
    const childColumnName = extractIdentifier(fkMatch[4] || "");
    const parentTableName = extractIdentifier(fkMatch[6] || fkMatch[5] || "");
    const parentColumnName = extractIdentifier(fkMatch[7] || "");

    // Find the child table and update the column to mark it as a foreign key
    const childTable = findTableByName(tables, childTableName);
    if (childTable && childColumnName && parentTableName && parentColumnName) {
      // Find the parent table to get its actual name (for case matching)
      const parentTable = findTableByName(tables, parentTableName);
      if (!parentTable) {
        // Parent table doesn't exist, skip this constraint
        continue;
      }
      const actualParentTableName = parentTable.name;

      // Find the parent column to get its actual name (for case matching)
      const parentColumn = parentTable.columns.find(
        (c) => c.name.toLowerCase() === parentColumnName.toLowerCase()
      );
      if (!parentColumn) {
        // Parent column doesn't exist, skip this constraint
        continue;
      }
      const actualParentColumnName = parentColumn.name;

      const column = childTable.columns.find(
        (c) => c.name.toLowerCase() === childColumnName.toLowerCase()
      );
      if (column) {
        // Update the column to mark it as a foreign key
        // Use the actual parent table and column names from the schema for proper matching
        column.references = {
          table: actualParentTableName,
          column: actualParentColumnName,
        };
      }
    }
  }
}

// ============================================================================
// SQL BLOCK IDENTIFICATION
// ============================================================================

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

// ============================================================================
// COLUMN PARSING
// ============================================================================

/**
 * Parse column definitions from a columns part string
 */
function parseColumns(columnsPart: string) {
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
function parseTableLevelForeignKeys(
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

// ============================================================================
// SQL GENERATION
// ============================================================================

/**
 * Convert a DatabaseSchema back to SQL CREATE TABLE statements
 */
export function schemaToSql(schema: DatabaseSchema): string {
  const sqlStatements: string[] = [];

  // Separate tables and views
  const regularTables = schema.tables.filter((table) => !table.isView);
  const views = schema.tables.filter((table) => table.isView);

  // Convert tables to SQL
  for (const table of regularTables) {
    const columns: string[] = [];

    for (const column of table.columns) {
      let columnDef = `${column.name} ${column.type}`;

      if (column.isPrimaryKey) {
        columnDef += " PRIMARY KEY";
      }

      if (column.isForeignKey && column.references) {
        columnDef += ` REFERENCES ${column.references.table}(${column.references.column})`;
      }

      columns.push(columnDef);
    }

    const createTable = `CREATE TABLE ${table.name} (\n  ${columns.join(
      ",\n  "
    )}\n);`;
    sqlStatements.push(createTable);
  }

  // Convert views to SQL (views are now tables with isView flag)
  if (views.length > 0) {
    for (const view of views) {
      // Generate a placeholder CREATE VIEW statement
      // Since we don't store the full view definition, we'll use a simple placeholder
      const createView = `CREATE VIEW ${view.name} AS\nSELECT * FROM ${
        regularTables[0]?.name || "table"
      };`;
      sqlStatements.push(createView);
    }
  }

  return sqlStatements.join("\n\n");
}
