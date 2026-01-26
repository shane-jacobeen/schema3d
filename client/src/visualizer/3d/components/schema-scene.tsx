import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import { Suspense, type ComponentRef } from "react";
import * as THREE from "three";
import { Table3D } from "./tables/table-3d";
import { RelationshipLines } from "./relationships/relationship-lines";
import { CameraController } from "@/visualizer/3d/controls/camera-controller";
import type { DatabaseSchema, Table } from "@/shared/types/schema";
import type { Relationship } from "@/visualizer/3d/types";
import { shouldDimTable, isTableInRelationship } from "@/visualizer/3d/index";

interface SchemaSceneProps {
  schema: DatabaseSchema;
  visibleTables: DatabaseSchema["tables"];
  visibleTableNames: Set<string>;
  selectedTable: Table | null;
  hoveredTable: Table | null;
  selectedRelationship: Relationship | null;
  hoveredRelationship: Relationship | null;
  filteredTables: Set<string>;
  relatedTables: Set<string>;
  connectedTables: Set<string>;
  isFiltering: boolean;
  targetPositions: Map<string, [number, number, number]>;
  animatedPositions: Map<string, [number, number, number]>;
  animationStartTime: number | null;
  isAnimating: boolean;
  animatedPositionsRef: React.MutableRefObject<
    Map<string, [number, number, number]>
  >;
  maxCameraDistance: number;
  isCameraAnimating: boolean;
  isDraggingTable: boolean;
  shouldRecenter: boolean;
  defaultCameraPosition: THREE.Vector3;
  recenterTarget: THREE.Vector3 | null;
  recenterLookAt: THREE.Vector3 | null;
  recenterTranslateOnly: boolean;
  onTableSelect: (table: Table | null) => void;
  onTableHover: (table: Table | null) => void;
  onTableLongPress: (table: Table) => void;
  onTablePositionChange: (
    table: Table,
    newPosition: [number, number, number]
  ) => void;
  onRelationshipSelect: (relationship: Relationship | null) => void;
  onRelationshipHover: (relationship: Relationship | null) => void;
  onRelationshipLongPress: (relationship: Relationship) => void;
  onAnimatedPositionChange: (
    tableName: string,
    position: [number, number, number]
  ) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onRecenterComplete: () => void;
  onAnimatingChange: (isAnimating: boolean) => void;
  glCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  onPointerMissed: () => void;
}

export function SchemaScene({
  schema,
  visibleTables,
  visibleTableNames,
  selectedTable,
  hoveredTable,
  selectedRelationship,
  hoveredRelationship,
  filteredTables,
  relatedTables,
  connectedTables,
  isFiltering,
  targetPositions,
  animatedPositions,
  animationStartTime,
  isAnimating,
  animatedPositionsRef: _animatedPositionsRef,
  maxCameraDistance,
  isCameraAnimating,
  isDraggingTable,
  shouldRecenter,
  defaultCameraPosition,
  recenterTarget,
  recenterLookAt,
  recenterTranslateOnly,
  onTableSelect,
  onTableHover,
  onTableLongPress,
  onTablePositionChange,
  onRelationshipSelect,
  onRelationshipHover,
  onRelationshipLongPress,
  onAnimatedPositionChange,
  onDragStart,
  onDragEnd,
  onRecenterComplete,
  onAnimatingChange,
  glCanvasRef,
  onPointerMissed,
}: SchemaSceneProps) {
  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        glCanvasRef.current = gl.domElement;
      }}
      onPointerMissed={onPointerMissed}
    >
      <PerspectiveCamera makeDefault position={[0, 12, 35]} fov={60} />
      <OrbitControls
        ref={(controls) => {
          if (controls) {
            (
              window as {
                __orbitControls?: ComponentRef<typeof OrbitControls>;
              }
            ).__orbitControls = controls;
          }
        }}
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={maxCameraDistance}
        enabled={!isCameraAnimating && !isDraggingTable}
      />

      <color attach="background" args={["#0f172a"]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      <CameraController
        shouldRecenter={shouldRecenter}
        defaultPosition={defaultCameraPosition}
        recenterTarget={recenterTarget}
        recenterLookAt={recenterLookAt}
        translateOnly={recenterTranslateOnly}
        onRecenterComplete={onRecenterComplete}
        onAnimatingChange={onAnimatingChange}
      />

      <Suspense fallback={null}>
        <RelationshipLines
          schema={schema}
          selectedRelationship={selectedRelationship}
          hoveredRelationship={hoveredRelationship}
          selectedTable={selectedTable}
          onSelect={onRelationshipSelect}
          onHover={onRelationshipHover}
          onLongPress={onRelationshipLongPress}
          animatedPositions={isAnimating ? animatedPositions : undefined}
          visibleTableNames={visibleTableNames}
        />

        {visibleTables.map((table) => {
          const isMatched = filteredTables.has(table.name);
          const isRelated = relatedTables.has(table.name);
          const hasSelection = !!(selectedTable || selectedRelationship);

          const isDimmed = shouldDimTable(
            table,
            filteredTables,
            relatedTables,
            connectedTables,
            hasSelection,
            isFiltering
          );

          const isRelationshipHighlighted =
            isTableInRelationship(table, selectedRelationship) ||
            isTableInRelationship(table, hoveredRelationship);

          return (
            <Table3D
              key={table.name}
              table={table}
              isSelected={selectedTable?.name === table.name}
              isHovered={hoveredTable?.name === table.name}
              isHighlighted={isMatched}
              isRelated={isRelated}
              isDimmed={isDimmed}
              isRelationshipHighlighted={isRelationshipHighlighted}
              onSelect={onTableSelect}
              onHover={onTableHover}
              onLongPress={onTableLongPress}
              onPositionChange={onTablePositionChange}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              targetPosition={targetPositions.get(table.name)}
              animationStartTime={animationStartTime}
              isAnimating={isAnimating}
              onAnimatedPositionChange={onAnimatedPositionChange}
            />
          );
        })}

        {/* Circular concentric grid */}
        <polarGridHelper args={[40, 0, 8, 128, "#1e293b", "#1e293b"]} />
      </Suspense>
    </Canvas>
  );
}
