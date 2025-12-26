import { useState, useEffect, useCallback, startTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui-components/dialog";
import { Button } from "@/shared/ui-components/button";
import { Input } from "@/shared/ui-components/input";
import { Label } from "@/shared/ui-components/label";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { DatabaseSchema, Table } from "@/shared/types/schema";

interface CategoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  schema: DatabaseSchema;
  onSave: (
    categoryName: string,
    tableNames: Set<string>,
    color?: string
  ) => void;
}

export function CategoryEditDialog({
  open,
  onOpenChange,
  category,
  schema,
  onSave,
}: CategoryEditDialogProps) {
  const [categoryName, setCategoryName] = useState(category);
  const [categoryColor, setCategoryColor] = useState("#3b82f6");
  const [selectedInCategory, setSelectedInCategory] = useState<Set<string>>(
    new Set()
  );
  const [selectedNotInCategory, setSelectedNotInCategory] = useState<
    Set<string>
  >(new Set());

  // Track tables in category and not in category with local state for editing
  const [tablesInCategory, setTablesInCategory] = useState<Table[]>([]);
  const [tablesNotInCategory, setTablesNotInCategory] = useState<Table[]>([]);

  // Initialize tables when dialog opens or category changes
  useEffect(() => {
    if (open) {
      startTransition(() => {
        if (category === "new") {
          // For new category, all tables are available, none are in category
          const allTables = [...schema.tables].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setTablesInCategory([]);
          setTablesNotInCategory(allTables);
          setCategoryName("");

          // Find an unused color from the palette
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

          // Get all colors currently in use
          const usedColors = new Set(schema.tables.map((table) => table.color));

          // Find first unused color or cycle through palette
          const unusedColor =
            COLOR_PALETTE.find((color) => !usedColors.has(color)) ||
            COLOR_PALETTE[usedColors.size % COLOR_PALETTE.length]!;

          setCategoryColor(unusedColor);
        } else {
          // For existing category
          const inCategory: Table[] = [];
          const notInCategory: Table[] = [];
          let existingColor = "#3b82f6"; // Default color

          schema.tables.forEach((table) => {
            if (table.category === category) {
              inCategory.push(table);
              // Get the color from the first table in this category
              if (inCategory.length === 1) {
                existingColor = table.color;
              }
            } else {
              notInCategory.push(table);
            }
          });

          setTablesInCategory(
            inCategory.sort((a, b) => a.name.localeCompare(b.name))
          );
          setTablesNotInCategory(
            notInCategory.sort((a, b) => a.name.localeCompare(b.name))
          );
          setCategoryName(category);
          setCategoryColor(existingColor);
        }
        // Reset selections when dialog opens
        setSelectedInCategory(new Set());
        setSelectedNotInCategory(new Set());
      });
    }
  }, [open, schema, category]);

  const handleMoveToCategory = useCallback(() => {
    if (selectedNotInCategory.size === 0) return;

    // Move selected tables to category
    const tablesToMove = tablesNotInCategory.filter((t) =>
      selectedNotInCategory.has(t.name)
    );
    const remainingNotInCategory = tablesNotInCategory.filter(
      (t) => !selectedNotInCategory.has(t.name)
    );

    setTablesInCategory((prev) =>
      [...prev, ...tablesToMove].sort((a, b) => a.name.localeCompare(b.name))
    );
    setTablesNotInCategory(
      remainingNotInCategory.sort((a, b) => a.name.localeCompare(b.name))
    );
    setSelectedNotInCategory(new Set());
  }, [selectedNotInCategory, tablesNotInCategory]);

  const handleMoveFromCategory = useCallback(() => {
    if (selectedInCategory.size === 0) return;

    // Move selected tables out of category
    const tablesToRemove = tablesInCategory.filter((t) =>
      selectedInCategory.has(t.name)
    );
    const remainingInCategory = tablesInCategory.filter(
      (t) => !selectedInCategory.has(t.name)
    );

    setTablesNotInCategory((prev) =>
      [...prev, ...tablesToRemove].sort((a, b) => a.name.localeCompare(b.name))
    );
    setTablesInCategory(
      remainingInCategory.sort((a, b) => a.name.localeCompare(b.name))
    );
    setSelectedInCategory(new Set());
  }, [selectedInCategory, tablesInCategory]);

  const handleSave = useCallback(() => {
    if (!categoryName.trim()) {
      // Don't save if category name is empty
      return;
    }

    const tableNames = new Set(tablesInCategory.map((t) => t.name));
    onSave(categoryName.trim(), tableNames, categoryColor);
    onOpenChange(false);
  }, [categoryName, tablesInCategory, categoryColor, onSave, onOpenChange]);

  const toggleInCategory = useCallback((tableName: string) => {
    setSelectedInCategory((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  }, []);

  const toggleNotInCategory = useCallback((tableName: string) => {
    setSelectedNotInCategory((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Category</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-500/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-blue-500/70 [scrollbar-width:thin] [scrollbar-color:rgb(59,130,246,0.5)_transparent]">
          {/* Category Name and Color Picker - same row */}
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-name" className="text-slate-300">
                Category Name
              </Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                placeholder="Enter category name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-color" className="text-slate-300">
                Color
              </Label>
              <div>
                <input
                  type="color"
                  id="category-color"
                  value={categoryColor}
                  onChange={(e) => setCategoryColor(e.target.value)}
                  className="h-10 w-16 rounded-md border border-slate-700 bg-slate-800 cursor-pointer"
                  title="Select category color"
                />
              </div>
            </div>
          </div>

          {/* Transfer List */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tables Not In Category */}
            <div className="space-y-2">
              <Label className="text-slate-300">
                Available Tables ({tablesNotInCategory.length})
              </Label>
              <div className="border border-slate-700 rounded-md bg-slate-800/50 h-64 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-500/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-blue-500/70 [scrollbar-width:thin] [scrollbar-color:rgb(59,130,246,0.5)_transparent]">
                {tablesNotInCategory.length === 0 ? (
                  <p className="text-slate-500 text-sm p-4 text-center">
                    No tables available
                  </p>
                ) : (
                  <div className="p-2 space-y-1">
                    {tablesNotInCategory.map((table) => (
                      <div
                        key={table.name}
                        className={`p-2 rounded cursor-pointer text-sm transition-colors ${
                          selectedNotInCategory.has(table.name)
                            ? "bg-blue-600/30 border border-blue-500"
                            : "bg-slate-700/50 hover:bg-slate-700 border border-transparent"
                        }`}
                        onClick={() => toggleNotInCategory(table.name)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200">{table.name}</span>
                          <span className="text-xs text-slate-400">
                            {table.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleMoveToCategory}
                disabled={selectedNotInCategory.size === 0}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <ChevronRight className="w-4 h-4 mr-1" />
                Add to <strong>{categoryName || "Category"}</strong>
              </Button>
            </div>

            {/* Tables In Category */}
            <div className="space-y-2">
              <Label className="text-slate-300">
                Tables in <strong>{categoryName || "Category"}</strong> (
                {tablesInCategory.length})
              </Label>
              <div className="border border-slate-700 rounded-md bg-slate-800/50 h-64 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-500/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-blue-500/70 [scrollbar-width:thin] [scrollbar-color:rgb(59,130,246,0.5)_transparent]">
                {tablesInCategory.length === 0 ? (
                  <p className="text-slate-500 text-sm p-4 text-center">
                    No tables in this category
                  </p>
                ) : (
                  <div className="p-2 space-y-1">
                    {tablesInCategory.map((table) => (
                      <div
                        key={table.name}
                        className={`p-2 rounded cursor-pointer text-sm transition-colors ${
                          selectedInCategory.has(table.name)
                            ? "bg-blue-600/30 border border-blue-500"
                            : "bg-slate-700/50 hover:bg-slate-700 border border-transparent"
                        }`}
                        onClick={() => toggleInCategory(table.name)}
                      >
                        <span className="text-slate-200">{table.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleMoveFromCategory}
                disabled={selectedInCategory.size === 0}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Remove from <strong>{categoryName || "Category"}</strong>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={!categoryName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
