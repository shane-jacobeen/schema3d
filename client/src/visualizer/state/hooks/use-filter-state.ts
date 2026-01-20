import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  startTransition,
} from "react";
import type { DatabaseSchema } from "@/shared/types/schema";
import {
  getInitialCategories,
  updateCategoriesForSchema,
  initializeCategories,
} from "../utils/schema-state-utils";
import { consumePendingViewState } from "../utils/view-state-store";

interface UseFilterStateReturn {
  filteredTables: Set<string>;
  relatedTables: Set<string>;
  selectedCategories: Set<string>;
  visibleTables: DatabaseSchema["tables"];
  visibleTableNames: Set<string>;
  handleFilter: (matched: Set<string>, related: Set<string>) => void;
  handleCategoryToggle: (category: string) => void;
  resetCategories: (schema: DatabaseSchema) => void;
}

export function useFilterState(
  currentSchema: DatabaseSchema
): UseFilterStateReturn {
  const [filteredTables, setFilteredTables] = useState<Set<string>>(new Set());
  const [relatedTables, setRelatedTables] = useState<Set<string>>(new Set());

  // Check for view state from URL on first render
  // Use lazy initializer to avoid calling consumePendingViewState multiple times
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => {
      const pendingViewState = consumePendingViewState();
      if (pendingViewState?.selectedCategories) {
        // Use categories from URL if provided
        return new Set(pendingViewState.selectedCategories);
      }
      // Otherwise use default categories
      return getInitialCategories();
    }
  );

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

  const resetCategories = useCallback((schema: DatabaseSchema) => {
    startTransition(() => {
      setSelectedCategories(initializeCategories(schema));
    });
  }, []);

  // Track previous schema name and categories to detect when they actually change
  const prevSchemaNameRef = useRef<string>(currentSchema.name);
  const prevSchemaRef = useRef<DatabaseSchema | undefined>(undefined);
  const prevCategoriesInSchemaRef = useRef<string>("");

  // Update selected categories when schema changes
  useEffect(() => {
    const isNewSchema = prevSchemaNameRef.current !== currentSchema.name;
    const prevSchema = prevSchemaRef.current;

    // Build a stable representation of categories in the schema
    const categoriesInSchema = Array.from(
      new Set(currentSchema.tables.map((t) => t.category))
    )
      .sort()
      .join(",");
    const categoriesChanged =
      prevCategoriesInSchemaRef.current !== categoriesInSchema;

    prevSchemaNameRef.current = currentSchema.name;
    prevSchemaRef.current = currentSchema;
    prevCategoriesInSchemaRef.current = categoriesInSchema;

    // Only update categories if schema name changed OR categories in schema changed
    // This prevents re-adding categories when schema reference changes due to animations
    if (!isNewSchema && !categoriesChanged) {
      return;
    }

    startTransition(() => {
      if (isNewSchema) {
        // Reset to all categories when a new schema is loaded
        setSelectedCategories(initializeCategories(currentSchema));
      } else if (categoriesChanged) {
        // Update categories, handling renames if we have the previous schema
        setSelectedCategories((prev) =>
          updateCategoriesForSchema(currentSchema, prev, prevSchema)
        );
      }
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
    resetCategories,
  };
}
