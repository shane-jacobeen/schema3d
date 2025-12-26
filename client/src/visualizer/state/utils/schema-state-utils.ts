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
 * Only add new categories, don't remove existing ones unless they don't exist in new schema
 */
export function updateCategoriesForSchema(
  currentSchema: DatabaseSchema,
  prevCategories: Set<string>
): Set<string> {
  const categories = new Set<string>();
  currentSchema.tables.forEach((table) => {
    categories.add(table.category);
  });

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
