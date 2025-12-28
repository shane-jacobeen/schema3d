import { useRef, useMemo, useState, useEffect, type ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Table3DProps } from "../../types";
import {
  LONG_PRESS_DURATION,
  TABLE_HEIGHT,
  TABLE_RADIUS,
  EDGE_TUBE_RADIUS,
  ANIMATION_DURATION,
  LABEL_BASE_OFFSET,
} from "../../constants";
import { easeInOutCubic } from "../../utils/camera-utils";

export function Table3D({
  table,
  isSelected,
  isHovered,
  isHighlighted = false,
  isRelated = false,
  isDimmed = false,
  isRelationshipHighlighted = false,
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
  const hoverScaleRef = useRef(1);
  const [labelY, setLabelY] = useState(TABLE_HEIGHT / 2 + LABEL_BASE_OFFSET);
  const { camera, gl } = useThree();
  const startPositionRef = useRef<[number, number, number]>(table.position);
  const currentAnimatedPositionRef = useRef<[number, number, number]>(
    table.position
  );
  const lastReportedPositionRef = useRef<[number, number, number] | null>(null);

  // Reset position refs when table position changes and not animating
  useEffect(() => {
    if (!isAnimating) {
      startPositionRef.current = table.position;
      currentAnimatedPositionRef.current = table.position;
      lastReportedPositionRef.current = null;

      if (groupRef.current) {
        groupRef.current.position.set(
          table.position[0],
          table.position[1],
          table.position[2]
        );
      }
    }
  }, [table.position, table.name, isAnimating]);

  // Drag state
  const isDraggingRef = useRef(false);
  const dragStartPositionRef = useRef<THREE.Vector3 | null>(null);
  const dragStartPointerRef = useRef<THREE.Vector2 | null>(null);
  const orbitControlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(
    null
  );

  // Get OrbitControls reference
  useEffect(() => {
    orbitControlsRef.current =
      (window as { __orbitControls?: ComponentRef<typeof OrbitControls> })
        .__orbitControls ?? null;
  }, []);

  // Global pointer handlers for dragging (handles movement outside the table)
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (
        !isDraggingRef.current ||
        !onPositionChange ||
        !dragStartPositionRef.current ||
        !dragStartPointerRef.current
      ) {
        return;
      }

      // Only process drag if button is still pressed
      if (e.buttons === 0) {
        // Button released, end drag
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          dragStartPositionRef.current = null;
          dragStartPointerRef.current = null;
          if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = true;
          }
          onDragEnd?.();
          document.body.style.cursor = "default";
        }
        return;
      }

      // Calculate pointer movement in normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      const currentPointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      // Calculate movement delta
      const deltaX = currentPointer.x - dragStartPointerRef.current.x;
      const deltaY = currentPointer.y - dragStartPointerRef.current.y;

      // Project movement onto a plane perpendicular to camera view
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);

      // Create right and up vectors relative to camera
      const cameraRight = new THREE.Vector3();
      cameraRight.crossVectors(cameraDirection, camera.up).normalize();
      const cameraUp = camera.up.clone().normalize();

      // Calculate movement in world space
      // Scale factor based on distance from camera
      const distance = camera.position.distanceTo(dragStartPositionRef.current);
      const scale = distance * 0.5; // Adjust sensitivity

      const movement = new THREE.Vector3()
        .addScaledVector(cameraRight, deltaX * scale)
        .addScaledVector(cameraUp, deltaY * scale);

      // Calculate new position
      const newPosition = dragStartPositionRef.current.clone().add(movement);

      // Update table position
      onPositionChange(table, [newPosition.x, newPosition.y, newPosition.z]);
    };

    const handleGlobalPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        dragStartPositionRef.current = null;
        dragStartPointerRef.current = null;
        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = true;
        }
        onDragEnd?.();
        document.body.style.cursor = "default";
      }
    };

    // Always add listeners - they check isDraggingRef internally
    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [onPositionChange, onDragEnd, table, camera, gl]);

  // Long-press detection
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      if (isHighlighted && !isSelected) {
        const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.05 + 1;
        meshRef.current.scale.setScalar(pulse);
      } else {
        // Reset scale to 1 when not highlighted
        meshRef.current.scale.setScalar(
          THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1)
        );
      }
    }

    // Smooth hover scale transition
    if (groupRef.current) {
      const targetHoverScale = isHovered ? 1.15 : 1;
      hoverScaleRef.current = THREE.MathUtils.lerp(
        hoverScaleRef.current,
        targetHoverScale,
        0.15
      );
      groupRef.current.scale.setScalar(hoverScaleRef.current);
    }

    // Position label above or below based on camera perspective
    if (textRef.current && groupRef.current) {
      const worldPosition = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPosition);

      // Calculate camera direction relative to table
      const cameraDirection = new THREE.Vector3()
        .subVectors(camera.position, worldPosition)
        .normalize();

      // Check if camera is above or below the table (using dot product with up vector)
      const upVector = new THREE.Vector3(0, 1, 0);
      const cameraIsAbove = cameraDirection.dot(upVector) > 0;

      // Calculate how directly above/below the camera is (0 = horizontal, 1 = directly above/below)
      const verticalAlignment = Math.abs(cameraDirection.dot(upVector));

      // Increase offset when camera is more directly above/below to prevent occlusion
      // When directly above/below (verticalAlignment = 1), use larger offset
      // When horizontal (verticalAlignment = 0), use smaller offset
      const baseOffset = 0.3;
      const maxOffset = 0.8; // Maximum offset when directly above/below
      const dynamicOffset =
        baseOffset + (maxOffset - baseOffset) * verticalAlignment;

      // Calculate label position: above top when viewed from above, below bottom when viewed from below
      const newLabelY = cameraIsAbove
        ? TABLE_HEIGHT / 2 + dynamicOffset // Above the top
        : -TABLE_HEIGHT / 2 - dynamicOffset; // Below the bottom

      // Smoothly transition the label position
      const smoothedY = THREE.MathUtils.lerp(labelY, newLabelY, 0.1);
      if (Math.abs(smoothedY - labelY) > 0.01) {
        setLabelY(smoothedY);
      }

      // Make text always face the camera
      textRef.current.lookAt(camera.position);
    }
  });

  const opacity = isDimmed ? 0.6 : 1;
  const emissiveIntensity = isDimmed
    ? 0.06 // Reduced emissive when dimmed
    : isHighlighted
      ? 0.7
      : isSelected
        ? 0.5
        : isHovered
          ? 0.3
          : isRelated
            ? 0.4
            : isRelationshipHighlighted
              ? 0.35
              : 0.1;

  // Dimmed color - darker version of the table color
  const dimmedColor = useMemo(() => {
    if (!isDimmed) return table.color;
    const color = new THREE.Color(table.color);
    color.multiplyScalar(0.6); // Make it 40% darker
    return color;
  }, [table.color, isDimmed]);

  // Number of sides equals number of columns (minimum 3 for triangle)
  // Exclude virtual relationship columns from count
  const actualColumns = table.columns.filter(
    (col) => !col.name.startsWith("_ref_")
  );
  const segments = Math.max(3, actualColumns.length);
  const isView = table.isView === true;

  // Create cylinder geometry - open ended (no top/bottom) for views, closed for tables
  const cylinderGeometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        TABLE_RADIUS,
        TABLE_RADIUS,
        TABLE_HEIGHT,
        segments,
        1,
        isView
      ),
    [segments, isView]
  );

  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(cylinderGeometry),
    [cylinderGeometry]
  );

  // Extract edge positions and create tube geometries for edges
  const edgeTubes = useMemo(() => {
    const positions = edgesGeometry.attributes.position;
    const tubes: Array<{ curve: THREE.LineCurve3; length: number }> = [];

    // Group positions into pairs (each edge has 2 points)
    for (let i = 0; i < positions.count; i += 2) {
      if (i + 1 < positions.count) {
        const start = new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
        const end = new THREE.Vector3(
          positions.getX(i + 1),
          positions.getY(i + 1),
          positions.getZ(i + 1)
        );

        // Create a line curve for this straight edge
        const curve = new THREE.LineCurve3(start, end);
        const length = start.distanceTo(end);
        tubes.push({ curve, length });
      }
    }

    return tubes;
  }, [edgesGeometry]);

  // Use much darker version of the table color for edges (higher contrast)
  const edgeColor = useMemo(() => {
    const color = new THREE.Color(table.color);
    if (isDimmed) {
      color.multiplyScalar(0.15); // Darker when dimmed
    } else {
      color.multiplyScalar(0.2); // Make it 80% darker (20% of original brightness) for higher contrast
    }
    return color;
  }, [table.color, isDimmed]);
  // Update start position when target changes
  useEffect(() => {
    if (targetPosition && isAnimating) {
      startPositionRef.current = currentAnimatedPositionRef.current;
    }
  }, [targetPosition, isAnimating]);

  // Animate position when target changes
  useFrame(({ clock: _clock }) => {
    if (
      groupRef.current &&
      targetPosition &&
      animationStartTime != null &&
      isAnimating
    ) {
      // Calculate elapsed time since animation started
      const now = Date.now();
      const elapsed = (now - animationStartTime) / 1000;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Easing function (ease-in-out cubic)
      const easedProgress = easeInOutCubic(progress);

      // Interpolate position - snap to exact target when animation completes
      const currentPos = startPositionRef.current;
      const targetPos = targetPosition;
      const animatedPos: [number, number, number] =
        progress >= 1
          ? [targetPos[0], targetPos[1], targetPos[2]] // Exact target when complete
          : [
              THREE.MathUtils.lerp(currentPos[0], targetPos[0], easedProgress),
              THREE.MathUtils.lerp(currentPos[1], targetPos[1], easedProgress),
              THREE.MathUtils.lerp(currentPos[2], targetPos[2], easedProgress),
            ];

      currentAnimatedPositionRef.current = animatedPos;
      groupRef.current.position.set(
        animatedPos[0],
        animatedPos[1],
        animatedPos[2]
      );

      // Throttle position updates to reduce state update frequency
      // Only update if position changed significantly (0.01 units) or animation just started
      const shouldUpdate =
        !lastReportedPositionRef.current ||
        Math.abs(animatedPos[0] - lastReportedPositionRef.current[0]) > 0.01 ||
        Math.abs(animatedPos[1] - lastReportedPositionRef.current[1]) > 0.01 ||
        Math.abs(animatedPos[2] - lastReportedPositionRef.current[2]) > 0.01;

      if (shouldUpdate && onAnimatedPositionChange) {
        onAnimatedPositionChange(table.name, animatedPos);
        lastReportedPositionRef.current = animatedPos;
      }
    } else if (groupRef.current && !isAnimating) {
      // Use actual table position when not animating
      groupRef.current.position.set(
        table.position[0],
        table.position[1],
        table.position[2]
      );
      currentAnimatedPositionRef.current = table.position;
    }
  });

  return (
    <group ref={groupRef} position={table.position}>
      <mesh
        ref={meshRef}
        geometry={cylinderGeometry}
        onClick={(e) => {
          e.stopPropagation();
          // Only select if it wasn't a long press
          if (!isLongPressRef.current && onSelect) {
            // Toggle selection: if already selected, deselect; otherwise select
            const tableToSelect = isSelected ? null : table;
            onSelect(tableToSelect);
          }
          // Don't reset the flag here - let onPointerUp handle it
          // This prevents race conditions between onClick and onPointerUp
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          isLongPressRef.current = false;

          // Only allow dragging if table is selected
          if (isSelected && onPositionChange) {
            // Store initial pointer position for drag detection
            const rect = gl.domElement.getBoundingClientRect();
            dragStartPointerRef.current = new THREE.Vector2(
              ((e.clientX - rect.left) / rect.width) * 2 - 1,
              -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            dragStartPositionRef.current = new THREE.Vector3(...table.position);
          }

          // Start long-press timer
          if (onLongPress) {
            longPressTimerRef.current = setTimeout(() => {
              isLongPressRef.current = true;
              onLongPress(table);
              // Cancel drag if long press occurs
              if (isDraggingRef.current) {
                isDraggingRef.current = false;
                if (orbitControlsRef.current) {
                  orbitControlsRef.current.enabled = true;
                }
                onDragEnd?.();
                document.body.style.cursor = "default";
              }
            }, LONG_PRESS_DURATION);
          }
        }}
        onPointerMove={(e) => {
          // Only process drag if button is pressed
          if (e.buttons === 0) {
            // Button not pressed, end drag if active
            if (isDraggingRef.current) {
              isDraggingRef.current = false;
              dragStartPositionRef.current = null;
              dragStartPointerRef.current = null;
              if (orbitControlsRef.current) {
                orbitControlsRef.current.enabled = true;
              }
              onDragEnd?.();
              document.body.style.cursor = "default";
            }
            return;
          }

          if (
            !onPositionChange ||
            !dragStartPositionRef.current ||
            !dragStartPointerRef.current
          ) {
            return;
          }

          // Only allow dragging if table is selected
          if (!isSelected) {
            return;
          }

          // Don't drag if long press occurred
          if (isLongPressRef.current) {
            return;
          }

          e.stopPropagation();

          // Calculate pointer movement in normalized device coordinates
          const rect = gl.domElement.getBoundingClientRect();
          const currentPointer = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
          );

          // Calculate movement delta
          const deltaX = currentPointer.x - dragStartPointerRef.current.x;
          const deltaY = currentPointer.y - dragStartPointerRef.current.y;

          // Only start dragging if there's significant movement (to avoid interfering with clicks)
          const movementThreshold = 0.01;
          const hasMoved =
            Math.abs(deltaX) > movementThreshold ||
            Math.abs(deltaY) > movementThreshold;

          if (!isDraggingRef.current && hasMoved) {
            // Start dragging
            isDraggingRef.current = true;

            // Cancel long press if we're dragging
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
              isLongPressRef.current = false;
            }

            // Disable OrbitControls while dragging
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = false;
            }

            // Notify parent that dragging has started
            onDragStart?.();

            // Change cursor
            document.body.style.cursor = "grabbing";
          }

          if (!isDraggingRef.current) {
            return;
          }

          // Project movement onto a plane perpendicular to camera view
          const cameraDirection = new THREE.Vector3();
          camera.getWorldDirection(cameraDirection);

          // Create right and up vectors relative to camera
          const cameraRight = new THREE.Vector3();
          cameraRight.crossVectors(cameraDirection, camera.up).normalize();
          const cameraUp = camera.up.clone().normalize();

          // Calculate movement in world space
          // Scale factor based on distance from camera
          const distance = camera.position.distanceTo(
            dragStartPositionRef.current
          );
          const scale = distance * 0.5; // Adjust sensitivity

          const movement = new THREE.Vector3()
            .addScaledVector(cameraRight, deltaX * scale)
            .addScaledVector(cameraUp, deltaY * scale);

          // Calculate new position
          const newPosition = dragStartPositionRef.current
            .clone()
            .add(movement);

          // Update table position
          onPositionChange(table, [
            newPosition.x,
            newPosition.y,
            newPosition.z,
          ]);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();

          // Clear long-press timer if pointer is released before duration
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }

          // If it was a long press, keep the flag true for a bit longer
          // to prevent the subsequent click from firing
          if (isLongPressRef.current) {
            // Keep flag true for a short time to prevent click handler from firing
            setTimeout(() => {
              isLongPressRef.current = false;
            }, 200);
          } else {
            // Reset long press flag immediately if it wasn't a long press
            isLongPressRef.current = false;
          }

          // End drag
          if (isDraggingRef.current) {
            isDraggingRef.current = false;
            dragStartPositionRef.current = null;
            dragStartPointerRef.current = null;

            // Re-enable OrbitControls
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = true;
            }

            // Notify parent that dragging has ended
            onDragEnd?.();

            // Reset cursor
            document.body.style.cursor = "default";
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

          // End drag if active
          if (isDraggingRef.current) {
            isDraggingRef.current = false;
            dragStartPositionRef.current = null;
            dragStartPointerRef.current = null;

            // Re-enable OrbitControls
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = true;
            }

            // Notify parent that dragging has ended
            onDragEnd?.();

            // Reset cursor
            document.body.style.cursor = "default";
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          // Suppress hover events while dragging
          if (isDraggingRef.current) {
            return;
          }
          onHover(table);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover(null);
          if (!isDraggingRef.current) {
            document.body.style.cursor = "default";
          }
          // Clear long-press timer if pointer leaves
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          isLongPressRef.current = false;
        }}
      >
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
      ;{/* Edge outline rendered as tubes for both tables and views */}
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
      {/* Additional edge tubes for selected table/view visualization */}
      {isSelected &&
        edgeTubes.map((edge, index) => {
          const selectedEdgeColor = new THREE.Color(table.color).multiplyScalar(
            0.5
          );

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
      <group ref={textRef}>
        <Text
          position={[0, labelY, 0]}
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
}
