import type { DatabaseSchema } from "@/shared/types/schema";
import { getRetailerSchema } from "@/schemas/utils/load-schemas";

/**
 * Initialize selected categories with all categories from a schema
 */
export function initializeCategories(schema: DatabaseSchema): Set<string> {
  const categories = new Set<string>();
  schema.tables.forEach((table) => {
    categories.add(table.category);
  });
  return categories;
}

/**
 * Get initial categories from default schema
 */
export function getInitialCategories(): Set<string> {
  return initializeCategories(getRetailerSchema());
}

/**
 * Update selected categories when schema changes
 * Handles category renames by mapping old categories to new ones based on table membership
 */
export function updateCategoriesForSchema(
  currentSchema: DatabaseSchema,
  prevCategories: Set<string>,
  prevSchema?: DatabaseSchema
): Set<string> {
  const categories = new Set<string>();
  currentSchema.tables.forEach((table) => {
    categories.add(table.category);
  });

  // If we have the previous schema, try to map renamed categories
  if (prevSchema) {
    const categoryMapping = new Map<string, string>();

    // For each old category that's selected but doesn't exist in new schema
    prevCategories.forEach((oldCat) => {
      if (!categories.has(oldCat)) {
        // Find tables that were in this category
        const oldCatTables = prevSchema.tables
          .filter((t) => t.category === oldCat)
          .map((t) => t.name);

        if (oldCatTables.length > 0) {
          // Find what category these tables are in now
          const newCat = currentSchema.tables.find((t) =>
            oldCatTables.includes(t.name)
          )?.category;

          if (newCat && newCat !== oldCat) {
            categoryMapping.set(oldCat, newCat);
          }
        }
      }
    });

    // Build new selected categories set
    const next = new Set<string>();
    prevCategories.forEach((cat) => {
      if (categories.has(cat)) {
        // Category still exists
        next.add(cat);
      } else if (categoryMapping.has(cat)) {
        // Category was renamed
        next.add(categoryMapping.get(cat)!);
      }
    });

    // Add any new categories that weren't in the old schema
    categories.forEach((cat) => {
      if (!prevCategories.has(cat)) {
        // Check if this is a new category (not a rename)
        const wasRenamed = Array.from(categoryMapping.values()).includes(cat);
        if (!wasRenamed) {
          // New category - automatically select it so it appears in the legend
          next.add(cat);
        }
      }
    });

    // If no categories were selected before, select all
    if (next.size === 0) {
      return categories;
    }
    return next;
  }

  // Fallback: simple update without rename detection
  const next = new Set<string>();
  categories.forEach((cat) => {
    if (prevCategories.has(cat) || prevCategories.size === 0) {
      next.add(cat);
    }
  });
  // If no categories were selected before, select all
  if (next.size === 0) {
    return categories;
  }
  return next;
}
