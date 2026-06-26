import { REGEX } from "./regex";
import {
  cleanSql,
  extractIdentifier,
  getTableNameFromMatch,
  extractTableNameFromMatch,
  buildAliasMap,
  resolveTableName,
  findTableByName,
  findColumnByName,
  findAlterTableEnd,
  inferColumnType,
  extractColumnNameFromSelect,
} from "./helpers";
import { parseColumns } from "./columns";
import type { ParsedTable, ParsedView } from "./types";

/**
 * Extract CREATE VIEW statements from SQL
 */
export function extractViews(
  sql: string,
  tables?: ParsedTable[]
): ParsedView[] {
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
export function applyAlterTableStatements(
  sql: string,
  tables: ParsedTable[]
): void {
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
