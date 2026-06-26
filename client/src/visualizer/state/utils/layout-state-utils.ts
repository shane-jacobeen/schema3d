import type { DatabaseSchema, Table, Column } from "@/shared/types/schema";
import type { LayoutType } from "@/visualizer/state/initial-state";
import {
  applyHierarchicalLayout,
  applyCircularLayout,
} from "@/visualizer/3d/utils/layout-algorithm";
import { runForceDirectedLayout } from "@/visualizer/3d/utils/run-force-layout";

/**
 * Apply a layout algorithm to a schema (synchronous except force layout on large schemas).
 */
export function applyLayoutToSchema(
  schema: DatabaseSchema,
  layout: LayoutType,
  viewMode: "2D" | "3D" = "2D"
): DatabaseSchema {
  switch (layout) {
    case "force": {
      const result = runForceDirectedLayout(schema, viewMode);
      if (result instanceof Promise) {
        throw new Error(
          "Large force-directed layouts must use applyLayoutToSchemaAsync"
        );
      }
      return result;
    }
    case "hierarchical":
      return applyHierarchicalLayout(schema, viewMode);
    case "circular":
      return applyCircularLayout(schema, viewMode);
    default:
      return schema;
  }
}

export async function applyLayoutToSchemaAsync(
  schema: DatabaseSchema,
  layout: LayoutType,
  viewMode: "2D" | "3D" = "2D"
): Promise<DatabaseSchema> {
  if (layout === "force") {
    return await runForceDirectedLayout(schema, viewMode);
  }
  return applyLayoutToSchema(schema, layout, viewMode);
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
  if (schema1.tables.length !== schema2.tables.length) {
    return false;
  }

  const tables1 = new Map<string, Table>();
  const tables2 = new Map<string, Table>();

  schema1.tables.forEach((t) => tables1.set(t.name.toLowerCase(), t));
  schema2.tables.forEach((t) => tables2.set(t.name.toLowerCase(), t));

  if (tables1.size !== tables2.size) {
    return false;
  }

  for (const [name, table1] of Array.from(tables1)) {
    const table2 = tables2.get(name);
    if (!table2) {
      return false;
    }

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

      if (
        col1.type !== col2.type ||
        col1.isPrimaryKey !== col2.isPrimaryKey ||
        col1.isForeignKey !== col2.isForeignKey ||
        col1.isUnique !== col2.isUnique
      ) {
        return false;
      }

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
        return false;
      }
    }
  }

  return true;
}
