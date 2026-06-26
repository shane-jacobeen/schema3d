import type { DatabaseSchema } from "@/shared/types/schema";

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
      // Collect all referenced tables from sourceTable in columns
      const referencedTables = new Set<string>();
      view.columns.forEach((col) => {
        if (col.sourceTable && !col.name.startsWith("_ref_")) {
          // Skip virtual reference columns
          referencedTables.add(col.sourceTable);
        }
      });

      // Filter out virtual reference columns when generating SELECT
      const realColumns = view.columns.filter(
        (c) => !c.name.startsWith("_ref_")
      );

      // Create SELECT statement with proper table references
      const selectColumns = realColumns
        .map((c) => {
          if (c.sourceTable && c.sourceColumn) {
            return `${c.sourceTable}.${c.sourceColumn} AS ${c.name}`;
          }
          return c.name;
        })
        .join(",\n  ");

      // Build FROM clause with all referenced tables
      let fromClause: string;
      const tablesArray = Array.from(referencedTables);
      if (tablesArray.length === 0) {
        // No source tables, use first regular table as fallback
        fromClause = regularTables[0]?.name || "table";
      } else if (tablesArray.length === 1) {
        // Single table
        fromClause = tablesArray[0];
      } else {
        // Multiple tables - use JOINs
        fromClause = tablesArray[0];
        for (let i = 1; i < tablesArray.length; i++) {
          fromClause += `\nJOIN ${tablesArray[i]}`;
        }
      }

      const createView = `CREATE VIEW ${view.name} AS\nSELECT\n  ${selectColumns}\nFROM ${fromClause};`;
      sqlStatements.push(createView);
    }
  }

  return sqlStatements.join("\n\n");
}
