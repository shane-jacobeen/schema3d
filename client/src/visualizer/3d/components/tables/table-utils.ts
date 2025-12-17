import type { Table, DatabaseSchema } from "@/shared/types/schema";
import type { Relationship } from "../../types";

/**
 * Calculates which tables are directly connected to the selected table/relationship
 */
export function getConnectedTables(
  schema: DatabaseSchema,
  selectedTable: Table | null,
  selectedRelationship: Relationship | null
): Set<string> {
  // If a relationship is selected, use both tables from the relationship
  const sourceTables = selectedRelationship
    ? [selectedRelationship.fromTable, selectedRelationship.toTable]
    : selectedTable
      ? [selectedTable.name]
      : [];

  if (sourceTables.length === 0) {
    return new Set<string>();
  }

  const connected = new Set<string>(sourceTables);

  // Find all tables directly connected to any of the source tables
  // Check both directions: tables that reference the source tables, and tables the source tables reference
  schema.tables.forEach((table) => {
    table.columns.forEach((column) => {
      if (column.references) {
        const fromTable = table.name;
        const toTable = column.references.table;

        // Check if either table in this relationship is one of our source tables
        sourceTables.forEach((sourceTable) => {
          if (fromTable === sourceTable || toTable === sourceTable) {
            // Add the other table (not the source one)
            if (fromTable === sourceTable) {
              connected.add(toTable);
            } else {
              connected.add(fromTable);
            }
          }
        });
      }
    });
  });

  return connected;
}

/**
 * Determines if a table should be dimmed based on selection and filtering
 */
export function shouldDimTable(
  table: Table,
  filteredTables: Set<string>,
  relatedTables: Set<string>,
  connectedTables: Set<string>,
  hasSelection: boolean,
  isFiltering: boolean
): boolean {
  if (hasSelection) {
    return !connectedTables.has(table.name);
  }
  return (
    isFiltering &&
    !filteredTables.has(table.name) &&
    !relatedTables.has(table.name)
  );
}

/**
 * Determines if a table is highlighted by a relationship
 */
export function isTableInRelationship(
  table: Table,
  relationship: Relationship | null
): boolean {
  if (!relationship) return false;
  return (
    relationship.fromTable === table.name || relationship.toTable === table.name
  );
}
