import { useState, useRef, useEffect, useCallback } from "react";
import type { DatabaseSchema } from "@/shared/types/schema";
import type { LayoutType } from "@/visualizer/3d/controls/view-controls";
import { applyLayoutToSchema } from "@/visualizer/state/utils/schema-utils";
import { applyLayoutToFilteredSchema } from "../utils/layout-utils";

interface UseLayoutManagementReturn {
  currentLayout: LayoutType;
  viewMode: "2D" | "3D";
  setCurrentLayout: React.Dispatch<React.SetStateAction<LayoutType>>;
  setViewMode: React.Dispatch<React.SetStateAction<"2D" | "3D">>;
  handleLayoutChange: (layout: LayoutType) => void;
  isLayoutChangingRef: React.MutableRefObject<boolean>;
  isViewModeChangingRef: React.MutableRefObject<boolean>;
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
  const isLayoutChangingRef = useRef(false);
  const isViewModeChangingRef = useRef(false);

  const applyLayout = useCallback(
    (
      schema: DatabaseSchema,
      layout: LayoutType,
      mode: "2D" | "3D" = viewMode
    ): DatabaseSchema => {
      return applyLayoutToSchema(schema, layout, mode);
    },
    [viewMode]
  );

  // Track selected categories in a ref to avoid stale closures
  const selectedCategoriesRef = useRef<Set<string>>(selectedCategories);
  useEffect(() => {
    selectedCategoriesRef.current = selectedCategories;
  }, [selectedCategories]);

  // Apply force layout on initial load
  useEffect(() => {
    const forceLayoutSchema = applyLayout(currentSchema, "force", viewMode);
    setCurrentSchema(forceLayoutSchema);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, not when viewMode changes

  // Reapply layout when view mode or layout changes (but not on initial mount)
  const isInitialMountRef = useRef(true);
  const prevViewModeRef = useRef<"2D" | "3D">(viewMode);
  const prevLayoutRef = useRef<LayoutType>(currentLayout);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevViewModeRef.current = viewMode;
      prevLayoutRef.current = currentLayout;
      return;
    }

    // Only recalculate if view mode or layout actually changed
    const viewModeChanged = prevViewModeRef.current !== viewMode;
    const layoutChanged = prevLayoutRef.current !== currentLayout;

    // If layout is being changed via handleLayoutChange, skip layout recalculation
    // (it will be handled by ViewControls.applyLayout -> handleSchemaChange)
    // But still allow view mode changes to proceed
    if (isLayoutChangingRef.current && layoutChanged && !viewModeChanged) {
      prevViewModeRef.current = viewMode;
      prevLayoutRef.current = currentLayout;
      return;
    }

    // Handle view mode changes (even if layout change is in progress)
    // or layout changes (when not blocked by isLayoutChangingRef)
    if (viewModeChanged || (layoutChanged && !isLayoutChangingRef.current)) {
      isViewModeChangingRef.current = true;
      // Get current schema, filter to visible tables, apply new layout, and animate
      setCurrentSchema((prevSchema) => {
        const schemaLayout = applyLayoutToFilteredSchema(
          prevSchema,
          visibleTables,
          currentLayout,
          viewMode
        );

        startTableAnimation(schemaLayout);
        return prevSchema; // Don't update yet, animation will handle it
      });

      // Clear the flag after animation completes
      setTimeout(() => {
        isViewModeChangingRef.current = false;
      }, 1100); // Slightly longer than animation duration (1000ms)
    }

    prevViewModeRef.current = viewMode;
    prevLayoutRef.current = currentLayout;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentLayout, startTableAnimation, visibleTables]);

  // Recalculate layout when category selection changes
  const prevSelectedCategoriesRef = useRef<Set<string>>(selectedCategories);
  const prevVisibleTablesLengthRef = useRef<number>(visibleTables.length);
  const isInitialCategoryLoadRef = useRef(true);
  useEffect(() => {
    // Skip on initial load
    if (isInitialCategoryLoadRef.current) {
      isInitialCategoryLoadRef.current = false;
      prevSelectedCategoriesRef.current = new Set(selectedCategories);
      prevVisibleTablesLengthRef.current = visibleTables.length;
      return;
    }

    // Don't recalculate if layout is being changed (it will be handled by handleSchemaChange)
    if (isLayoutChangingRef.current) {
      prevSelectedCategoriesRef.current = new Set(selectedCategories);
      prevVisibleTablesLengthRef.current = visibleTables.length;
      return;
    }

    // Don't recalculate if view mode is changing (it will handle layout recalculation)
    if (isViewModeChangingRef.current) {
      prevSelectedCategoriesRef.current = new Set(selectedCategories);
      prevVisibleTablesLengthRef.current = visibleTables.length;
      return;
    }

    // Check if categories changed
    const categoriesChanged =
      prevSelectedCategoriesRef.current.size !== selectedCategories.size ||
      Array.from(prevSelectedCategoriesRef.current).some(
        (cat) => !selectedCategories.has(cat)
      ) ||
      Array.from(selectedCategories).some(
        (cat) => !prevSelectedCategoriesRef.current.has(cat)
      );

    // Check if visible tables changed (due to category filtering)
    const visibleTablesChanged =
      prevVisibleTablesLengthRef.current !== visibleTables.length;

    // Recalculate layout if categories changed or visible tables changed
    // Only proceed if there are visible tables to layout
    if (
      (categoriesChanged || visibleTablesChanged) &&
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

    prevSelectedCategoriesRef.current = new Set(selectedCategories);
    prevVisibleTablesLengthRef.current = visibleTables.length;
  }, [
    selectedCategories,
    visibleTables,
    currentLayout,
    viewMode,
    startTableAnimation,
    setCurrentSchema,
  ]);

  const handleLayoutChange = useCallback((layout: LayoutType) => {
    isLayoutChangingRef.current = true;
    setCurrentLayout(layout);
    // The layout will be applied by ViewControls via handleSchemaChange
  }, []);

  return {
    currentLayout,
    viewMode,
    setCurrentLayout,
    setViewMode,
    handleLayoutChange,
    isLayoutChangingRef,
    isViewModeChangingRef,
  };
}
