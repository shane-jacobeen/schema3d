import { useRef, useMemo, useCallback, useEffect } from "react";
import { SchemaMetadata } from "@/shared/metadata";
import { SchemaScene } from "./schema-scene";
import { SchemaOverlay } from "@/visualizer/ui/schema-overlay";
import { useSchemaState } from "@/visualizer/state/hooks/use-schema-state";
import { useSelectionState } from "@/visualizer/state/hooks/use-selection-state";
import { useFilterState } from "@/visualizer/state/hooks/use-filter-state";
import { useTableAnimation } from "../hooks/use-table-animation";
import { useLayoutManagement } from "../hooks/use-layout-management";
import { useCameraControls } from "../hooks/use-camera-controls";
import { useInteractionHandlers } from "../hooks/use-interaction-handlers";
import { getConnectedTables } from "../index";

/**
 * Main 3D schema visualization component.
 *
 * Renders database schemas as interactive 3D objects using React Three Fiber.
 * Features include:
 * - Interactive 3D table rendering with color-coded categories
 * - Relationship lines with ERD-style cardinality notation
 * - Multiple layout algorithms (circular, force-directed, hierarchical)
 * - 2D/3D view modes
 * - Table and relationship selection with detail panels
 * - Search/filter functionality
 * - Camera controls with auto-recentering
 * - Schema switching with format auto-detection (SQL/Mermaid)
 *
 * State management:
 * - Manages schema state, selections, filters, and camera animation
 * - Persists schema across dialog opens/closes
 * - Handles table position animations when switching layouts or view modes
 */
export function SchemaVisualizer() {
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const detailsPanelRef = useRef<HTMLDivElement>(null);

  // Temporary refs for circular dependencies - will be updated in useEffect
  const tempClearSelectionsRef = useRef<() => void>(() => {});
  const tempRecenterRef = useRef<() => void>(() => {});
  const getViewModeRef = useRef<() => "2D" | "3D">(() => "2D");

  // Initialize schema state first (with temporary callbacks)
  // These will be updated in useEffect after other hooks are initialized
  const schemaState = useSchemaState(
    () => tempClearSelectionsRef.current(),
    () => tempRecenterRef.current(),
    () => getViewModeRef.current()
  );

  // Initialize animation state with schema setter
  const animationState = useTableAnimation(schemaState.setCurrentSchema);

  // Initialize camera controls
  const cameraState = useCameraControls(schemaState.currentSchema.tables);

  // Initialize filter state
  const filterState = useFilterState(schemaState.currentSchema);

  // Initialize selection state
  const selectionState = useSelectionState(filterState.visibleTableNames);

  // Initialize layout management - this is the single source of truth for layout
  const layoutState = useLayoutManagement(
    schemaState.currentSchema,
    schemaState.setCurrentSchema,
    filterState.visibleTables,
    filterState.selectedCategories,
    animationState.startTableAnimation
  );

  // Update refs with actual functions after all hooks are initialized
  // This must be done in useEffect to avoid accessing refs during render
  useEffect(() => {
    tempClearSelectionsRef.current = selectionState.clearAllSelections;
    tempRecenterRef.current = cameraState.handleRecenter;
    getViewModeRef.current = () => layoutState.viewMode;
  }, [
    selectionState.clearAllSelections,
    cameraState.handleRecenter,
    layoutState.viewMode,
  ]);

  // Initialize interaction handlers
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

  // Computed values
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

  return (
    <>
      <SchemaMetadata />
      <div
        ref={containerRef}
        className="w-full h-full relative"
        onClick={interactionHandlers.handleClickAway}
      >
        <SchemaScene
          schema={schemaState.currentSchema}
          visibleTables={filterState.visibleTables}
          visibleTableNames={filterState.visibleTableNames}
          selectedTable={selectionState.selectedTable}
          hoveredTable={selectionState.hoveredTable}
          selectedRelationship={selectionState.selectedRelationship}
          hoveredRelationship={selectionState.hoveredRelationship}
          filteredTables={filterState.filteredTables}
          relatedTables={filterState.relatedTables}
          connectedTables={connectedTables}
          isFiltering={isFiltering}
          targetPositions={animationState.targetPositions}
          animatedPositions={animationState.animatedPositions}
          animationStartTime={animationState.animationStartTime}
          isAnimating={animationState.isAnimating}
          animatedPositionsRef={animationState.animatedPositionsRef}
          maxCameraDistance={cameraState.maxCameraDistance}
          isCameraAnimating={cameraState.isCameraAnimating}
          isDraggingTable={interactionHandlers.isDraggingTable}
          shouldRecenter={cameraState.shouldRecenter}
          recenterTarget={cameraState.recenterTarget}
          recenterLookAt={cameraState.recenterLookAt}
          recenterTranslateOnly={cameraState.recenterTranslateOnly}
          onTableSelect={selectionState.handleTableSelect}
          onTableHover={selectionState.setHoveredTable}
          onTableLongPress={interactionHandlers.handleTableLongPress}
          onTablePositionChange={(table, newPosition) =>
            interactionHandlers.handleTablePositionChange(
              table,
              newPosition,
              schemaState.setCurrentSchema
            )
          }
          onRelationshipSelect={selectionState.handleRelationshipSelect}
          onRelationshipHover={selectionState.setHoveredRelationship}
          onRelationshipLongPress={
            interactionHandlers.handleRelationshipLongPress
          }
          onAnimatedPositionChange={animationState.onAnimatedPositionChange}
          onDragStart={interactionHandlers.setIsDraggingTable.bind(null, true)}
          onDragEnd={interactionHandlers.setIsDraggingTable.bind(null, false)}
          onRecenterComplete={useCallback(() => {
            cameraState.setShouldRecenter(false);
          }, [cameraState])}
          onAnimatingChange={cameraState.setIsCameraAnimating}
          glCanvasRef={glCanvasRef}
          onPointerMissed={interactionHandlers.handlePointerMissed}
        />
        <SchemaOverlay
          schema={schemaState.currentSchema}
          selectedTable={selectionState.selectedTable}
          selectedRelationship={selectionState.selectedRelationship}
          currentLayout={layoutState.currentLayout}
          viewMode={layoutState.viewMode}
          selectedCategories={filterState.selectedCategories}
          persistedSchemaRef={schemaState.persistedSchemaRef}
          glCanvasRef={glCanvasRef}
          detailsPanelRef={detailsPanelRef}
          onSchemaChange={schemaState.setCurrentSchema}
          onCategoryUpdate={(updatedSchema) => {
            // Direct schema update for category changes (no animation)
            // The useFilterState hook will automatically handle category updates via its useEffect
            // which watches currentSchema and calls updateCategoriesForSchema
            schemaState.setCurrentSchema(updatedSchema);
          }}
          onSchemaChangeFromSelector={(newSchema) =>
            schemaState.handleSchemaChangeFromSelector(newSchema, (schema) =>
              filterState.resetCategories(schema)
            )
          }
          onLayoutChange={layoutState.handleLayoutChange}
          onViewModeChange={layoutState.setViewMode}
          onCategoryToggle={filterState.handleCategoryToggle}
          onFilter={filterState.handleFilter}
          onRecenter={cameraState.handleRecenter}
          onTableClose={useCallback(
            () => selectionState.setSelectedTable(null),
            [selectionState]
          )}
          onRelationshipClose={useCallback(
            () => selectionState.setSelectedRelationship(null),
            [selectionState]
          )}
        />
      </div>
    </>
  );
}
