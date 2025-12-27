import { useState, useRef, useCallback } from "react";
import type { DatabaseSchema } from "@/shared/types/schema";
import { getRetailerSchema } from "@/schemas/utils/load-schemas";
import { applyLayoutToSchema } from "@/visualizer/state/utils/schema-utils";
import type { LayoutType } from "@/visualizer/ui/layout/layout-controls";

interface UseSchemaStateReturn {
  currentSchema: DatabaseSchema;
  setCurrentSchema: React.Dispatch<React.SetStateAction<DatabaseSchema>>;
  persistedSchemaRef: React.MutableRefObject<DatabaseSchema>;
  handleSchemaChangeFromSelector: (
    newSchema: DatabaseSchema,
    onCategoriesReset?: (schema: DatabaseSchema) => void
  ) => void;
}

export function useSchemaState(
  clearAllSelections: () => void,
  handleRecenter: () => void,
  getViewMode: () => "2D" | "3D"
): UseSchemaStateReturn {
  const [currentSchema, setCurrentSchema] =
    useState<DatabaseSchema>(getRetailerSchema());
  const persistedSchemaRef = useRef<DatabaseSchema>(getRetailerSchema());

  const applyLayout = useCallback(
    (
      schema: DatabaseSchema,
      layout: LayoutType,
      mode?: "2D" | "3D"
    ): DatabaseSchema => {
      const viewMode = mode ?? getViewMode();
      return applyLayoutToSchema(schema, layout, viewMode);
    },
    [getViewMode]
  );

  // When schema changes from SchemaSelector, apply force layout and set directly
  const handleSchemaChangeFromSelector = useCallback(
    (
      newSchema: DatabaseSchema,
      onCategoriesReset?: (schema: DatabaseSchema) => void
    ) => {
      // Apply force layout to the new schema with current view mode
      const forceLayoutSchema = applyLayout(newSchema, "force");

      // Set the schema directly - no animation for schema selector changes
      setCurrentSchema(forceLayoutSchema);

      clearAllSelections();

      // Reset category filters when a new schema is loaded
      if (onCategoriesReset) {
        onCategoriesReset(forceLayoutSchema);
      }

      // Reset camera to default position when schema changes
      handleRecenter();
    },
    [applyLayout, clearAllSelections, handleRecenter]
  );

  return {
    currentSchema,
    setCurrentSchema,
    persistedSchemaRef,
    handleSchemaChangeFromSelector,
  };
}
