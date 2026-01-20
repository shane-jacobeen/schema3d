/**
 * Initial state configuration for the visualization.
 * Centralizes default values to ensure consistency between
 * the initial schema state and UI controls.
 */

import type { DatabaseSchema } from "@/shared/types/schema";
import { getRetailerSchema } from "@/schemas/utils/load-schemas";
import { applyLayoutToSchema } from "@/visualizer/state/utils/schema-utils";
import { parseSchema } from "@/schemas/parsers";
import { getSchemaFromHash } from "@/shared/utils/url-state";

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
 * Checks URL for encoded schema first, otherwise loads default.
 * This ensures the visualization matches the UI control defaults on first load.
 */
export function getInitialSchema(): DatabaseSchema {
  // Check if there's a schema encoded in the URL hash
  try {
    const urlData = getSchemaFromHash();

    if (urlData) {
      const { schemaText, format } = urlData;

      // Attempt to parse the schema from URL
      const parsedSchema = parseSchema(
        schemaText,
        format === "auto" ? undefined : format
      );

      if (parsedSchema) {
        // Apply default layout to URL schema
        return applyLayoutToSchema(
          parsedSchema,
          DEFAULT_LAYOUT,
          DEFAULT_VIEW_MODE
        );
      }
      // If parsing fails, fall through to default schema
      console.warn("Failed to parse schema from URL, using default schema");
    }
  } catch (error) {
    console.error("Error loading schema from URL:", error);
    // Fall through to default schema
  }

  // Default: load retailer schema
  const baseSchema = getDefaultBaseSchema();
  return applyLayoutToSchema(baseSchema, DEFAULT_LAYOUT, DEFAULT_VIEW_MODE);
}
