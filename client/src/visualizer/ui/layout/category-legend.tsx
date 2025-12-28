import { ChevronDown, Pencil, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import type { DatabaseSchema } from "@/shared/types/schema";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui-components/collapsible";
import { Button } from "@/shared/ui-components/button";
import { CategoryEditDialog } from "@/visualizer/ui/layout/category-edit-dialog";

// Color palette shared across category operations
export const COLOR_PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#ef4444", // Red
  "#14b8a6", // Teal
  "#a855f7", // Purple
  "#f43f5e", // Rose
  "#22d3ee", // Sky
  "#34d399", // Green
  "#fbbf24", // Yellow
];

interface CategoryLegendProps {
  schema: DatabaseSchema;
  selectedCategories?: Set<string>;
  onCategoryToggle?: (category: string) => void;
  onSchemaChange: (schema: DatabaseSchema) => void;
  onCategoryUpdate?: (schema: DatabaseSchema) => void;
}

export function CategoryLegend({
  schema,
  selectedCategories,
  onCategoryToggle,
  onSchemaChange,
  onCategoryUpdate,
}: CategoryLegendProps) {
  // Default to open on large screens, collapsed on mobile
  const [isLegendOpen, setIsLegendOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // sm breakpoint
    }
    return false;
  });

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, string>();
    schema.tables.forEach((table) => {
      if (!categoryMap.has(table.category)) {
        categoryMap.set(table.category, table.color);
      }
    });
    return Array.from(categoryMap.entries());
  }, [schema]);

  const handleDeleteCategory = (categoryName: string) => {
    // Validate schema before updating
    if (!schema || !schema.tables || !Array.isArray(schema.tables)) {
      console.error("Invalid schema in category delete:", schema);
      return;
    }

    // Check if "General" category exists and get its color
    const generalTable = schema.tables.find((t) => t.category === "General");
    let generalColor = generalTable?.color;

    // If no General category exists, assign a new color
    if (!generalColor) {
      const usedColors = new Set(schema.tables.map((table) => table.color));
      generalColor =
        COLOR_PALETTE.find((color) => !usedColors.has(color)) ||
        COLOR_PALETTE[usedColors.size % COLOR_PALETTE.length]!;
    }

    // Update tables: move deleted category's tables to "General"
    const updatedTables = schema.tables.map((table) => {
      if (table.category === categoryName) {
        return {
          ...table,
          category: "General",
          color: generalColor,
        };
      }
      return table;
    });

    const updatedSchema: DatabaseSchema = {
      format: schema.format,
      name: schema.name,
      tables: updatedTables.map((table) => {
        const originalTable = schema.tables.find((t) => t.name === table.name);
        if (originalTable) {
          return {
            ...originalTable,
            category: table.category,
            color: table.color,
            columns: [...originalTable.columns],
            position: [...originalTable.position] as [number, number, number],
          };
        }
        return table;
      }),
    };

    // Use onCategoryUpdate if available
    if (onCategoryUpdate) {
      onCategoryUpdate(updatedSchema);
    } else {
      onSchemaChange(updatedSchema);
    }
    setEditingCategory(null);
    setIsNewCategory(false);
  };

  const handleSaveCategory = (
    categoryName: string,
    tableNames: Set<string>,
    categoryColor?: string
  ) => {
    // Validate schema before updating
    if (!schema || !schema.tables || !Array.isArray(schema.tables)) {
      console.error("Invalid schema in category edit onSave:", schema);
      return;
    }

    // Capitalize the category name to match the format from guessCategory
    const capitalizedCategoryName =
      categoryName.trim().charAt(0).toUpperCase() +
      categoryName.trim().slice(1).toLowerCase();

    // Update schema with new category assignments
    // First, build the category-to-color map to ensure new categories get colors
    const existingCategoryColorMap = new Map<string, string>();
    schema.tables.forEach((table) => {
      if (!existingCategoryColorMap.has(table.category)) {
        existingCategoryColorMap.set(table.category, table.color);
      }
    });

    // Use the provided color if available, otherwise assign from palette
    if (categoryColor) {
      // Always use the provided color for the category being edited
      existingCategoryColorMap.set(capitalizedCategoryName, categoryColor);
      // If category was renamed, remove the old category's color mapping
      if (!isNewCategory && editingCategory !== capitalizedCategoryName) {
        existingCategoryColorMap.delete(editingCategory!);
      }
    } else {
      if (
        isNewCategory &&
        !existingCategoryColorMap.has(capitalizedCategoryName)
      ) {
        // Assign a color from the palette that's not already used
        const usedColors = new Set(existingCategoryColorMap.values());
        let newColor = COLOR_PALETTE.find((color) => !usedColors.has(color));
        if (!newColor) {
          // If all colors are used, cycle through the palette
          newColor =
            COLOR_PALETTE[
              existingCategoryColorMap.size % COLOR_PALETTE.length
            ]!;
        }
        existingCategoryColorMap.set(capitalizedCategoryName, newColor);
      } else if (
        !isNewCategory &&
        editingCategory !== capitalizedCategoryName
      ) {
        // Category was renamed - preserve the color if it exists
        const oldColor = existingCategoryColorMap.get(editingCategory!);
        if (oldColor) {
          existingCategoryColorMap.set(capitalizedCategoryName, oldColor);
          existingCategoryColorMap.delete(editingCategory!);
        }
      }
    }

    const updatedTables = schema.tables.map((table) => {
      if (isNewCategory) {
        // For new category, assign selected tables to new category
        if (tableNames.has(table.name)) {
          return {
            ...table,
            category: capitalizedCategoryName,
          };
        }
      } else {
        // For existing category
        const wasInCategory = table.category === editingCategory;
        const shouldBeInCategory = tableNames.has(table.name);

        if (shouldBeInCategory) {
          // Table should be in this category (possibly with new name)
          return {
            ...table,
            category: capitalizedCategoryName,
          };
        } else if (wasInCategory) {
          // Table was removed from this category - move to "General"
          return {
            ...table,
            category: "General",
          };
        }
      }
      return table;
    });

    // Ensure we have a valid schema structure
    if (updatedTables.length === 0) {
      console.error("No tables in updated schema");
      return;
    }

    // Preserve all table properties including positions
    // Create new table objects to ensure React detects the change
    const updatedSchema: DatabaseSchema = {
      format: schema.format,
      name: schema.name,
      tables: updatedTables.map((table) => {
        // Find the original table to preserve all properties
        const originalTable = schema.tables.find((t) => t.name === table.name);
        if (originalTable) {
          // Get the color for the new category from the stable map
          const newColor = existingCategoryColorMap.get(table.category);
          if (!newColor) {
            console.error(`No color found for category: ${table.category}`);
          }
          // Create a new object to ensure React detects the change
          return {
            ...originalTable,
            category: table.category,
            color: newColor || originalTable.color, // Update color based on new category
            // Ensure all properties are copied
            columns: [...originalTable.columns],
            position: [...originalTable.position] as [number, number, number],
          };
        }
        return table;
      }),
    };

    // Validate the schema before passing it
    if (!updatedSchema.tables || updatedSchema.tables.length === 0) {
      console.error("Invalid updated schema:", updatedSchema);
      return;
    }

    // Use onCategoryUpdate if available (direct update without animation)
    // Otherwise fall back to onSchemaChange (with animation)
    if (onCategoryUpdate) {
      onCategoryUpdate(updatedSchema);
    } else {
      onSchemaChange(updatedSchema);
    }
    setEditingCategory(null);
    setIsNewCategory(false);
  };

  return (
    <>
      <Collapsible open={isLegendOpen} onOpenChange={setIsLegendOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full mb-2 sm:mb-3 hover:opacity-80 transition-opacity cursor-pointer">
          <h3 className="text-xs sm:text-sm font-semibold">Legend</h3>
          <ChevronDown
            size={16}
            className={`sm:w-5 sm:h-5 text-slate-400 transition-transform duration-200 ${
              isLegendOpen ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-0.5 text-xs sm:text-sm mb-2 sm:mb-3">
          {categories.map(([category, color]) => {
            const isSelected =
              !selectedCategories || selectedCategories.has(category);
            return (
              <div
                key={category}
                className={`flex items-center gap-2 group ${
                  !isSelected ? "opacity-50" : ""
                }`}
              >
                <div
                  className={`flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => onCategoryToggle?.(category)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onCategoryToggle?.(category);
                    }
                  }}
                >
                  <div
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded border border-slate-600"
                    style={{
                      backgroundColor: isSelected ? color : "transparent",
                      borderColor: color,
                    }}
                  />
                  <span className="text-slate-300 truncate">{category}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(category);
                    setIsNewCategory(false);
                  }}
                  title="Edit category"
                >
                  <Pencil size={12} className="sm:w-3.5 sm:h-3.5" />
                </Button>
              </div>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => {
              setEditingCategory("new");
              setIsNewCategory(true);
            }}
          >
            <Plus size={14} className="mr-1" />
            Add New Category
          </Button>
          <p className="text-xs text-slate-500 pt-1 sm:pt-2">
            Click legend categories to filter
          </p>
        </CollapsibleContent>
      </Collapsible>

      {/* Category Edit Dialog */}
      {editingCategory && (
        <CategoryEditDialog
          open={!!editingCategory}
          onOpenChange={(open) => {
            if (!open) {
              setEditingCategory(null);
              setIsNewCategory(false);
            }
          }}
          category={isNewCategory ? "new" : editingCategory}
          schema={schema}
          onDelete={handleDeleteCategory}
          onSave={handleSaveCategory}
        />
      )}
    </>
  );
}
