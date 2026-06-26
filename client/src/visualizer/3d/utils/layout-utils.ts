import type { DatabaseSchema } from "@/shared/types/schema";
import {
  applyLayoutToSchema,
  applyLayoutToSchemaAsync,
} from "@/visualizer/state/utils/schema-utils";
import type { LayoutType } from "@/visualizer/ui/layout/layout-controls";

const FORCE_LAYOUT_WORKER_THRESHOLD = 50;

/**
 * Apply layout to filtered schema and merge positions back into full schema
 */
export function applyLayoutToFilteredSchema(
  currentSchema: DatabaseSchema,
  visibleTables: DatabaseSchema["tables"],
  layout: LayoutType,
  viewMode: "2D" | "3D"
): DatabaseSchema {
  const filteredSchema: DatabaseSchema = {
    ...currentSchema,
    tables: visibleTables,
  };

  const layoutedSchema = applyLayoutToSchema(filteredSchema, layout, viewMode);

  return mergeLayoutPositions(currentSchema, layoutedSchema);
}

export async function applyLayoutToFilteredSchemaAsync(
  currentSchema: DatabaseSchema,
  visibleTables: DatabaseSchema["tables"],
  layout: LayoutType,
  viewMode: "2D" | "3D"
): Promise<DatabaseSchema> {
  const filteredSchema: DatabaseSchema = {
    ...currentSchema,
    tables: visibleTables,
  };

  const layoutedSchema = await applyLayoutToSchemaAsync(
    filteredSchema,
    layout,
    viewMode
  );

  return mergeLayoutPositions(currentSchema, layoutedSchema);
}

export function shouldUseAsyncForceLayout(
  tableCount: number,
  layout: LayoutType
): boolean {
  return layout === "force" && tableCount >= FORCE_LAYOUT_WORKER_THRESHOLD;
}

function mergeLayoutPositions(
  currentSchema: DatabaseSchema,
  layoutedSchema: DatabaseSchema
): DatabaseSchema {
  return {
    ...currentSchema,
    tables: currentSchema.tables.map((table) => {
      const layoutedTable = layoutedSchema.tables.find(
        (t) => t.name === table.name
      );
      if (layoutedTable) {
        return {
          ...table,
          position: layoutedTable.position,
        };
      }
      return table;
    }),
  };
}
