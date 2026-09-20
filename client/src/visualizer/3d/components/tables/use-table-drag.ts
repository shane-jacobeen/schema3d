import {
  useRef,
  useEffect,
  useCallback,
  type ComponentRef,
  type MutableRefObject,
} from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Table } from "@/shared/types/schema";
import { useOrbitControlsRef } from "../../context/orbit-controls-context";
import { LONG_PRESS_DURATION } from "../../constants";

interface UseTableDragOptions {
  table: Table;
  isSelected: boolean;
  onSelect?: (table: Table | null) => void;
  onHover: (table: Table | null) => void;
  onLongPress?: (table: Table) => void;
  onPositionChange?: (
    table: Table,
    newPosition: [number, number, number]
  ) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

interface UseTableDragReturn {
  isDraggingRef: MutableRefObject<boolean>;
  isLongPressRef: MutableRefObject<boolean>;
  meshPointerHandlers: {
    onClick: (e: { stopPropagation: () => void }) => void;
    onPointerDown: (e: {
      stopPropagation: () => void;
      clientX: number;
      clientY: number;
    }) => void;
    onPointerMove: (e: {
      stopPropagation: () => void;
      buttons: number;
      clientX: number;
      clientY: number;
    }) => void;
    onPointerUp: (e: { stopPropagation: () => void }) => void;
    onPointerCancel: (e: { stopPropagation: () => void }) => void;
    onPointerOver: (e: { stopPropagation: () => void }) => void;
    onPointerOut: () => void;
  };
}

export function useTableDrag({
  table,
  isSelected,
  onSelect,
  onHover,
  onLongPress,
  onPositionChange,
  onDragStart,
  onDragEnd,
}: UseTableDragOptions): UseTableDragReturn {
  const { camera, gl } = useThree();
  const isDraggingRef = useRef(false);
  const dragStartPositionRef = useRef<THREE.Vector3 | null>(null);
  const dragStartPointerRef = useRef<THREE.Vector2 | null>(null);
  const orbitControlsContextRef = useOrbitControlsRef();
  const orbitControlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(
    null
  );
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    orbitControlsRef.current = orbitControlsContextRef.current;
  }, [orbitControlsContextRef]);

  const onPositionChangeRef = useRef(onPositionChange);
  const onDragEndRef = useRef(onDragEnd);
  const tableRef = useRef(table);
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
    onDragEndRef.current = onDragEnd;
    tableRef.current = table;
  });

  const globalMoveRef = useRef<((e: PointerEvent) => void) | null>(null);
  const globalUpRef = useRef<(() => void) | null>(null);

  const enableOrbitControls = useCallback(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
  }, []);

  const detachGlobalDragListeners = useCallback(() => {
    if (globalMoveRef.current) {
      window.removeEventListener("pointermove", globalMoveRef.current);
      globalMoveRef.current = null;
    }
    if (globalUpRef.current) {
      window.removeEventListener("pointerup", globalUpRef.current);
      globalUpRef.current = null;
    }
  }, []);

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) {
      return;
    }
    isDraggingRef.current = false;
    dragStartPositionRef.current = null;
    dragStartPointerRef.current = null;
    enableOrbitControls();
    onDragEndRef.current?.();
    document.body.style.cursor = "default";
  }, [enableOrbitControls]);

  const attachGlobalDragListeners = useCallback(() => {
    if (globalMoveRef.current) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (
        !isDraggingRef.current ||
        !onPositionChangeRef.current ||
        !dragStartPositionRef.current ||
        !dragStartPointerRef.current
      ) {
        return;
      }

      if (e.buttons === 0) {
        endDrag();
        detachGlobalDragListeners();
        return;
      }

      const rect = gl.domElement.getBoundingClientRect();
      const currentPointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const deltaX = currentPointer.x - dragStartPointerRef.current.x;
      const deltaY = currentPointer.y - dragStartPointerRef.current.y;

      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);

      const cameraRight = new THREE.Vector3();
      cameraRight.crossVectors(cameraDirection, camera.up).normalize();
      const cameraUp = camera.up.clone().normalize();

      const distance = camera.position.distanceTo(dragStartPositionRef.current);
      const scale = distance * 0.5;

      const movement = new THREE.Vector3()
        .addScaledVector(cameraRight, deltaX * scale)
        .addScaledVector(cameraUp, deltaY * scale);

      const newPosition = dragStartPositionRef.current.clone().add(movement);
      onPositionChangeRef.current(tableRef.current, [
        newPosition.x,
        newPosition.y,
        newPosition.z,
      ]);
    };

    const handleGlobalPointerUp = () => {
      endDrag();
      detachGlobalDragListeners();
    };

    globalMoveRef.current = handleGlobalPointerMove;
    globalUpRef.current = handleGlobalPointerUp;
    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
  }, [camera, gl, detachGlobalDragListeners, endDrag]);

  useEffect(() => {
    return () => {
      detachGlobalDragListeners();
    };
  }, [detachGlobalDragListeners]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const meshPointerHandlers = {
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (!isLongPressRef.current && onSelect) {
        onSelect(isSelected ? null : table);
      }
    },
    onPointerDown: (e: {
      stopPropagation: () => void;
      clientX: number;
      clientY: number;
    }) => {
      e.stopPropagation();
      isLongPressRef.current = false;

      if (isSelected && onPositionChange) {
        const rect = gl.domElement.getBoundingClientRect();
        dragStartPointerRef.current = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        dragStartPositionRef.current = new THREE.Vector3(...table.position);
      }

      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          isLongPressRef.current = true;
          onLongPress(table);
          if (isDraggingRef.current) {
            isDraggingRef.current = false;
            enableOrbitControls();
            onDragEnd?.();
            document.body.style.cursor = "default";
          }
        }, LONG_PRESS_DURATION);
      }
    },
    onPointerMove: (e: {
      stopPropagation: () => void;
      buttons: number;
      clientX: number;
      clientY: number;
    }) => {
      if (e.buttons === 0) {
        if (isDraggingRef.current) {
          endDrag();
        }
        return;
      }

      if (
        !onPositionChange ||
        !dragStartPositionRef.current ||
        !dragStartPointerRef.current ||
        !isSelected ||
        isLongPressRef.current
      ) {
        return;
      }

      e.stopPropagation();

      const rect = gl.domElement.getBoundingClientRect();
      const currentPointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const deltaX = currentPointer.x - dragStartPointerRef.current.x;
      const deltaY = currentPointer.y - dragStartPointerRef.current.y;

      const movementThreshold = 0.01;
      const hasMoved =
        Math.abs(deltaX) > movementThreshold ||
        Math.abs(deltaY) > movementThreshold;

      if (!isDraggingRef.current && hasMoved) {
        isDraggingRef.current = true;
        clearLongPressTimer();
        isLongPressRef.current = false;

        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = false;
        }

        attachGlobalDragListeners();
        onDragStart?.();
        document.body.style.cursor = "grabbing";
      }

      if (!isDraggingRef.current) {
        return;
      }

      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);

      const cameraRight = new THREE.Vector3();
      cameraRight.crossVectors(cameraDirection, camera.up).normalize();
      const cameraUp = camera.up.clone().normalize();

      const distance = camera.position.distanceTo(dragStartPositionRef.current);
      const scale = distance * 0.5;

      const movement = new THREE.Vector3()
        .addScaledVector(cameraRight, deltaX * scale)
        .addScaledVector(cameraUp, deltaY * scale);

      const newPosition = dragStartPositionRef.current.clone().add(movement);
      onPositionChange(table, [newPosition.x, newPosition.y, newPosition.z]);
    },
    onPointerUp: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      clearLongPressTimer();

      if (isLongPressRef.current) {
        setTimeout(() => {
          isLongPressRef.current = false;
        }, 200);
      } else {
        isLongPressRef.current = false;
      }

      endDrag();
    },
    onPointerCancel: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      clearLongPressTimer();
      isLongPressRef.current = false;
      endDrag();
    },
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (isDraggingRef.current) {
        return;
      }
      onHover(table);
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      onHover(null);
      if (!isDraggingRef.current) {
        document.body.style.cursor = "default";
      }
      clearLongPressTimer();
      isLongPressRef.current = false;
    },
  };

  return {
    isDraggingRef,
    isLongPressRef,
    meshPointerHandlers,
  };
}
