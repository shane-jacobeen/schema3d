import { useRef, memo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { Table3DProps } from "../../types";
import { EDGE_TUBE_RADIUS } from "../../constants";
import { useTableDrag } from "./use-table-drag";
import { useTableLayoutAnimation } from "./use-table-layout-animation";
import { useTableAppearance } from "./use-table-appearance";

export const Table3D = memo(function Table3D({
  table,
  isSelected,
  isHovered,
  isHighlighted = false,
  isRelated = false,
  isDimmed = false,
  isRelationshipHighlighted = false,
  simplifiedRendering = false,
  onSelect,
  onHover,
  onLongPress,
  onPositionChange,
  onDragStart,
  onDragEnd,
  targetPosition,
  animationStartTime,
  isAnimating = false,
  onAnimatedPositionChange,
}: Table3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Group>(null);

  const { meshPointerHandlers } = useTableDrag({
    table,
    isSelected,
    onSelect,
    onHover,
    onLongPress,
    onPositionChange,
    onDragStart,
    onDragEnd,
  });

  useTableLayoutAnimation({
    groupRef,
    tablePosition: table.position,
    tableName: table.name,
    targetPosition,
    animationStartTime,
    isAnimating,
    onAnimatedPositionChange,
  });

  const actualColumns = table.columns.filter(
    (col) => !col.name.startsWith("_ref_")
  );
  const isView = table.isView === true;

  const {
    initialLabelY,
    opacity,
    emissiveIntensity,
    dimmedColor,
    cylinderGeometry,
    edgesGeometry,
    edgeTubes,
    edgeColor,
  } = useTableAppearance({
    meshRef,
    groupRef,
    textRef,
    tableColor: table.color,
    columnCount: actualColumns.length,
    isView,
    isSelected,
    isHovered,
    isHighlighted,
    isRelated,
    isDimmed,
    isRelationshipHighlighted,
  });

  return (
    <group ref={groupRef} position={table.position}>
      <mesh ref={meshRef} geometry={cylinderGeometry} {...meshPointerHandlers}>
        <meshStandardMaterial
          color={isDimmed ? dimmedColor : table.color}
          emissive={isDimmed ? dimmedColor : table.color}
          emissiveIntensity={emissiveIntensity}
          metalness={isView ? 0 : 0.3}
          roughness={isView ? 0.7 : 0.7}
          transparent={opacity < 1}
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      {simplifiedRendering ? (
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial
            color={edgeColor}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </lineSegments>
      ) : (
        <>
          {edgeTubes.map((edge, index) => (
            <mesh key={index}>
              <tubeGeometry
                args={[
                  edge.curve,
                  Math.max(2, Math.floor(edge.length * 10)),
                  EDGE_TUBE_RADIUS,
                  8,
                  false,
                ]}
              />
              <meshBasicMaterial
                color={edgeColor}
                transparent={opacity < 1}
                opacity={opacity}
              />
            </mesh>
          ))}
          {isSelected &&
            edgeTubes.map((edge, index) => {
              const selectedEdgeColor = new THREE.Color(
                table.color
              ).multiplyScalar(0.5);

              return (
                <mesh key={`selected-${index}`} renderOrder={1}>
                  <tubeGeometry
                    args={[
                      edge.curve,
                      Math.max(2, Math.floor(edge.length * 10)),
                      EDGE_TUBE_RADIUS,
                      8,
                      false,
                    ]}
                  />
                  <meshBasicMaterial
                    color={selectedEdgeColor}
                    transparent={false}
                    opacity={1}
                    depthTest={false}
                    depthWrite={false}
                  />
                </mesh>
              );
            })}
        </>
      )}
      <group ref={textRef}>
        <Text
          position={[0, initialLabelY, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          fillOpacity={1}
        >
          {table.name}
        </Text>
      </group>
    </group>
  );
});
