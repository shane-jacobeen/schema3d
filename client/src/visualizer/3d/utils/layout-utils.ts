import type { DatabaseSchema } from "@/shared/types/schema";
import { applyLayoutToSchema } from "@/visualizer/state/utils/schema-utils";
import type { LayoutType } from "@/visualizer/ui/layout/layout-controls";

/**
 * Apply layout to filtered schema and merge positions back into full schema
 */
export function applyLayoutToFilteredSchema(
  currentSchema: DatabaseSchema,
  visibleTables: DatabaseSchema["tables"],
  layout: LayoutType,
  viewMode: "2D" | "3D"
): DatabaseSchema {
  // Create a filtered schema with only visible tables
  const filteredSchema: DatabaseSchema = {
    ...currentSchema,
    tables: visibleTables,
  };

  // Apply current layout to filtered schema
  const layoutedSchema = applyLayoutToSchema(filteredSchema, layout, viewMode);

  // Create a new schema with updated positions for visible tables
  // Keep hidden tables at their current positions
  const updatedSchema: DatabaseSchema = {
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
      // Keep hidden tables at their current positions
      return table;
    }),
  };

  return updatedSchema;
}
