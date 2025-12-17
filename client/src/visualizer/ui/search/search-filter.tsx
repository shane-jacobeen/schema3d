import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/shared/ui-components/input";
import { Button } from "@/shared/ui-components/button";
import type { Table } from "@/shared/types/schema";

interface SearchFilterProps {
  tables: Table[];
  onFilter: (filteredTables: Set<string>, relatedTables: Set<string>) => void;
  onExpandedChange?: (isExpanded: boolean) => void;
}

export function SearchFilter({
  tables,
  onFilter,
  onExpandedChange,
}: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = useCallback(
    (expanded: boolean) => {
      setIsExpanded(expanded);
      onExpandedChange?.(expanded);
    },
    [onExpandedChange]
  );

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);

      if (!term.trim()) {
        onFilter(new Set(), new Set());
        return;
      }

      const lowerTerm = term.toLowerCase();
      const matchedTables = new Set<string>();
      const relatedTables = new Set<string>();

      tables.forEach((table) => {
        const nameMatch = table.name.toLowerCase().includes(lowerTerm);
        const columnMatch = table.columns.some((col) =>
          col.name.toLowerCase().includes(lowerTerm)
        );

        if (nameMatch || columnMatch) {
          matchedTables.add(table.name);

          table.columns.forEach((col) => {
            if (col.isForeignKey && col.references) {
              relatedTables.add(col.references.table);
            }
          });

          tables.forEach((otherTable) => {
            otherTable.columns.forEach((col) => {
              if (col.isForeignKey && col.references?.table === table.name) {
                relatedTables.add(otherTable.name);
              }
            });
          });
        }
      });

      onFilter(matchedTables, relatedTables);
    },
    [tables, onFilter]
  );

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    onFilter(new Set(), new Set());
    handleExpand(false);
  }, [onFilter, handleExpand]);

  return (
    <>
      {/* Mobile: Icon button (always visible) */}
      <div className="sm:hidden">
        {!isExpanded && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleExpand(true)}
            className="rounded-full bg-slate-900/95 border-slate-700 text-white hover:bg-slate-800 hover:text-blue-400 backdrop-blur-sm w-9 h-9 sm:w-10 sm:h-10"
            aria-label="Open search"
          >
            <Search size={18} />
          </Button>
        )}
      </div>

      {/* Mobile: Expanded search overlay */}
      {isExpanded && (
        <div className="sm:hidden fixed top-2 right-2 z-50 bg-slate-900/98 border border-slate-900/0 backdrop-blur-sm p-3 rounded-[50px] shadow-lg w-[calc(100vw-1rem)]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search tables or columns..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10 bg-slate-800 border-none focus:border-none focus:ring-0 text-white placeholder:text-slate-500 text-sm h-10 w-full rounded-[50px]"
              autoFocus
            />
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Close search"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop: Full search bar */}
      <div className="hidden sm:block relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search tables or columns..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-base h-10 rounded-[50px]"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </>
  );
}
