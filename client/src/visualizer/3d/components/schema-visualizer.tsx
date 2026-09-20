import { SchemaMetadata } from "@/shared/metadata";
import { SchemaScene } from "./schema-scene";
import { SchemaOverlay } from "@/visualizer/ui/schema-overlay";
import { useVisualizerState } from "../hooks/use-visualizer-state";
import { VisualizerStateProvider } from "../context/visualizer-state-context";

export function SchemaVisualizer() {
  const state = useVisualizerState();
  const {
    glCanvasRef,
    containerRef,
    orbitControlsRef,
    schemaState,
    animationState,
    cameraState,
    filterState,
    selectionState,
    interactionHandlers,
    connectedTables,
    isFiltering,
    handleRecenterComplete,
  } = state;

  return (
    <VisualizerStateProvider value={state}>
      <SchemaMetadata />
      <div
        ref={containerRef}
        className="w-full h-full relative"
        onClick={interactionHandlers.handleClickAway}
      >
        <SchemaScene
          refs={{ orbitControlsRef, glCanvasRef }}
          schema={schemaState.currentSchema}
          filter={{
            visibleTables: filterState.visibleTables,
            visibleTableNames: filterState.visibleTableNames,
            filteredTables: filterState.filteredTables,
            relatedTables: filterState.relatedTables,
            connectedTables,
            isFiltering,
          }}
          selection={{
            selectedTable: selectionState.selectedTable,
            hoveredTable: selectionState.hoveredTable,
            selectedRelationship: selectionState.selectedRelationship,
            hoveredRelationship: selectionState.hoveredRelationship,
          }}
          animation={{
            targetPositions: animationState.targetPositions,
            animationStartTime: animationState.animationStartTime,
            isAnimating: animationState.isAnimating,
            animatedPositionsRef: animationState.animatedPositionsRef,
          }}
          camera={{
            maxCameraDistance: cameraState.maxCameraDistance,
            isCameraAnimating: cameraState.isCameraAnimating,
            shouldRecenter: cameraState.shouldRecenter,
            defaultCameraPosition: cameraState.defaultCameraPosition,
            recenterTarget: cameraState.recenterTarget,
            recenterLookAt: cameraState.recenterLookAt,
            recenterTranslateOnly: cameraState.recenterTranslateOnly,
            recenterOrbitOnly: cameraState.recenterOrbitOnly,
            restrictPolarAngle: cameraState.restrictPolarAngle,
          }}
          handlers={{
            isDraggingTable: interactionHandlers.isDraggingTable,
            onTableSelect: selectionState.handleTableSelect,
            onTableHover: selectionState.setHoveredTable,
            onTableLongPress: interactionHandlers.handleTableLongPress,
            onTablePositionChange: (table, newPosition) =>
              interactionHandlers.handleTablePositionChange(
                table,
                newPosition,
                schemaState.setCurrentSchema
              ),
            onRelationshipSelect: selectionState.handleRelationshipSelect,
            onRelationshipHover: selectionState.setHoveredRelationship,
            onRelationshipLongPress:
              interactionHandlers.handleRelationshipLongPress,
            onAnimatedPositionChange: animationState.onAnimatedPositionChange,
            onDragStart: () => interactionHandlers.setIsDraggingTable(true),
            onDragEnd: () => interactionHandlers.setIsDraggingTable(false),
            onRecenterComplete: handleRecenterComplete,
            onAnimatingChange: cameraState.setIsCameraAnimating,
            onPointerMissed: interactionHandlers.handlePointerMissed,
          }}
        />
        <SchemaOverlay />
      </div>
    </VisualizerStateProvider>
  );
}
