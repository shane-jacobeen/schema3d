import {
  useRef,
  useEffect,
  type MutableRefObject,
  type RefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ANIMATION_DURATION } from "../../constants";
import { easeInOutCubic } from "../../utils/camera-utils";

interface UseTableLayoutAnimationOptions {
  groupRef: RefObject<THREE.Group | null>;
  tablePosition: [number, number, number];
  tableName: string;
  targetPosition?: [number, number, number];
  animationStartTime?: number | null;
  isAnimating?: boolean;
  onAnimatedPositionChange?: (
    tableName: string,
    position: [number, number, number]
  ) => void;
}

export function useTableLayoutAnimation({
  groupRef,
  tablePosition,
  tableName,
  targetPosition,
  animationStartTime,
  isAnimating = false,
  onAnimatedPositionChange,
}: UseTableLayoutAnimationOptions): MutableRefObject<[number, number, number]> {
  const startPositionRef = useRef<[number, number, number]>(tablePosition);
  const currentAnimatedPositionRef =
    useRef<[number, number, number]>(tablePosition);
  const lastReportedPositionRef = useRef<[number, number, number] | null>(null);

  useEffect(() => {
    if (!isAnimating) {
      startPositionRef.current = tablePosition;
      currentAnimatedPositionRef.current = tablePosition;
      lastReportedPositionRef.current = null;

      if (groupRef.current) {
        groupRef.current.position.set(
          tablePosition[0],
          tablePosition[1],
          tablePosition[2]
        );
      }
    }
  }, [tablePosition, tableName, isAnimating, groupRef]);

  useEffect(() => {
    if (targetPosition && isAnimating) {
      startPositionRef.current = currentAnimatedPositionRef.current;
    }
  }, [targetPosition, isAnimating]);

  useFrame(() => {
    if (
      groupRef.current &&
      targetPosition &&
      animationStartTime != null &&
      isAnimating
    ) {
      const now = Date.now();
      const elapsed = (now - animationStartTime) / 1000;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedProgress = easeInOutCubic(progress);

      const currentPos = startPositionRef.current;
      const targetPos = targetPosition;
      const animatedPos: [number, number, number] =
        progress >= 1
          ? [targetPos[0], targetPos[1], targetPos[2]]
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

      const shouldUpdate =
        !lastReportedPositionRef.current ||
        Math.abs(animatedPos[0] - lastReportedPositionRef.current[0]) > 0.01 ||
        Math.abs(animatedPos[1] - lastReportedPositionRef.current[1]) > 0.01 ||
        Math.abs(animatedPos[2] - lastReportedPositionRef.current[2]) > 0.01;

      if (shouldUpdate && onAnimatedPositionChange) {
        onAnimatedPositionChange(tableName, animatedPos);
        lastReportedPositionRef.current = animatedPos;
      }
    } else if (groupRef.current && !isAnimating) {
      groupRef.current.position.set(
        tablePosition[0],
        tablePosition[1],
        tablePosition[2]
      );
      currentAnimatedPositionRef.current = tablePosition;
    }
  });

  return currentAnimatedPositionRef;
}
