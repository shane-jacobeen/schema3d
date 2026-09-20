import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import * as THREE from "three";
import { Table3D } from "./tables/table-3d";
import { RelationshipLines } from "./relationships/relationship-lines";
import { WebGLErrorBoundary } from "./webgl-error-boundary";
import { WebGLFallback } from "./webgl-fallback";
import {
  detectWebGLSupport,
  WEBGL_CONTEXT_ATTRIBUTES,
} from "@/visualizer/3d/utils/webgl-support";
import { CameraController } from "@/visualizer/3d/controls/camera-controller";
import {
  CAMERA_FOV_DEGREES,
  MAX_POLAR_ANGLE_2D,
} from "@/visualizer/3d/utils/camera-utils";
import type { DatabaseSchema, Table } from "@/shared/types/schema";
import type { Relationship } from "@/visualizer/3d/types";
import { shouldDimTable, isTableInRelationship } from "@/visualizer/3d/index";
import {
  OrbitControlsProvider,
  type OrbitControlsRef,
} from "@/visualizer/3d/context/orbit-controls-context";
import { captureSchemaVisualizedIfPending } from "@/shared/analytics";

interface SchemaSceneProps {
  orbitControlsRef: MutableRefObject<OrbitControlsRef>;
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
  recenterOrbitOnly: boolean;
  restrictPolarAngle: boolean;
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
  orbitControlsRef,
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
  animationStartTime,
  isAnimating,
  animatedPositionsRef,
  maxCameraDistance,
  isCameraAnimating,
  isDraggingTable,
  shouldRecenter,
  defaultCameraPosition,
  recenterTarget,
  recenterLookAt,
  recenterTranslateOnly,
  recenterOrbitOnly,
  restrictPolarAngle,
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
  const [support] = useState(detectWebGLSupport);
  const canvasReadyRef = useRef(false);

  const tryCaptureVisualized = useCallback(() => {
    if (!canvasReadyRef.current) {
      return;
    }
    captureSchemaVisualizedIfPending(schema.tables.length);
  }, [schema]);

  useEffect(() => {
    tryCaptureVisualized();
  }, [tryCaptureVisualized]);

  if (!support.supported) {
    const detail =
      support.reason === "no-context"
        ? "WebGL context creation failed."
        : "WebGL instanced arrays are not available.";
    return <WebGLFallback detail={detail} />;
  }

  return (
    <WebGLErrorBoundary>
      <Canvas
        gl={WEBGL_CONTEXT_ATTRIBUTES}
        onCreated={({ gl }) => {
          glCanvasRef.current = gl.domElement;
          canvasReadyRef.current = true;
          tryCaptureVisualized();
        }}
        onPointerMissed={onPointerMissed}
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 12, 35]}
          fov={CAMERA_FOV_DEGREES}
        />
        <OrbitControlsProvider controlsRef={orbitControlsRef}>
          <OrbitControls
            ref={(controls) => {
              orbitControlsRef.current = controls;
            }}
            enableDamping
            dampingFactor={0.05}
            minDistance={10}
            maxDistance={maxCameraDistance}
            maxPolarAngle={restrictPolarAngle ? MAX_POLAR_ANGLE_2D : Math.PI}
            enabled={!isCameraAnimating && !isDraggingTable}
          />

          <color attach="background" args={["#0f172a"]} />

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          <Stars
            radius={100}
            depth={50}
            count={visibleTables.length > 100 ? 1000 : 5000}
            factor={2}
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
            orbitOnly={recenterOrbitOnly}
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
              animatedPositionsRef={animatedPositionsRef}
              isAnimating={isAnimating}
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
                  simplifiedRendering={visibleTables.length > 100}
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

            <polarGridHelper args={[40, 0, 8, 128, "#1e293b", "#1e293b"]} />
          </Suspense>
        </OrbitControlsProvider>
      </Canvas>
    </WebGLErrorBoundary>
  );
}
