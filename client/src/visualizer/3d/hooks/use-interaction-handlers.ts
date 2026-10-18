import { useState, useCallback } from "react";
import * as THREE from "three";
import type { Table } from "@/shared/types/schema";
import type { DatabaseSchema } from "@/shared/types/schema";
import type { Relationship } from "@/visualizer/3d/types";
import type { CameraMove } from "../utils/camera-utils";
import { calculateCameraPositionForRecenter } from "../utils/camera-utils";
import { consumeFollowingClick } from "./use-press-gesture";

interface SelectionState {
  selectedTable: Table | null;
  selectedRelationship: Relationship | null;
  setSelectedTable: (table: Table | null) => void;
  setSelectedRelationship: (relationship: Relationship | null) => void;
}

interface CameraState {
  requestCameraMove: (move: CameraMove) => void;
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
  isDraggingTable: boolean;
  setIsDraggingTable: (isDragging: boolean) => void;
  detailsPanelRef: React.RefObject<HTMLDivElement>;
}

export function useInteractionHandlers(
  selectionState: SelectionState,
  cameraState: CameraState,
  currentSchema: DatabaseSchema,
  detailsPanelRef: React.RefObject<HTMLDivElement>
): UseInteractionHandlersReturn {
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const { requestCameraMove } = cameraState;

  const panTo = useCallback(
    (point: THREE.Vector3) => {
      const { position, lookAt } = calculateCameraPositionForRecenter(point);
      requestCameraMove({ position, lookAt, motion: "pan" });
    },
    [requestCameraMove]
  );

  const shouldClosePanels = useCallback(
    (target: HTMLElement): boolean => {
      const detailsPanel = detailsPanelRef.current;
      if (detailsPanel && detailsPanel.contains(target)) {
        return false;
      }

      const isUIControl = target.closest(
        'button, input, [role="button"], [role="combobox"], [role="menu"], a'
      );
      if (isUIControl) {
        return false;
      }

      if (target.tagName === "CANVAS" || target.closest("canvas")) {
        return false;
      }

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
      if (consumeFollowingClick()) {
        return;
      }

      const target = e.target as HTMLElement;
      if (shouldClosePanels(target)) {
        selectionState.setSelectedTable(null);
        selectionState.setSelectedRelationship(null);
      }
    },
    [shouldClosePanels, selectionState]
  );

  const handlePointerMissed = useCallback(() => {
    if (consumeFollowingClick()) {
      return;
    }

    if (selectionState.selectedTable || selectionState.selectedRelationship) {
      selectionState.setSelectedTable(null);
      selectionState.setSelectedRelationship(null);
    }
  }, [selectionState]);

  const handleTableLongPress = useCallback(
    (table: Table) => {
      selectionState.setSelectedTable(table);
      selectionState.setSelectedRelationship(null);
      panTo(new THREE.Vector3(...table.position));
    },
    [panTo, selectionState]
  );

  const handleRelationshipLongPress = useCallback(
    (relationship: Relationship) => {
      selectionState.setSelectedRelationship(relationship);
      selectionState.setSelectedTable(null);

      const fromTable = currentSchema.tables.find(
        (t) => t.name === relationship.fromTable
      );
      const toTable = currentSchema.tables.find(
        (t) => t.name === relationship.toTable
      );

      if (fromTable && toTable) {
        const fromPos = new THREE.Vector3(...fromTable.position);
        const toPos = new THREE.Vector3(...toTable.position);
        const centerPoint = new THREE.Vector3()
          .addVectors(fromPos, toPos)
          .multiplyScalar(0.5);
        panTo(centerPoint);
      }
    },
    [currentSchema, panTo, selectionState]
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
    isDraggingTable,
    setIsDraggingTable,
    detailsPanelRef,
  };
}
