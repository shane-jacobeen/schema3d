import { useState, useRef, useCallback } from "react";
import type { DatabaseSchema } from "@/shared/types/schema";

interface UseTableAnimationReturn {
  targetPositions: Map<string, [number, number, number]>;
  animatedPositions: Map<string, [number, number, number]>;
  animationStartTime: number | null;
  isAnimating: boolean;
  animatedPositionsRef: React.MutableRefObject<
    Map<string, [number, number, number]>
  >;
  startTableAnimation: (schemaLayout: DatabaseSchema) => void;
  onAnimatedPositionChange: (
    tableName: string,
    position: [number, number, number]
  ) => void;
}

export function useTableAnimation(
  setCurrentSchema: React.Dispatch<React.SetStateAction<DatabaseSchema>>
): UseTableAnimationReturn {
  // Use state to track ref values for render (to avoid accessing refs during render)
  const [animationStartTimeState, setAnimationStartTimeState] = useState<
    number | null
  >(null);
  const [isAnimatingState, setIsAnimatingState] = useState(false);

  const [targetPositions, setTargetPositions] = useState<
    Map<string, [number, number, number]>
  >(new Map());
  const [animatedPositions, setAnimatedPositions] = useState<
    Map<string, [number, number, number]>
  >(new Map());
  const animationStartTimeRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const animatedPositionsRef = useRef<Map<string, [number, number, number]>>(
    new Map()
  );
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTableAnimation = useCallback(
    (schemaLayout: DatabaseSchema) => {
      // Validate schemaLayout
      if (
        !schemaLayout ||
        !schemaLayout.tables ||
        !Array.isArray(schemaLayout.tables)
      ) {
        console.error(
          "Invalid schemaLayout passed to startTableAnimation:",
          schemaLayout
        );
        return;
      }

      // Cancel any pending animation
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      // Get current schema positions as starting points
      setCurrentSchema((prevSchema) => {
        // Validate prevSchema
        if (
          !prevSchema ||
          !prevSchema.tables ||
          !Array.isArray(prevSchema.tables)
        ) {
          console.error(
            "Invalid prevSchema in startTableAnimation:",
            prevSchema
          );
          return prevSchema;
        }

        // Initialize animatedPositions with current table positions
        const initialPositions = new Map<string, [number, number, number]>();
        prevSchema.tables.forEach((table) => {
          initialPositions.set(table.name, table.position);
        });

        animatedPositionsRef.current = initialPositions;
        setAnimatedPositions(new Map(initialPositions));

        // Set target positions from the new layout
        const newTargetPositions = new Map<string, [number, number, number]>();
        schemaLayout.tables.forEach((table) => {
          newTargetPositions.set(table.name, table.position);
        });
        setTargetPositions(newTargetPositions);
        const startTime = Date.now();
        animationStartTimeRef.current = startTime;
        isAnimatingRef.current = true;
        setAnimationStartTimeState(startTime);
        setIsAnimatingState(true);

        // Update schema after animation completes
        animationTimeoutRef.current = setTimeout(() => {
          // Update schema with target positions from schemaLayout
          // Tables should be at exact target positions by now (Table3D snaps to exact target when progress >= 1)
          setCurrentSchema(schemaLayout);

          // Keep isAnimatingRef true until schema update is confirmed
          // This prevents RelationshipLines from flashing when it falls back to table.position
          // RelationshipLines only uses animatedPositions when isAnimatingRef is true
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Now safe to clear - schema should be updated and RelationshipLines will use table.position
              isAnimatingRef.current = false;
              animatedPositionsRef.current.clear();
              setAnimatedPositions(new Map());
              setAnimationStartTimeState(null);
              setIsAnimatingState(false);
              animationTimeoutRef.current = null;
            });
          });
        }, 1000);

        return prevSchema; // Don't update schema yet, wait for animation
      });
    },
    [setCurrentSchema, setAnimationStartTimeState, setIsAnimatingState]
  );

  const onAnimatedPositionChange = useCallback(
    (tableName: string, position: [number, number, number]) => {
      // Update ref immediately for useFrame access
      animatedPositionsRef.current.set(tableName, position);

      // Update state immediately to ensure RelationshipLines get updates
      // Create a new Map to trigger React re-render
      setAnimatedPositions(new Map(animatedPositionsRef.current));
    },
    []
  );

  return {
    targetPositions,
    animatedPositions,
    animationStartTime: animationStartTimeState,
    isAnimating: isAnimatingState,
    animatedPositionsRef,
    startTableAnimation,
    onAnimatedPositionChange,
  };
}
