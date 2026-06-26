import { useState, useRef, useCallback, useEffect } from "react";
import type { DatabaseSchema } from "@/shared/types/schema";
import {
  applyLayoutToSchema,
  applyLayoutToSchemaAsync,
} from "@/visualizer/state/utils/schema-utils";
import {
  getInitialSchema,
  DEFAULT_LAYOUT,
  type LayoutType,
} from "@/visualizer/state/initial-state";
import { removeSchemaFromUrl, hasSchemaInUrl } from "@/shared/utils/url-state";
import { consumePendingViewState } from "@/visualizer/state/utils/view-state-store";

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

  // Clean up URL hash and pending view state after initial schema load
  useEffect(() => {
    if (hasSchemaInUrl()) {
      // Remove the hash after React has initialized with the schema
      removeSchemaFromUrl();
    }
    // Consume/clear the pending view state after all hooks have initialized
    consumePendingViewState();
  }, []);

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
      const applySchema = (layoutSchema: DatabaseSchema) => {
        // Set the schema directly - no animation for schema selector changes
        setCurrentSchema(layoutSchema);

        clearAllSelections();

        // Reset category filters when a new schema is loaded
        if (onCategoriesReset) {
          onCategoriesReset(layoutSchema);
        }

        // Reset camera to default position when schema changes
        handleRecenter();
      };

      try {
        // Apply default layout to the new schema with current view mode
        const layoutSchema = applyLayout(newSchema, DEFAULT_LAYOUT);
        applySchema(layoutSchema);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("applyLayoutToSchemaAsync")
        ) {
          const viewMode = getViewMode();
          void applyLayoutToSchemaAsync(newSchema, DEFAULT_LAYOUT, viewMode)
            .then((layoutSchema) => {
              applySchema(layoutSchema);
            })
            .catch(() => {
              // Fall back to raw schema if async layout fails for any reason.
              applySchema(newSchema);
            });
          return;
        }

        throw error;
      }
    },
    [applyLayout, clearAllSelections, getViewMode, handleRecenter]
  );

  return {
    currentSchema,
    setCurrentSchema,
    persistedSchemaRef,
    handleSchemaChangeFromSelector,
  };
}
