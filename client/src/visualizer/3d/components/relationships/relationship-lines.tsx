import { Line as DreiLine, Text } from "@react-three/drei";
import {
  useRef,
  useMemo,
  useEffect,
  useCallback,
  useState,
  type ComponentRef,
} from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type {
  Relationship,
  RelationshipLinesProps,
  RelationshipLineProps,
  Cardinality,
} from "../../types";
import {
  LONG_PRESS_DURATION,
  TABLE_RADIUS,
  RELATIONSHIP_LINE_Y_OFFSET,
} from "../../constants";
import {
  calculateCardinality,
  getLineStyle,
  getTableSurfacePoint,
  CardinalityNotation,
} from "../../index";

export function RelationshipLines({
  schema,
  selectedRelationship,
  hoveredRelationship,
  selectedTable,
  onSelect,
  onHover,
  onLongPress,
  animatedPositions,
  visibleTableNames,
}: RelationshipLinesProps) {
  const relationships = useMemo<Relationship[]>(() => {
    const result: Relationship[] = [];

    schema.tables.forEach((table) => {
      // Skip if table is not visible
      if (visibleTableNames && !visibleTableNames.has(table.name)) {
        return;
      }

      table.columns.forEach((column) => {
        if (column.isForeignKey && column.references) {
          // Use case-insensitive matching to handle table name variations
          const referencedTable = schema.tables.find(
            (t) =>
              t.name.toLowerCase() === column.references!.table.toLowerCase()
          );

          // Only include relationship if both tables are visible
          if (
            referencedTable &&
            (!visibleTableNames || visibleTableNames.has(referencedTable.name))
          ) {
            // Always use table.position for the initial relationship structure
            // The individual RelationshipLine component will handle animated positions in useFrame
            const fromTablePos = table.position;
            const toTablePos = referencedTable.position;
            const fromCenter = new THREE.Vector3(...fromTablePos);
            const toCenter = new THREE.Vector3(...toTablePos);

            fromCenter.y += RELATIONSHIP_LINE_Y_OFFSET;
            toCenter.y += RELATIONSHIP_LINE_Y_OFFSET;

            // Calculate direction from from table to to table
            const direction = new THREE.Vector3()
              .subVectors(toCenter, fromCenter)
              .normalize();

            // Move start/end points to table surface
            const fromPos = getTableSurfacePoint(
              fromCenter,
              direction,
              TABLE_RADIUS
            );
            const toPos = getTableSurfacePoint(
              toCenter,
              direction.clone().multiplyScalar(-1),
              TABLE_RADIUS
            );

            // Straight line between the two table surface points
            const curve = new THREE.LineCurve3(fromPos, toPos);
            // Use just the endpoints for a straight visible line
            const points = [fromPos.clone(), toPos.clone()];
            const midpoint = new THREE.Vector3()
              .addVectors(fromPos, toPos)
              .multiplyScalar(0.5);

            // Find the PK column in the referenced table
            const pkColumn = referencedTable.columns.find(
              (c) => c.name === column.references!.column
            );

            // Use stored cardinality from Mermaid if available, otherwise calculate from UNIQUE constraints
            const cardinality: Cardinality =
              (column.references!.cardinality as Cardinality | undefined) ||
              calculateCardinality(pkColumn, column);

            result.push({
              id: `${table.name}.${column.name}->${referencedTable.name}.${column.references.column}`,
              points,
              fromTable: table.name,
              toTable: referencedTable.name,
              fkColumn: column.name,
              pkColumn: column.references.column,
              midpoint,
              curve,
              cardinality,
            });
          }
        }
      });
    });

    return result;
  }, [schema, visibleTableNames]);

  return (
    <group>
      {relationships.map((relationship) => {
        const isSelected = selectedRelationship?.id === relationship.id;
        const isHovered = hoveredRelationship?.id === relationship.id;
        // Highlight relationships connected to selected table
        const isConnectedToSelectedTable = selectedTable
          ? relationship.fromTable === selectedTable.name ||
            relationship.toTable === selectedTable.name
          : false;

        const lineStyle = getLineStyle(
          isSelected,
          isHovered,
          isConnectedToSelectedTable
        );

        return (
          <RelationshipLine
            key={relationship.id}
            relationship={relationship}
            isSelected={isSelected}
            isHovered={isHovered}
            lineColor={lineStyle.color}
            lineOpacity={lineStyle.opacity}
            lineWidth={lineStyle.width}
            onSelect={onSelect}
            onHover={onHover}
            onLongPress={onLongPress}
            animatedPositions={animatedPositions}
            schema={schema}
          />
        );
      })}
    </group>
  );
}

function RelationshipLine({
  relationship,
  isSelected,
  isHovered,
  lineColor,
  lineOpacity,
  lineWidth,
  onSelect,
  onHover,
  onLongPress,
  animatedPositions,
  schema,
}: RelationshipLineProps) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Group>(null);
  const lineRef = useRef<ComponentRef<typeof DreiLine> | null>(null);
  const labelOffsetRef = useRef(0.3);
  const { camera } = useThree();

  // Store current animated line points - use state to trigger re-renders
  const [currentPoints, setCurrentPoints] = useState<THREE.Vector3[]>([
    relationship.points[0].clone(),
    relationship.points[1].clone(),
  ]);

  // Create table lookup map once (memoized)
  const tableLookupRef = useRef<Map<string, (typeof schema.tables)[0]>>(
    new Map()
  );
  useEffect(() => {
    const lookup = new Map();
    schema.tables.forEach((table) => {
      lookup.set(table.name, table);
    });
    tableLookupRef.current = lookup;
  }, [schema]);

  // Reuse Vector3 objects to avoid allocations every frame
  const fromCenterRef = useRef(new THREE.Vector3());
  const toCenterRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());
  const fromPosRef = useRef(new THREE.Vector3());
  const toPosRef = useRef(new THREE.Vector3());
  const midpointRef = useRef(new THREE.Vector3());

  // Long-press detection
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  // Create a tube geometry along the curve for click detection
  // Use useMemo to avoid recreating geometry on every render
  const tubeGeometry = useMemo(
    // use fewer segments for straight tubes
    () => new THREE.TubeGeometry(relationship.curve, 8, 0.15, 8, false),
    [relationship.curve]
  );

  // Cleanup geometry and timer on unmount
  useEffect(() => {
    return () => {
      tubeGeometry.dispose();
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [tubeGeometry]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      // Only select if it wasn't a long press
      if (!isLongPressRef.current && onSelect) {
        onSelect(isSelected ? null : relationship);
      }
      isLongPressRef.current = false;
    },
    [onSelect, isSelected, relationship]
  );

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (onHover) {
        onHover(relationship);
      }
      document.body.style.cursor = "pointer";
    },
    [onHover, relationship]
  );

  const handlePointerOut = useCallback(() => {
    if (onHover) {
      onHover(null);
    }
    document.body.style.cursor = "default";
  }, [onHover]);

  // Update line points dynamically based on animated table positions
  useFrame(() => {
    // Use lookup map instead of find() for better performance
    const fromTable = tableLookupRef.current.get(relationship.fromTable);
    const toTable = tableLookupRef.current.get(relationship.toTable);

    if (fromTable && toTable) {
      const fromTablePos =
        animatedPositions?.get(relationship.fromTable) || fromTable.position;
      const toTablePos =
        animatedPositions?.get(relationship.toTable) || toTable.position;

      // Reuse Vector3 objects instead of creating new ones
      fromCenterRef.current.set(...fromTablePos);
      toCenterRef.current.set(...toTablePos);

      fromCenterRef.current.y += RELATIONSHIP_LINE_Y_OFFSET;
      toCenterRef.current.y += RELATIONSHIP_LINE_Y_OFFSET;

      // Calculate direction from from table to to table
      directionRef.current
        .subVectors(toCenterRef.current, fromCenterRef.current)
        .normalize();

      // Move start/end points to table surface
      getTableSurfacePoint(
        fromCenterRef.current,
        directionRef.current,
        TABLE_RADIUS,
        fromPosRef.current
      );
      getTableSurfacePoint(
        toCenterRef.current,
        directionRef.current.clone().multiplyScalar(-1),
        TABLE_RADIUS,
        toPosRef.current
      );

      // Update currentPoints state to trigger DreiLine re-render
      // Only update if position changed significantly to avoid excessive re-renders
      const newPoints = [fromPosRef.current.clone(), toPosRef.current.clone()];
      const hasChanged =
        currentPoints[0].distanceTo(newPoints[0]) > 0.001 ||
        currentPoints[1].distanceTo(newPoints[1]) > 0.001;

      if (hasChanged) {
        setCurrentPoints(newPoints);
      }

      // Update midpoint for label positioning
      midpointRef.current
        .addVectors(fromPosRef.current, toPosRef.current)
        .multiplyScalar(0.5);

      // Position label above or below based on camera perspective
      if (textRef.current) {
        // Check if camera is above or below the relationship midpoint
        const cameraIsAbove = camera.position.y > midpointRef.current.y;
        const targetOffset = cameraIsAbove ? 0.3 : -0.3;

        // Smoothly transition the label offset
        labelOffsetRef.current = THREE.MathUtils.lerp(
          labelOffsetRef.current,
          targetOffset,
          0.1
        );

        // Set the position first, then look at camera
        textRef.current.position.set(
          midpointRef.current.x,
          midpointRef.current.y + labelOffsetRef.current,
          midpointRef.current.z
        );
        textRef.current.lookAt(camera.position);
      }
    }
  });

  return (
    <group>
      {/* Invisible tube for click detection */}
      <mesh
        ref={tubeRef}
        geometry={tubeGeometry}
        onClick={handleClick}
        onPointerDown={(e) => {
          e.stopPropagation();
          // Prevent OrbitControls from interfering by stopping propagation at native event level
          if (e.nativeEvent) {
            e.nativeEvent.stopPropagation();
            e.nativeEvent.preventDefault();
          }
          isLongPressRef.current = false;
          // Start long-press timer
          if (onLongPress) {
            longPressTimerRef.current = setTimeout(() => {
              isLongPressRef.current = true;
              onLongPress(relationship);
            }, LONG_PRESS_DURATION);
          }
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          // Clear long-press timer if pointer is released before duration
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          // If it was a long press, keep the flag true for a bit longer
          // to prevent the subsequent click from deselecting
          if (isLongPressRef.current) {
            // Keep flag true for a short time to prevent click handler from firing
            setTimeout(() => {
              isLongPressRef.current = false;
            }, 200);
          } else {
            // Reset long press flag immediately if it wasn't a long press
            isLongPressRef.current = false;
          }
        }}
        onPointerCancel={(e) => {
          e.stopPropagation();
          // Clear long-press timer if pointer is cancelled
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          isLongPressRef.current = false;
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={() => {
          handlePointerOut();
          // Clear long-press timer if pointer leaves
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          isLongPressRef.current = false;
        }}
      >
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Visible line */}
      <DreiLine
        ref={lineRef}
        points={currentPoints}
        color={lineColor}
        lineWidth={lineWidth}
        transparent
        opacity={lineOpacity}
      />

      {/* Label */}
      <group ref={textRef}>
        <Text
          position={[0, 0, 0]}
          fontSize={isHovered ? 0.25 : isSelected ? 0.18 : 0.15}
          color={isSelected ? "#ffffff" : isHovered ? "#ffffff" : "#94a3b8"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={isHovered ? 0.02 : isSelected ? 0.015 : 0.01}
          outlineColor="#000000"
        >
          {relationship.fkColumn} → {relationship.pkColumn}
        </Text>
      </group>

      {/* ERD-style cardinality notation (only for selected relationships) */}
      {isSelected && (
        <CardinalityNotation
          relationship={relationship}
          lineColor={lineColor}
        />
      )}
    </group>
  );
}
