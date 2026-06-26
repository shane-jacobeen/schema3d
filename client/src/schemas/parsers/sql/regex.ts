/**
 * Centralized regex patterns for SQL parsing
 * Supports T-SQL syntax with bracketed identifiers [table_name] and schema prefixes schema.table
 */

/**
 * Identifier patterns - handles [schema].[table], [table], "table", `table`, or plain table
 */
export const REGEX = {
  // Base identifier pattern: optional schema.table or just table
  // Group 1: optional schema, Group 2: table name
  SCHEMA_TABLE: /(?:["[`]?(\w+)["\]`]?\s*\.\s*)?["[`]?([\w]+)["\]`]?/i,

  // Bracketed identifier with optional schema: [schema].[table] or [table]
  BRACKETED_IDENTIFIER: /\[?(\w+)\]?\.\[?([\w]+)\]?/i,

  // Full bracketed identifier pattern (supports spaces in names): [Order Details]
  FULL_BRACKETED: /(\[[^\]]+\]|[\w]+)/g,

  // Simple word identifier
  WORD: /^\w+$/i,

  // SQL Statement patterns
  SQL_STATEMENT_START:
    /^\s*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT)\s+/i,

  // CREATE TABLE: CREATE TABLE [schema].[table] ( or CREATE TABLE "schema"."table" (
  CREATE_TABLE:
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["[`]?(\w+)["\]`]?\s*\.\s*)?["[`]?([\w]+)["\]`]?\s*\(/gi,

  // ALTER TABLE ADD: ALTER TABLE [schema].[table] ADD [COLUMN] ...
  ALTER_TABLE_ADD:
    /ALTER\s+TABLE\s+(?:["[`]?(\w+)["\]`]?\s*\.\s*)?["[`]?([\w]+)["\]`]?\s+ADD\s+(?:COLUMN\s+)?/gi,

  // ALTER TABLE ADD CONSTRAINT UNIQUE
  ALTER_TABLE_UNIQUE:
    /ALTER\s+TABLE\s+(?:(\[[^\]]+\]|"[^"]+"|[\w]+)\s*\.\s*)?(\[[^\]]+\]|"[^"]+"|[\w]+)\s+ADD\s+CONSTRAINT\s+(\[[^\]]+\]|"[^"]+"|[\w]+)\s+UNIQUE\s*\((\[[^\]]+\]|"[^"]+"|[\w]+)\)/gi,

  // ALTER TABLE ADD CONSTRAINT FOREIGN KEY
  ALTER_TABLE_FK:
    /ALTER\s+TABLE\s+(?:(\[[^\]]+\]|"[^"]+"|[\w]+)\s*\.\s*)?(\[[^\]]+\]|"[^"]+"|[\w]+)\s+(?:WITH\s+(?:NO)?CHECK\s+)?ADD\s+CONSTRAINT\s+(\[[^\]]+\]|"[^"]+"|[\w~]+)\s+FOREIGN\s+KEY\s*\((\[[^\]]+\]|"[^"]+"|[\w]+)\)\s+REFERENCES\s+(?:(\[[^\]]+\]|"[^"]+"|[\w]+)\s*\.\s*)?(\[[^\]]+\]|"[^"]+"|[\w]+)\s*\((\[[^\]]+\]|"[^"]+"|[\w]+)\)/gi,

  // CREATE VIEW: CREATE [OR REPLACE] VIEW [schema].[view] [AS] ...
  CREATE_VIEW:
    /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["[`]?(\w+)["\]`]?\s*\.\s*)?["[`]?([\w]+)["\]`]?\s*(?:AS\s+)?/gi,

  // SELECT ... FROM ... (with optional WHERE/ORDER BY)
  SELECT_FROM:
    /SELECT\s+([\s\S]*?)\s+FROM\s+([\s\S]*?)(?:\s+WHERE|\s+ORDER\s+BY|;|$)/i,

  // FROM/JOIN table extraction
  FROM_JOIN_TABLE:
    /\b(?:FROM|JOIN)\s+(?:["[`]?(\w+)["\]`]?\s*\.\s*)?["[`]?([\w]+)["\]`]?/gi,

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

  // Column definition: [column] TYPE or column TYPE (supports int8, timestamptz, etc.)
  COLUMN_DEF:
    /^[`"[\]]?(\w+)[`"[\]]?\s+(\[[^\]]+\]|[A-Za-z]\w*)(?:\s*\(([^)]+)\))?/i,

  // AS alias: ... AS alias
  AS_ALIAS: /\bAS\s+(\w+)$/i,

  // Constraint patterns
  PRIMARY_KEY: /PRIMARY\s+KEY/i,
  IDENTITY: /\bIDENTITY\b/i,
  UNIQUE: /\bUNIQUE\b/i,
  FOREIGN_KEY: /FOREIGN\s+KEY/i,
  NOT_NULL: /\bNOT\s+NULL\b/i,

  // REFERENCES: REFERENCES [schema].[table]([column]) or "schema"."table"("column")
  REFERENCES:
    /REFERENCES\s+(?:["[`]?(\w+)["\]`]?\s*\.\s*)?["[`]?([\w]+)["\]`]?\s*\(["[`]?([\w]+)["\]`]?\)/i,

  // Table-level FOREIGN KEY: FOREIGN KEY (column) REFERENCES table(column)
  TABLE_FK:
    /FOREIGN\s+KEY\s*\(["[`]?([\w]+)["\]`]?\)\s+REFERENCES\s+(?:["[`]?(\w+)["\]`]?\s*\.\s*)?["[`]?([\w]+)["\]`]?\s*\(["[`]?([\w]+)["\]`]?\)/gi,

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
