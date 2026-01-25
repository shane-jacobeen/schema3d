import { useMemo } from "react";
import type { SharedViewState, DatabaseSchema } from "@/shared/types/schema";
import type { LayoutType } from "@/visualizer/state/initial-state";

/**
 * Hook to collect current view state for sharing via URL.
 * Gathers category filters, layout algorithm, view mode, and custom categories.
 *
 * @param selectedCategories - Currently selected category filters
 * @param currentLayout - Current layout algorithm
 * @param viewMode - Current view mode (2D or 3D)
 * @param schema - Current database schema (to extract category definitions)
 * @returns SharedViewState object ready for encoding
 */
export function useCollectViewState(
  selectedCategories: Set<string>,
  currentLayout: LayoutType,
  viewMode: "2D" | "3D",
  schema: DatabaseSchema | null
): SharedViewState {
  return useMemo(() => {
    // Extract unique categories with their colors from the schema
    const categoryMap = new Map<string, string>();
    const tableCategoryMap: Record<string, string> = {};

    if (schema?.tables) {
      schema.tables.forEach((table) => {
        if (!categoryMap.has(table.category)) {
          categoryMap.set(table.category, table.color);
        }
        // Store each table's category assignment
        tableCategoryMap[table.name] = table.category;
      });
    }

    const categories = Array.from(categoryMap.entries())
      .map(([name, color]) => ({
        name,
        color,
        // Mark selected as true or false to preserve visibility state
        selected: selectedCategories.has(name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort for consistency

    return {
      layoutAlgorithm: currentLayout,
      viewMode,
      categories: categories.length > 0 ? categories : undefined,
      tableCategoryMap:
        Object.keys(tableCategoryMap).length > 0 ? tableCategoryMap : undefined,
    };
  }, [selectedCategories, currentLayout, viewMode, schema]);
}
