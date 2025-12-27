import { useState, useRef, useEffect, useCallback } from "react";
import type { DatabaseSchema } from "@/shared/types/schema";
import type { LayoutType } from "@/visualizer/ui/layout/layout-controls";
import { applyLayoutToFilteredSchema } from "../utils/layout-utils";

interface UseLayoutManagementReturn {
  currentLayout: LayoutType;
  viewMode: "2D" | "3D";
  setCurrentLayout: React.Dispatch<React.SetStateAction<LayoutType>>;
  setViewMode: React.Dispatch<React.SetStateAction<"2D" | "3D">>;
  handleLayoutChange: (layout: LayoutType) => void;
}

export function useLayoutManagement(
  currentSchema: DatabaseSchema,
  setCurrentSchema: React.Dispatch<React.SetStateAction<DatabaseSchema>>,
  visibleTables: DatabaseSchema["tables"],
  selectedCategories: Set<string>,
  startTableAnimation: (schema: DatabaseSchema) => void
): UseLayoutManagementReturn {
  const [currentLayout, setCurrentLayout] = useState<LayoutType>("force");
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");

  // Track previous values to detect changes
  const prevLayoutRef = useRef<LayoutType>(currentLayout);
  const prevViewModeRef = useRef<"2D" | "3D">(viewMode);
  const prevVisibleTableNamesRef = useRef<Set<string>>(
    new Set(visibleTables.map((t) => t.name))
  );
  const isInitialMountRef = useRef(true);

  // Single unified effect that handles all layout recalculations
  useEffect(() => {
    // Skip initial mount - layout is applied during schema loading
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevLayoutRef.current = currentLayout;
      prevViewModeRef.current = viewMode;
      prevVisibleTableNamesRef.current = new Set(
        visibleTables.map((t) => t.name)
      );
      return;
    }

    // Detect what changed
    const layoutChanged = prevLayoutRef.current !== currentLayout;
    const viewModeChanged = prevViewModeRef.current !== viewMode;

    // Check if visible tables changed (by name set comparison)
    const currentVisibleNames = new Set(visibleTables.map((t) => t.name));
    const visibleTablesChanged =
      prevVisibleTableNamesRef.current.size !== currentVisibleNames.size ||
      Array.from(prevVisibleTableNamesRef.current).some(
        (name) => !currentVisibleNames.has(name)
      );

    // Update previous values
    prevLayoutRef.current = currentLayout;
    prevViewModeRef.current = viewMode;
    prevVisibleTableNamesRef.current = currentVisibleNames;

    // If any layout-affecting property changed, recalculate and animate
    if (
      (layoutChanged || viewModeChanged || visibleTablesChanged) &&
      visibleTables.length > 0
    ) {
      setCurrentSchema((prevSchema) => {
        const updatedSchema = applyLayoutToFilteredSchema(
          prevSchema,
          visibleTables,
          currentLayout,
          viewMode
        );

        // Animate to new positions
        startTableAnimation(updatedSchema);
        return prevSchema; // Don't update yet, animation will handle it
      });
    }
  }, [
    currentLayout,
    viewMode,
    visibleTables,
    setCurrentSchema,
    startTableAnimation,
  ]);

  const handleLayoutChange = useCallback((layout: LayoutType) => {
    setCurrentLayout(layout);
  }, []);

  return {
    currentLayout,
    viewMode,
    setCurrentLayout,
    setViewMode,
    handleLayoutChange,
  };
}
