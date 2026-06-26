import { SchemaMetadata } from "@/shared/metadata";
import { SchemaScene } from "./schema-scene";
import { SchemaOverlay } from "@/visualizer/ui/schema-overlay";
import { useVisualizerState } from "../hooks/use-visualizer-state";

export function SchemaVisualizer() {
  const {
    glCanvasRef,
    containerRef,
    detailsPanelRef,
    orbitControlsRef,
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
  } = useVisualizerState();

  return (
    <>
      <SchemaMetadata />
      <div
        ref={containerRef}
        className="w-full h-full relative"
        onClick={interactionHandlers.handleClickAway}
      >
        <SchemaScene
          orbitControlsRef={orbitControlsRef}
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
          defaultCameraPosition={cameraState.defaultCameraPosition}
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
          onDragStart={() => interactionHandlers.setIsDraggingTable(true)}
          onDragEnd={() => interactionHandlers.setIsDraggingTable(false)}
          onRecenterComplete={handleRecenterComplete}
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
          onTableClose={handleTableClose}
          onRelationshipClose={handleRelationshipClose}
        />
      </div>
    </>
  );
}
