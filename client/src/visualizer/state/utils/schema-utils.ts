import type { DatabaseSchema, Table, Column } from "@/shared/types/schema";
import type { LayoutType } from "@/visualizer/3d/controls/view-controls";
import {
  applyForceDirectedLayout,
  applyHierarchicalLayout,
  applyCircularLayout,
} from "@/visualizer/3d/utils/layout-algorithm";

/**
 * Apply a layout algorithm to a schema
 */
export function applyLayoutToSchema(
  schema: DatabaseSchema,
  layout: LayoutType,
  viewMode: "2D" | "3D" = "2D"
): DatabaseSchema {
  switch (layout) {
    case "force":
      return applyForceDirectedLayout(schema, viewMode);
    case "hierarchical":
      return applyHierarchicalLayout(schema, viewMode);
    case "circular":
      return applyCircularLayout(schema, viewMode);
    default:
      return schema;
  }
}

/**
 * Clear all selections and return default state
 */
export function clearSelections() {
  return {
    selectedTable: null,
    hoveredTable: null,
    selectedRelationship: null,
    hoveredRelationship: null,
    filteredTables: new Set<string>(),
    relatedTables: new Set<string>(),
  };
}

/**
 * Compare two schemas structurally (ignoring visual properties like position, color)
 * Returns true if schemas are equivalent
 */
export function areSchemasEqual(
  schema1: DatabaseSchema,
  schema2: DatabaseSchema
): boolean {
  // Compare table counts
  if (schema1.tables.length !== schema2.tables.length) {
    return false;
  }

  // Create maps for quick lookup
  const tables1 = new Map<string, Table>();
  const tables2 = new Map<string, Table>();

  schema1.tables.forEach((t) => tables1.set(t.name.toLowerCase(), t));
  schema2.tables.forEach((t) => tables2.set(t.name.toLowerCase(), t));

  // Check if all table names match
  if (tables1.size !== tables2.size) {
    return false;
  }

  for (const [name, table1] of Array.from(tables1)) {
    const table2 = tables2.get(name);
    if (!table2) {
      return false;
    }

    // Compare columns
    if (table1.columns.length !== table2.columns.length) {
      return false;
    }

    const cols1 = new Map<string, Column>();
    const cols2 = new Map<string, Column>();

    table1.columns.forEach((c) => cols1.set(c.name.toLowerCase(), c));
    table2.columns.forEach((c) => cols2.set(c.name.toLowerCase(), c));

    for (const [colName, col1] of Array.from(cols1)) {
      const col2 = cols2.get(colName);
      if (!col2) {
        return false;
      }

      // Compare column properties (ignoring visual properties)
      if (
        col1.type !== col2.type ||
        col1.isPrimaryKey !== col2.isPrimaryKey ||
        col1.isForeignKey !== col2.isForeignKey ||
        col1.isUnique !== col2.isUnique
      ) {
        return false;
      }

      // Compare references
      if (col1.references && col2.references) {
        if (
          col1.references.table.toLowerCase() !==
            col2.references.table.toLowerCase() ||
          col1.references.column.toLowerCase() !==
            col2.references.column.toLowerCase()
        ) {
          return false;
        }
      } else if (col1.references || col2.references) {
        // One has references, the other doesn't
        return false;
      }
    }
  }

  return true;
}
