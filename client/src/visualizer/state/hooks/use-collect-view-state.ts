import { useMemo } from "react";
import type { SharedViewState } from "@/shared/types/schema";
import type { LayoutType } from "@/visualizer/state/initial-state";

/**
 * Hook to collect current view state for sharing via URL.
 * Gathers category filters, layout algorithm, and view mode.
 *
 * @param selectedCategories - Currently selected category filters
 * @param currentLayout - Current layout algorithm
 * @param viewMode - Current view mode (2D or 3D)
 * @returns SharedViewState object ready for encoding
 */
export function useCollectViewState(
  selectedCategories: Set<string>,
  currentLayout: LayoutType,
  viewMode: "2D" | "3D"
): SharedViewState {
  return useMemo(() => {
    return {
      selectedCategories: Array.from(selectedCategories).sort(), // Sort for consistency
      layoutAlgorithm: currentLayout,
      viewMode,
    };
  }, [selectedCategories, currentLayout, viewMode]);
}
