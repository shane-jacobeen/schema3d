import { useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { Table } from "@/shared/types/schema";
import type { DatabaseSchema } from "@/shared/types/schema";
import type { Relationship } from "@/visualizer/3d/types";
import { calculateCameraPositionForRecenter } from "../utils/camera-utils";

interface SelectionState {
  selectedTable: Table | null;
  selectedRelationship: Relationship | null;
  setSelectedTable: (table: Table | null) => void;
  setSelectedRelationship: (relationship: Relationship | null) => void;
}

interface CameraState {
  setRecenterTarget: (target: THREE.Vector3 | null) => void;
  setRecenterLookAt: (lookAt: THREE.Vector3 | null) => void;
  setRecenterTranslateOnly: (translateOnly: boolean) => void;
  setShouldRecenter: (should: boolean) => void;
}

interface UseInteractionHandlersReturn {
  handleTableLongPress: (table: Table) => void;
  handleRelationshipLongPress: (relationship: Relationship) => void;
  handleTablePositionChange: (
    table: Table,
    newPosition: [number, number, number],
    setCurrentSchema: React.Dispatch<React.SetStateAction<DatabaseSchema>>
  ) => void;
  handleClickAway: React.MouseEventHandler<HTMLDivElement>;
  handlePointerMissed: () => void;
  setLongPressFlag: () => void;
  isDraggingTable: boolean;
  setIsDraggingTable: (isDragging: boolean) => void;
  justLongPressedRef: React.MutableRefObject<boolean>;
  detailsPanelRef: React.RefObject<HTMLDivElement>;
}

export function useInteractionHandlers(
  selectionState: SelectionState,
  cameraState: CameraState,
  currentSchema: DatabaseSchema,
  detailsPanelRef: React.RefObject<HTMLDivElement>
): UseInteractionHandlersReturn {
  const justLongPressedRef = useRef(false);
  const [isDraggingTable, setIsDraggingTable] = useState(false);

  const setLongPressFlag = useCallback(() => {
    justLongPressedRef.current = true;
    setTimeout(() => {
      justLongPressedRef.current = false;
    }, 100);
  }, []);

  const shouldClosePanels = useCallback(
    (target: HTMLElement): boolean => {
      // Don't close if clicking inside details panel
      const detailsPanel = detailsPanelRef.current;
      if (detailsPanel && detailsPanel.contains(target)) {
        return false;
      }

      // Don't close if clicking on UI controls (search, buttons, etc.)
      const isUIControl = target.closest(
        'button, input, [role="button"], [role="combobox"], [role="menu"], a'
      );
      if (isUIControl) {
        return false;
      }

      // Don't close if clicking on canvas (3D objects handle their own clicks)
      if (target.tagName === "CANVAS" || target.closest("canvas")) {
        return false;
      }

      // Close panels when clicking on container background
      return !!(
        selectionState.selectedTable || selectionState.selectedRelationship
      );
    },
    [
      selectionState.selectedTable,
      selectionState.selectedRelationship,
      detailsPanelRef,
    ]
  );

  const handleClickAway = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't close if we just did a long press (prevents interference)
      if (justLongPressedRef.current) {
        return;
      }

      // Check the actual target element that was clicked, not the container
      const target = e.target as HTMLElement;
      if (shouldClosePanels(target)) {
        selectionState.setSelectedTable(null);
        selectionState.setSelectedRelationship(null);
      }
    },
    [shouldClosePanels, selectionState]
  );

  const handlePointerMissed = useCallback(() => {
    // Don't close if we just did a long press (prevents interference)
    if (justLongPressedRef.current) {
      return;
    }

    // Close details panels when clicking on empty space in 3D scene
    if (selectionState.selectedTable || selectionState.selectedRelationship) {
      selectionState.setSelectedTable(null);
      selectionState.setSelectedRelationship(null);
    }
  }, [selectionState]);

  const handleTableLongPress = useCallback(
    (table: Table) => {
      // Set flag to prevent click-away from firing immediately after long press
      setLongPressFlag();

      // Select the table and clear relationship selection
      selectionState.setSelectedTable(table);
      selectionState.setSelectedRelationship(null);

      // Re-center camera on the table (without rotating)
      const targetPoint = new THREE.Vector3(...table.position);
      const { position, lookAt } =
        calculateCameraPositionForRecenter(targetPoint);

      cameraState.setRecenterTarget(position);
      cameraState.setRecenterLookAt(lookAt);
      cameraState.setRecenterTranslateOnly(true); // Long press should only translate
      cameraState.setShouldRecenter(true);
    },
    [setLongPressFlag, selectionState, cameraState]
  );

  const handleRelationshipLongPress = useCallback(
    (relationship: Relationship) => {
      // Set flag to prevent click-away from firing immediately after long press
      setLongPressFlag();

      // Select the relationship and clear table selection
      selectionState.setSelectedRelationship(relationship);
      selectionState.setSelectedTable(null);

      // Find the two tables connected by this relationship
      const fromTable = currentSchema.tables.find(
        (t) => t.name === relationship.fromTable
      );
      const toTable = currentSchema.tables.find(
        (t) => t.name === relationship.toTable
      );

      if (fromTable && toTable) {
        const fromPos = new THREE.Vector3(...fromTable.position);
        const toPos = new THREE.Vector3(...toTable.position);
        // Calculate the midpoint between the two tables
        const centerPoint = new THREE.Vector3()
          .addVectors(fromPos, toPos)
          .multiplyScalar(0.5);

        // Re-center camera on the relationship midpoint (without rotating)
        const { position, lookAt } =
          calculateCameraPositionForRecenter(centerPoint);

        cameraState.setRecenterTarget(position);
        cameraState.setRecenterLookAt(lookAt);
        cameraState.setShouldRecenter(true);
      }
    },
    [currentSchema, setLongPressFlag, selectionState, cameraState]
  );

  return {
    handleTableLongPress,
    handleRelationshipLongPress,
    handleTablePositionChange: (
      table: Table,
      newPosition: [number, number, number],
      setCurrentSchema: React.Dispatch<React.SetStateAction<DatabaseSchema>>
    ) => {
      setCurrentSchema((prevSchema) => {
        const updatedTables = prevSchema.tables.map((t) =>
          t.name === table.name ? { ...t, position: newPosition } : t
        );
        return { ...prevSchema, tables: updatedTables };
      });
    },
    handleClickAway,
    handlePointerMissed,
    setLongPressFlag,
    isDraggingTable,
    setIsDraggingTable,
    justLongPressedRef,
    detailsPanelRef,
  };
}
