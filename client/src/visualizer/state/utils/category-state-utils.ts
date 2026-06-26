import type { DatabaseSchema } from "@/shared/types/schema";
import { getRetailerSchema } from "@/schemas/utils/load-schemas";

export function initializeCategories(schema: DatabaseSchema): Set<string> {
  const categories = new Set<string>();
  schema.tables.forEach((table) => {
    categories.add(table.category);
  });
  return categories;
}

export function getInitialCategories(): Set<string> {
  return initializeCategories(getRetailerSchema());
}

export function updateCategoriesForSchema(
  currentSchema: DatabaseSchema,
  prevCategories: Set<string>,
  prevSchema?: DatabaseSchema
): Set<string> {
  const categories = new Set<string>();
  currentSchema.tables.forEach((table) => {
    categories.add(table.category);
  });

  if (prevSchema) {
    const categoryMapping = new Map<string, string>();

    prevCategories.forEach((oldCat) => {
      if (!categories.has(oldCat)) {
        const oldCatTables = prevSchema.tables
          .filter((t) => t.category === oldCat)
          .map((t) => t.name);

        if (oldCatTables.length > 0) {
          const newCat = currentSchema.tables.find((t) =>
            oldCatTables.includes(t.name)
          )?.category;

          if (newCat && newCat !== oldCat) {
            categoryMapping.set(oldCat, newCat);
          }
        }
      }
    });

    const next = new Set<string>();
    prevCategories.forEach((cat) => {
      if (categories.has(cat)) {
        next.add(cat);
      } else if (categoryMapping.has(cat)) {
        next.add(categoryMapping.get(cat)!);
      }
    });

    categories.forEach((cat) => {
      if (!prevCategories.has(cat)) {
        const wasRenamed = Array.from(categoryMapping.values()).includes(cat);
        if (!wasRenamed) {
          next.add(cat);
        }
      }
    });

    if (next.size === 0) {
      return categories;
    }
    return next;
  }

  const next = new Set<string>();
  categories.forEach((cat) => {
    if (prevCategories.has(cat) || prevCategories.size === 0) {
      next.add(cat);
    }
  });
  if (next.size === 0) {
    return categories;
  }
  return next;
}
