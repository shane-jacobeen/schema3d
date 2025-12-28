/**
 * Initial state configuration for the visualization.
 * Centralizes default values to ensure consistency between
 * the initial schema state and UI controls.
 */

import type { DatabaseSchema } from "@/shared/types/schema";
import { getRetailerSchema } from "@/schemas/utils/load-schemas";
import { applyLayoutToSchema } from "@/visualizer/state/utils/schema-utils";

// ============================================
// Layout Algorithm Types
// ============================================

export type LayoutType = "force" | "hierarchical" | "circular";

// ============================================
// Default State Values
// ============================================

/**
 * The default layout algorithm used for positioning tables.
 * - "force": Physics-based force-directed layout
 * - "hierarchical": Layer-based dependency layout
 * - "circular": Tables arranged in a circle
 */
export const DEFAULT_LAYOUT: LayoutType = "force";

/**
 * The default view mode for the visualization.
 * - "2D": Flat layout with Y=0 for all tables
 * - "3D": Full 3D layout with vertical spread
 */
export const DEFAULT_VIEW_MODE: "2D" | "3D" = "3D";

/**
 * The default schema loader function.
 * Returns the Retailer schema as the initial sample schema.
 */
export const getDefaultBaseSchema = getRetailerSchema;

// ============================================
// Initial Schema State
// ============================================

/**
 * Get the initial schema with the default layout applied.
 * This ensures the visualization matches the UI control defaults on first load.
 */
export function getInitialSchema(): DatabaseSchema {
  const baseSchema = getDefaultBaseSchema();
  return applyLayoutToSchema(baseSchema, DEFAULT_LAYOUT, DEFAULT_VIEW_MODE);
}
