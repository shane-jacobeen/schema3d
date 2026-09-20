import { useRef, useMemo, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TABLE_HEIGHT, TABLE_RADIUS, LABEL_BASE_OFFSET } from "../../constants";

interface UseTableAppearanceOptions {
  meshRef: RefObject<THREE.Mesh | null>;
  groupRef: RefObject<THREE.Group | null>;
  textRef: RefObject<THREE.Group | null>;
  tableColor: string;
  columnCount: number;
  isView: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isRelated: boolean;
  isDimmed: boolean;
  isRelationshipHighlighted: boolean;
}

export function useTableAppearance({
  meshRef,
  groupRef,
  textRef,
  tableColor,
  columnCount,
  isView,
  isSelected,
  isHovered,
  isHighlighted,
  isRelated,
  isDimmed,
  isRelationshipHighlighted,
}: UseTableAppearanceOptions) {
  const { camera } = useThree();
  const hoverScaleRef = useRef(1);
  const labelHoverScaleRef = useRef(1);
  const initialLabelY = TABLE_HEIGHT / 2 + LABEL_BASE_OFFSET;
  const labelYRef = useRef(initialLabelY);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      if (isHighlighted && !isSelected) {
        const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.05 + 1;
        meshRef.current.scale.setScalar(pulse);
      } else {
        meshRef.current.scale.setScalar(
          THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1)
        );
      }
    }

    if (groupRef.current) {
      const targetShapeScale = isHovered ? 1.15 : 1;
      hoverScaleRef.current = THREE.MathUtils.lerp(
        hoverScaleRef.current,
        targetShapeScale,
        0.15
      );
      groupRef.current.scale.setScalar(hoverScaleRef.current);
    }

    if (textRef.current) {
      const targetLabelScale = isHovered ? 1.5 : 1;
      labelHoverScaleRef.current = THREE.MathUtils.lerp(
        labelHoverScaleRef.current,
        targetLabelScale,
        0.15
      );
      const relativeLabelScale =
        labelHoverScaleRef.current / Math.max(hoverScaleRef.current, 0.001);
      textRef.current.scale.setScalar(relativeLabelScale);
    }

    if (textRef.current && groupRef.current) {
      const worldPosition = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPosition);

      const cameraDirection = new THREE.Vector3()
        .subVectors(camera.position, worldPosition)
        .normalize();

      const upVector = new THREE.Vector3(0, 1, 0);
      const cameraIsAbove = cameraDirection.dot(upVector) > 0;
      const verticalAlignment = Math.abs(cameraDirection.dot(upVector));

      const baseOffset = 0.3;
      const maxOffset = 0.8;
      const dynamicOffset =
        baseOffset + (maxOffset - baseOffset) * verticalAlignment;

      const newLabelY = cameraIsAbove
        ? TABLE_HEIGHT / 2 + dynamicOffset
        : -TABLE_HEIGHT / 2 - dynamicOffset;

      labelYRef.current = THREE.MathUtils.lerp(
        labelYRef.current,
        newLabelY,
        0.1
      );
      textRef.current.position.y = labelYRef.current;
      textRef.current.lookAt(camera.position);
    }
  });

  const opacity = isDimmed ? 0.6 : 1;
  const emissiveIntensity = isDimmed
    ? 0.06
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

  const dimmedColor = useMemo(() => {
    if (!isDimmed) return tableColor;
    const color = new THREE.Color(tableColor);
    color.multiplyScalar(0.6);
    return color;
  }, [tableColor, isDimmed]);

  const segments = Math.max(3, columnCount);

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

  const edgeTubes = useMemo(() => {
    const positions = edgesGeometry.attributes.position;
    const tubes: Array<{ curve: THREE.LineCurve3; length: number }> = [];

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
        const curve = new THREE.LineCurve3(start, end);
        tubes.push({ curve, length: start.distanceTo(end) });
      }
    }

    return tubes;
  }, [edgesGeometry]);

  const edgeColor = useMemo(() => {
    const color = new THREE.Color(tableColor);
    color.multiplyScalar(isDimmed ? 0.15 : 0.2);
    return color;
  }, [tableColor, isDimmed]);

  return {
    initialLabelY,
    opacity,
    emissiveIntensity,
    dimmedColor,
    cylinderGeometry,
    edgesGeometry,
    edgeTubes,
    edgeColor,
  };
}
