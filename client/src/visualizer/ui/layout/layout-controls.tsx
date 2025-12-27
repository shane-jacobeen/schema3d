import { Globe, Network, GitBranch, type LucideIcon } from "lucide-react";
import type { DatabaseSchema } from "@/shared/types/schema";
import { Card } from "@/shared/ui-components/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/ui-components/toggle-group";
import { CustomToggleGroupItem } from "@/shared/ui-components/custom-toggle-group-item";
import { useState, useCallback } from "react";
import { applyLayoutToSchema } from "@/visualizer/state/utils/schema-utils";
import { CategoryLegend } from "@/visualizer/ui/layout/category-legend";

export type LayoutType = "force" | "hierarchical" | "circular";

interface LayoutControlsProps {
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

export function LayoutControls({
  schema,
  onSchemaChange,
  onCategoryUpdate,
  currentLayout = "force",
  onLayoutChange,
  viewMode = "2D",
  onViewModeChange,
  selectedCategories,
  onCategoryToggle,
}: LayoutControlsProps) {
  const [hoveredButton, setHoveredButton] = useState<LayoutType | null>(null);

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
        <CategoryLegend
          schema={schema}
          selectedCategories={selectedCategories}
          onCategoryToggle={onCategoryToggle}
          onSchemaChange={onSchemaChange}
          onCategoryUpdate={onCategoryUpdate}
        />

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
    </div>
  );
}
