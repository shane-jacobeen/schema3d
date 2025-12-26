import {
  ChevronDown,
  Globe,
  Network,
  GitBranch,
  Pencil,
  Plus,
  type LucideIcon,
} from "lucide-react";
import type { DatabaseSchema } from "@/shared/types/schema";
import { Card } from "@/shared/ui-components/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/ui-components/toggle-group";
import { CustomToggleGroupItem } from "@/shared/ui-components/custom-toggle-group-item";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui-components/collapsible";
import { useMemo, useState, useCallback } from "react";
import { applyLayoutToSchema } from "@/visualizer/state/utils/schema-utils";
import { CategoryEditDialog } from "@/visualizer/ui/category-edit-dialog";
import { Button } from "@/shared/ui-components/button";

export type LayoutType = "force" | "hierarchical" | "circular";

interface ViewControlsProps {
  schema: DatabaseSchema;
  onSchemaChange: (schema: DatabaseSchema) => void;
  onCategoryUpdate?: (schema: DatabaseSchema) => void;
  currentLayout?: LayoutType;
  onLayoutChange?: (layout: LayoutType) => void;
  viewMode?: "2D" | "3D";
  onViewModeChange?: (mode: "2D" | "3D") => void;
  selectedCategories?: Set<string>;
  onCategoryToggle?: (category: string) => void;
}

interface LayoutButtonProps {
  value: LayoutType;
  icon: LucideIcon;
  text: string;
  ariaLabel: string;
  hoveredButton: LayoutType | null;
  currentLayout: LayoutType;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function LayoutButton({
  value,
  icon: Icon,
  text,
  ariaLabel,
  hoveredButton,
  currentLayout,
  onMouseEnter,
  onMouseLeave,
}: LayoutButtonProps) {
  const isExpanded =
    hoveredButton === value || (!hoveredButton && currentLayout === value);

  return (
    <ToggleGroupItem
      value={value}
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`!min-w-0 ${
        isExpanded ? "!w-24 sm:!w-28" : "w-7 sm:w-9"
      } text-xs sm:text-sm h-7 sm:h-9 justify-start items-center transition-all duration-200 border-slate-600/50 data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 data-[state=on]:border-blue-500 relative`}
    >
      <div className="absolute left-0 flex items-center justify-center w-7 sm:w-9 h-full">
        <Icon size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
      </div>
      <span
        className={`${
          isExpanded ? "opacity-100" : "opacity-0 w-0"
        } transition-all duration-200 whitespace-nowrap overflow-hidden ml-6 sm:ml-8`}
      >
        {text}
      </span>
    </ToggleGroupItem>
  );
}

export function ViewControls({
  schema,
  onSchemaChange,
  onCategoryUpdate,
  currentLayout = "force",
  onLayoutChange,
  viewMode = "2D",
  onViewModeChange,
  selectedCategories,
  onCategoryToggle,
}: ViewControlsProps) {
  // Default to open on large screens, collapsed on mobile
  // Initialize based on window width if available, otherwise default to false (mobile-first)
  const [isLegendOpen, setIsLegendOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // sm breakpoint
    }
    return false;
  });

  const [hoveredButton, setHoveredButton] = useState<LayoutType | null>(null);
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

  const applyLayout = useCallback(
    (type: LayoutType) => {
      // Use current props to avoid stale closures
      const updatedSchema = applyLayoutToSchema(schema, type, viewMode);

      // Set the layout change flag before calling onSchemaChange
      // This ensures handleSchemaChange knows the layout is already applied
      if (onLayoutChange) {
        onLayoutChange(type);
      }
      onSchemaChange(updatedSchema);
    },
    [schema, viewMode, onLayoutChange, onSchemaChange]
  );

  return (
    <div className="absolute bottom-safe-bottom left-2 sm:bottom-safe-bottom-lg sm:left-4">
      <Card className="bg-slate-900/70 border-slate-700 text-white backdrop-blur-sm p-2 sm:p-4 min-w-[164px] sm:min-w-[200px]">
        {/* Legend section - collapsible */}
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

        {/* View Mode and Layout - always visible */}
        <div className="border-t border-slate-700 pt-2 sm:pt-3 mt-2 sm:mt-3">
          <p className="text-xs text-slate-400 mb-1 sm:mb-2">View Mode:</p>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value: string | undefined) => {
              if (value && onViewModeChange) {
                onViewModeChange(value as "2D" | "3D");
              }
            }}
            className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3"
            variant="outline"
            size="sm"
          >
            <CustomToggleGroupItem value="2D" aria-label="2D View">
              2D
            </CustomToggleGroupItem>
            <CustomToggleGroupItem value="3D" aria-label="3D View">
              3D
            </CustomToggleGroupItem>
          </ToggleGroup>
          <p className="text-xs text-slate-400 mb-1 sm:mb-2">
            Layout Algorithm:
          </p>
          <ToggleGroup
            type="single"
            value={currentLayout}
            onValueChange={(value: string | undefined) => {
              if (value) {
                applyLayout(value as LayoutType);
              }
            }}
            className="flex gap-1.5 sm:gap-2 w-[164px] sm:w-[200px]"
            variant="outline"
            size="sm"
          >
            <LayoutButton
              value="force"
              icon={GitBranch}
              text="Force"
              ariaLabel="Force-Directed Layout"
              hoveredButton={hoveredButton}
              currentLayout={currentLayout}
              onMouseEnter={() => setHoveredButton("force")}
              onMouseLeave={() => setHoveredButton(null)}
            />
            <LayoutButton
              value="hierarchical"
              icon={Network}
              text="Hierarchy"
              ariaLabel="Hierarchical Layout"
              hoveredButton={hoveredButton}
              currentLayout={currentLayout}
              onMouseEnter={() => setHoveredButton("hierarchical")}
              onMouseLeave={() => setHoveredButton(null)}
            />
            <LayoutButton
              value="circular"
              icon={Globe}
              text="Circular"
              ariaLabel="Circular Layout"
              hoveredButton={hoveredButton}
              currentLayout={currentLayout}
              onMouseEnter={() => setHoveredButton("circular")}
              onMouseLeave={() => setHoveredButton(null)}
            />
          </ToggleGroup>
        </div>
        <div className="border-t border-slate-700 pt-1 sm:pt-2 mt-1 sm:mt-2">
          <p className="text-xs text-slate-500">Click tables for details</p>
          <p className="text-xs text-slate-500">Long press to center view</p>
          <p className="text-xs text-slate-500 hidden sm:block">
            Drag to rotate, scroll to zoom
          </p>
        </div>
      </Card>

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
          onDelete={(categoryName) => {
            // Validate schema before updating
            if (!schema || !schema.tables || !Array.isArray(schema.tables)) {
              console.error("Invalid schema in category delete:", schema);
              return;
            }

            // Find the default "General" color or create one
            const COLOR_PALETTE = [
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

            // Check if "General" category exists and get its color
            const generalTable = schema.tables.find(
              (t) => t.category === "General"
            );
            let generalColor = generalTable?.color;

            // If no General category exists, assign a new color
            if (!generalColor) {
              const usedColors = new Set(
                schema.tables.map((table) => table.color)
              );
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
                const originalTable = schema.tables.find(
                  (t) => t.name === table.name
                );
                if (originalTable) {
                  return {
                    ...originalTable,
                    category: table.category,
                    color: table.color,
                    columns: [...originalTable.columns],
                    position: [...originalTable.position] as [
                      number,
                      number,
                      number,
                    ],
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
          }}
          onSave={(categoryName, tableNames, categoryColor) => {
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
              existingCategoryColorMap.set(
                capitalizedCategoryName,
                categoryColor
              );
              // If category was renamed, remove the old category's color mapping
              if (
                !isNewCategory &&
                editingCategory !== capitalizedCategoryName
              ) {
                existingCategoryColorMap.delete(editingCategory);
              }
            } else {
              // Assign color to new category if it doesn't exist
              const COLOR_PALETTE = [
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

              if (
                isNewCategory &&
                !existingCategoryColorMap.has(capitalizedCategoryName)
              ) {
                // Assign a color from the palette that's not already used
                const usedColors = new Set(existingCategoryColorMap.values());
                let newColor = COLOR_PALETTE.find(
                  (color) => !usedColors.has(color)
                );
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
                const oldColor = existingCategoryColorMap.get(editingCategory);
                if (oldColor) {
                  existingCategoryColorMap.set(
                    capitalizedCategoryName,
                    oldColor
                  );
                  existingCategoryColorMap.delete(editingCategory);
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

            // Use the category-to-color map we built earlier
            // (it's already been updated with the new category color if needed)

            // Preserve all table properties including positions
            // Create new table objects to ensure React detects the change
            const updatedSchema: DatabaseSchema = {
              format: schema.format,
              name: schema.name,
              tables: updatedTables.map((table) => {
                // Find the original table to preserve all properties
                const originalTable = schema.tables.find(
                  (t) => t.name === table.name
                );
                if (originalTable) {
                  // Get the color for the new category from the stable map
                  const newColor = existingCategoryColorMap.get(table.category);
                  if (!newColor) {
                    console.error(
                      `No color found for category: ${table.category}`
                    );
                  }
                  // Create a new object to ensure React detects the change
                  return {
                    ...originalTable,
                    category: table.category,
                    color: newColor || originalTable.color, // Update color based on new category
                    // Ensure all properties are copied
                    columns: [...originalTable.columns],
                    position: [...originalTable.position] as [
                      number,
                      number,
                      number,
                    ],
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
          }}
        />
      )}
    </div>
  );
}
