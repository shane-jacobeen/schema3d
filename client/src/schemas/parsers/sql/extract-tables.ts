import { REGEX } from "./regex";
import {
  cleanSql,
  findMatchingParen,
  extractIdentifier,
  getTableNameFromMatch,
} from "./helpers";
import { parseColumns, parseTableLevelForeignKeys } from "./columns";
import type { ParsedTable } from "./types";

/**
 * Extract CREATE TABLE statements from SQL
 */
export function extractTables(sql: string): ParsedTable[] {
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
