import { useState, useCallback, useEffect, startTransition } from "react";
import type { Table } from "@/shared/types/schema";
import type { Relationship } from "@/visualizer/state/types";
import { clearSelections } from "@/visualizer/state/utils/schema-utils";

interface UseSelectionStateReturn {
  selectedTable: Table | null;
  hoveredTable: Table | null;
  selectedRelationship: Relationship | null;
  hoveredRelationship: Relationship | null;
  setSelectedTable: React.Dispatch<React.SetStateAction<Table | null>>;
  setHoveredTable: React.Dispatch<React.SetStateAction<Table | null>>;
  setSelectedRelationship: React.Dispatch<
    React.SetStateAction<Relationship | null>
  >;
  setHoveredRelationship: React.Dispatch<
    React.SetStateAction<Relationship | null>
  >;
  handleTableSelect: (table: Table | null) => void;
  handleRelationshipSelect: (relationship: Relationship | null) => void;
  clearAllSelections: () => void;
}

export function useSelectionState(
  visibleTableNames: Set<string>
): UseSelectionStateReturn {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [selectedRelationship, setSelectedRelationship] =
    useState<Relationship | null>(null);
  const [hoveredRelationship, setHoveredRelationship] =
    useState<Relationship | null>(null);

  const clearAllSelections = useCallback(() => {
    const cleared = clearSelections();
    setSelectedTable(cleared.selectedTable);
    setHoveredTable(cleared.hoveredTable);
    setSelectedRelationship(cleared.selectedRelationship);
    setHoveredRelationship(cleared.hoveredRelationship);
  }, []);

  const handleRelationshipSelect = useCallback(
    (relationship: Relationship | null) => {
      setSelectedRelationship(relationship);
      // Clear table selection when relationship is selected
      if (relationship) {
        setSelectedTable(null);
      }
    },
    []
  );

  const handleTableSelect = useCallback((table: Table | null) => {
    setSelectedTable(table);
    // Clear relationship selection when table/view is selected
    if (table) {
      setSelectedRelationship(null);
    }
  }, []);

  // Clear selections if selected table/relationship becomes invisible
  useEffect(() => {
    startTransition(() => {
      if (selectedTable && !visibleTableNames.has(selectedTable.name)) {
        setSelectedTable(null);
      }
      if (
        selectedRelationship &&
        (!visibleTableNames.has(selectedRelationship.fromTable) ||
          !visibleTableNames.has(selectedRelationship.toTable))
      ) {
        setSelectedRelationship(null);
      }
    });
  }, [
    selectedTable,
    selectedRelationship,
    visibleTableNames,
    setSelectedTable,
    setSelectedRelationship,
  ]);

  return {
    selectedTable,
    hoveredTable,
    selectedRelationship,
    hoveredRelationship,
    setSelectedTable,
    setHoveredTable,
    setSelectedRelationship,
    setHoveredRelationship,
    handleTableSelect,
    handleRelationshipSelect,
    clearAllSelections,
  };
}
