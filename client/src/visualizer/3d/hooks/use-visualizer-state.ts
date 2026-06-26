import { useRef, useMemo, useCallback, useEffect } from "react";
import { useSchemaState } from "@/visualizer/state/hooks/use-schema-state";
import { useSelectionState } from "@/visualizer/state/hooks/use-selection-state";
import { useFilterState } from "@/visualizer/state/hooks/use-filter-state";
import { useTableAnimation } from "../hooks/use-table-animation";
import { useLayoutManagement } from "../hooks/use-layout-management";
import { useCameraControls } from "../hooks/use-camera-controls";
import { useInteractionHandlers } from "../hooks/use-interaction-handlers";
import { getConnectedTables } from "../index";
import { orbitControlsRefHolder } from "../context/orbit-controls-context";

/**
 * Consolidates visualizer hook orchestration and resolves circular dependencies
 * between schema, selection, camera, and layout hooks.
 */
export function useVisualizerState() {
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const detailsPanelRef = useRef<HTMLDivElement>(null);

  const callbacksRef = useRef({
    clearSelections: () => {},
    recenter: () => {},
    getViewMode: (): "2D" | "3D" => "2D",
  });

  const schemaState = useSchemaState(
    () => callbacksRef.current.clearSelections(),
    () => callbacksRef.current.recenter(),
    () => callbacksRef.current.getViewMode()
  );

  const animationState = useTableAnimation(schemaState.setCurrentSchema);
  const cameraState = useCameraControls(schemaState.currentSchema.tables);
  const filterState = useFilterState(schemaState.currentSchema);
  const selectionState = useSelectionState(filterState.visibleTableNames);
  const layoutState = useLayoutManagement(
    schemaState.currentSchema,
    schemaState.setCurrentSchema,
    filterState.visibleTables,
    filterState.selectedCategories,
    animationState.startTableAnimation
  );

  useEffect(() => {
    callbacksRef.current = {
      clearSelections: selectionState.clearAllSelections,
      recenter: cameraState.handleRecenter,
      getViewMode: () => layoutState.viewMode,
    };
  }, [
    selectionState.clearAllSelections,
    cameraState.handleRecenter,
    layoutState.viewMode,
  ]);

  const interactionHandlers = useInteractionHandlers(
    {
      selectedTable: selectionState.selectedTable,
      selectedRelationship: selectionState.selectedRelationship,
      setSelectedTable: selectionState.setSelectedTable,
      setSelectedRelationship: selectionState.setSelectedRelationship,
    },
    {
      setRecenterTarget: cameraState.setRecenterTarget,
      setRecenterLookAt: cameraState.setRecenterLookAt,
      setRecenterTranslateOnly: cameraState.setRecenterTranslateOnly,
      setShouldRecenter: cameraState.setShouldRecenter,
    },
    schemaState.currentSchema,
    detailsPanelRef
  );

  const connectedTables = useMemo(
    () =>
      getConnectedTables(
        schemaState.currentSchema,
        selectionState.selectedTable,
        selectionState.selectedRelationship
      ),
    [
      schemaState.currentSchema,
      selectionState.selectedTable,
      selectionState.selectedRelationship,
    ]
  );

  const isFiltering = useMemo(
    () =>
      filterState.filteredTables.size > 0 || filterState.relatedTables.size > 0,
    [filterState.filteredTables.size, filterState.relatedTables.size]
  );

  const handleRecenterComplete = useCallback(() => {
    cameraState.setShouldRecenter(false);
  }, [cameraState]);

  const handleTableClose = useCallback(() => {
    selectionState.setSelectedTable(null);
  }, [selectionState]);

  const handleRelationshipClose = useCallback(() => {
    selectionState.setSelectedRelationship(null);
  }, [selectionState]);

  return {
    glCanvasRef,
    containerRef,
    detailsPanelRef,
    orbitControlsRef: orbitControlsRefHolder,
    schemaState,
    animationState,
    cameraState,
    filterState,
    selectionState,
    layoutState,
    interactionHandlers,
    connectedTables,
    isFiltering,
    handleRecenterComplete,
    handleTableClose,
    handleRelationshipClose,
  };
}
