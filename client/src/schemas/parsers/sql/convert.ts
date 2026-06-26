import type { Table, Column } from "@/shared/types/schema";
import {
  COLOR_PALETTE,
  guessCategory,
  calculatePosition,
} from "../parser-utils";
import { REGEX } from "./regex";
import { findTableInSchema, findPrimaryKeyColumn } from "./helpers";
import type { ParsedTable, ParsedView } from "./types";

/**
 * Convert ParsedTable to Table
 */
export function convertParsedTableToTable(
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
      isNullable: col.isNullable,
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
export function convertParsedViewToTable(
  view: ParsedView,
  index: number,
  totalTables: number,
  categoryMap: Map<string, string>,
  schemaTablesList: Table[]
): Table {
  const category = "View";

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
export function addViewRelationships(
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
