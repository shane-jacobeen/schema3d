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
  handleSchemaChange: (newSchema: DatabaseSchema) => void;
}

export function useSchemaState(
  startTableAnimation: (schema: DatabaseSchema) => void,
  clearAllSelections: () => void,
  handleRecenter: () => void,
  isLayoutChangingRef: React.MutableRefObject<boolean>,
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

  const handleSchemaChange = useCallback(
    (newSchema: DatabaseSchema) => {
      // Layout change - the schema already has the layout applied
      // Animate to the new positions
      startTableAnimation(newSchema);
      clearAllSelections();
      isLayoutChangingRef.current = false;
    },
    [startTableAnimation, clearAllSelections, isLayoutChangingRef]
  );

  // When schema changes from SchemaSelector, just set it directly (no animation)
  const handleSchemaChangeFromSelector = useCallback(
    (
      newSchema: DatabaseSchema,
      onCategoriesReset?: (schema: DatabaseSchema) => void
    ) => {
      // Apply force layout to the new schema with current view mode
      const forceLayoutSchema = applyLayout(newSchema, "force");

      // Set layout change flag BEFORE setting layout to prevent view mode effect
      isLayoutChangingRef.current = true;

      // Set the schema directly - no animation
      setCurrentSchema(forceLayoutSchema);

      clearAllSelections();

      // Reset category filters when a new schema is loaded
      // Pass the new schema so resetCategories uses the correct schema
      if (onCategoriesReset) {
        onCategoriesReset(forceLayoutSchema);
      }

      // Reset camera to default position when schema changes
      handleRecenter();

      // Clear the flag after React has processed the state updates
      // Use requestAnimationFrame to ensure it happens after the effect runs
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isLayoutChangingRef.current = false;
        });
      });
    },
    [applyLayout, clearAllSelections, handleRecenter, isLayoutChangingRef]
  );

  return {
    currentSchema,
    setCurrentSchema,
    persistedSchemaRef,
    handleSchemaChangeFromSelector,
    handleSchemaChange,
  };
}
