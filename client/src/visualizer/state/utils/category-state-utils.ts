import type { DatabaseSchema } from "@/shared/types/schema";
import { getRetailerSchema } from "@/schemas/utils/load-schemas";
import { findUnusedColor } from "@/shared/utils/category-colors";

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

function capitalizeCategoryName(name: string): string {
  const trimmed = name.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function cloneTablesWithCategory(
  schema: DatabaseSchema,
  getCategoryAndColor: (table: DatabaseSchema["tables"][number]) => {
    category: string;
    color: string;
  }
): DatabaseSchema {
  return {
    format: schema.format,
    name: schema.name,
    tables: schema.tables.map((table) => {
      const { category, color } = getCategoryAndColor(table);
      return {
        ...table,
        category,
        color,
        columns: [...table.columns],
        position: [...table.position] as [number, number, number],
      };
    }),
  };
}

/**
 * Move all tables in a category to General and remove the category.
 */
export function deleteCategoryFromSchema(
  schema: DatabaseSchema,
  categoryName: string
): DatabaseSchema | null {
  if (!schema?.tables || !Array.isArray(schema.tables)) {
    return null;
  }

  const generalTable = schema.tables.find((t) => t.category === "General");
  const generalColor =
    generalTable?.color ??
    findUnusedColor(new Set(schema.tables.map((table) => table.color)));

  return cloneTablesWithCategory(schema, (table) => {
    if (table.category === categoryName) {
      return { category: "General", color: generalColor };
    }
    return { category: table.category, color: table.color };
  });
}

export interface SaveCategoryOptions {
  categoryName: string;
  tableNames: Set<string>;
  categoryColor?: string;
  /** Existing category being edited; omit / "new" for create. */
  editingCategory: string | null;
  isNewCategory: boolean;
}

/**
 * Create or update a category assignment and colors on the schema.
 */
export function saveCategoryToSchema(
  schema: DatabaseSchema,
  options: SaveCategoryOptions
): DatabaseSchema | null {
  if (!schema?.tables || !Array.isArray(schema.tables)) {
    return null;
  }

  const {
    categoryName,
    tableNames,
    categoryColor,
    editingCategory,
    isNewCategory,
  } = options;

  const capitalizedCategoryName = capitalizeCategoryName(categoryName);

  const existingCategoryColorMap = new Map<string, string>();
  schema.tables.forEach((table) => {
    if (!existingCategoryColorMap.has(table.category)) {
      existingCategoryColorMap.set(table.category, table.color);
    }
  });

  if (categoryColor) {
    existingCategoryColorMap.set(capitalizedCategoryName, categoryColor);
    if (!isNewCategory && editingCategory !== capitalizedCategoryName) {
      existingCategoryColorMap.delete(editingCategory!);
    }
  } else if (
    isNewCategory &&
    !existingCategoryColorMap.has(capitalizedCategoryName)
  ) {
    existingCategoryColorMap.set(
      capitalizedCategoryName,
      findUnusedColor(new Set(existingCategoryColorMap.values()))
    );
  } else if (!isNewCategory && editingCategory !== capitalizedCategoryName) {
    const oldColor = existingCategoryColorMap.get(editingCategory!);
    if (oldColor) {
      existingCategoryColorMap.set(capitalizedCategoryName, oldColor);
      existingCategoryColorMap.delete(editingCategory!);
    }
  }

  const categoryByTable = new Map<string, string>();
  schema.tables.forEach((table) => {
    if (isNewCategory) {
      categoryByTable.set(
        table.name,
        tableNames.has(table.name) ? capitalizedCategoryName : table.category
      );
      return;
    }

    const wasInCategory = table.category === editingCategory;
    const shouldBeInCategory = tableNames.has(table.name);

    if (shouldBeInCategory) {
      categoryByTable.set(table.name, capitalizedCategoryName);
    } else if (wasInCategory) {
      categoryByTable.set(table.name, "General");
    } else {
      categoryByTable.set(table.name, table.category);
    }
  });

  if (
    Array.from(categoryByTable.values()).includes("General") &&
    !existingCategoryColorMap.has("General")
  ) {
    existingCategoryColorMap.set(
      "General",
      findUnusedColor(new Set(existingCategoryColorMap.values()))
    );
  }

  const updated = cloneTablesWithCategory(schema, (table) => {
    const category = categoryByTable.get(table.name) ?? table.category;
    const color = existingCategoryColorMap.get(category) ?? table.color;
    return { category, color };
  });

  if (updated.tables.length === 0) {
    return null;
  }

  return updated;
}
