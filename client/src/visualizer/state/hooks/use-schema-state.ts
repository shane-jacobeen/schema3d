import { useState, useRef, useCallback } from "react";
import type { DatabaseSchema } from "@/shared/types/schema";
import { applyLayoutToSchema } from "@/visualizer/state/utils/schema-utils";
import {
  getInitialSchema,
  DEFAULT_LAYOUT,
  type LayoutType,
} from "@/visualizer/state/initial-state";

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
    useState<DatabaseSchema>(getInitialSchema);
  const persistedSchemaRef = useRef<DatabaseSchema>(getInitialSchema());

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
      // Apply default layout to the new schema with current view mode
      const layoutSchema = applyLayout(newSchema, DEFAULT_LAYOUT);

      // Set the schema directly - no animation for schema selector changes
      setCurrentSchema(layoutSchema);

      clearAllSelections();

      // Reset category filters when a new schema is loaded
      if (onCategoriesReset) {
        onCategoriesReset(layoutSchema);
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
