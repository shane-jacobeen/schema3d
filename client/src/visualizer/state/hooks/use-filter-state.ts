import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  startTransition,
} from "react";
import type { DatabaseSchema } from "@/shared/types/schema";
import {
  getInitialCategories,
  updateCategoriesForSchema,
} from "../utils/schema-state-utils";

interface UseFilterStateReturn {
  filteredTables: Set<string>;
  relatedTables: Set<string>;
  selectedCategories: Set<string>;
  visibleTables: DatabaseSchema["tables"];
  visibleTableNames: Set<string>;
  handleFilter: (matched: Set<string>, related: Set<string>) => void;
  handleCategoryToggle: (category: string) => void;
}

export function useFilterState(
  currentSchema: DatabaseSchema
): UseFilterStateReturn {
  const [filteredTables, setFilteredTables] = useState<Set<string>>(new Set());
  const [relatedTables, setRelatedTables] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] =
    useState<Set<string>>(getInitialCategories);

  const handleFilter = useCallback(
    (matched: Set<string>, related: Set<string>) => {
      setFilteredTables(matched);
      setRelatedTables(related);
    },
    []
  );

  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Update selected categories when schema changes
  useEffect(() => {
    startTransition(() => {
      setSelectedCategories((prev) =>
        updateCategoriesForSchema(currentSchema, prev)
      );
    });
  }, [currentSchema]);

  // Filter tables and relationships based on selected categories
  const visibleTables = useMemo(() => {
    return currentSchema.tables.filter((table) =>
      selectedCategories.has(table.category)
    );
  }, [currentSchema.tables, selectedCategories]);

  const visibleTableNames = useMemo(() => {
    return new Set(visibleTables.map((t) => t.name));
  }, [visibleTables]);

  return {
    filteredTables,
    relatedTables,
    selectedCategories,
    visibleTables,
    visibleTableNames,
    handleFilter,
    handleCategoryToggle,
  };
}
