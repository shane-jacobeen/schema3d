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
import {
  deleteCategoryFromSchema,
  saveCategoryToSchema,
} from "@/visualizer/state/utils/category-state-utils";

interface CategoryLegendProps {
  schema: DatabaseSchema;
  selectedCategories?: Set<string>;
  onCategoryToggle?: (category: string) => void;
  onSchemaChange: (schema: DatabaseSchema) => void;
}

export function CategoryLegend({
  schema,
  selectedCategories,
  onCategoryToggle,
  onSchemaChange,
}: CategoryLegendProps) {
  const [isLegendOpen, setIsLegendOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
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

  const closeEditor = () => {
    setEditingCategory(null);
    setIsNewCategory(false);
  };

  const handleDeleteCategory = (categoryName: string) => {
    const updatedSchema = deleteCategoryFromSchema(schema, categoryName);
    if (!updatedSchema) {
      console.error("Invalid schema in category delete:", schema);
      return;
    }
    onSchemaChange(updatedSchema);
    closeEditor();
  };

  const handleSaveCategory = (
    categoryName: string,
    tableNames: Set<string>,
    categoryColor?: string
  ) => {
    const updatedSchema = saveCategoryToSchema(schema, {
      categoryName,
      tableNames,
      categoryColor,
      editingCategory,
      isNewCategory,
    });
    if (!updatedSchema) {
      console.error("Invalid schema in category edit onSave:", schema);
      return;
    }
    onSchemaChange(updatedSchema);
    closeEditor();
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
                  className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
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

      {editingCategory && (
        <CategoryEditDialog
          open={!!editingCategory}
          onOpenChange={(open) => {
            if (!open) {
              closeEditor();
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
