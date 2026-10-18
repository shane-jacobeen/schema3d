import { useRef, useEffect, useCallback, type ComponentRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Table } from "@/shared/types/schema";
import { useOrbitControlsRef } from "../../context/orbit-controls-context";
import { usePressGesture } from "../../hooks/use-press-gesture";

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
  meshPointerHandlers: {
    onClick: (e: { stopPropagation: () => void }) => void;
    onPointerDown: (e: {
      stopPropagation: () => void;
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

  useEffect(() => {
    orbitControlsRef.current = orbitControlsContextRef.current;
  }, [orbitControlsContextRef]);

  const onPositionChangeRef = useRef(onPositionChange);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  const onLongPressRef = useRef(onLongPress);
  const isSelectedRef = useRef(isSelected);
  const tableRef = useRef(table);
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
    onDragStartRef.current = onDragStart;
    onDragEndRef.current = onDragEnd;
    onLongPressRef.current = onLongPress;
    isSelectedRef.current = isSelected;
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

  const applyDragMovement = useCallback(
    (clientX: number, clientY: number) => {
      if (
        !onPositionChangeRef.current ||
        !dragStartPositionRef.current ||
        !dragStartPointerRef.current
      ) {
        return;
      }

      const rect = gl.domElement.getBoundingClientRect();
      const currentPointer = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
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
    },
    [camera, gl]
  );

  const attachGlobalDragListeners = useCallback(() => {
    if (globalMoveRef.current) return;

    const handleGlobalPointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      if (event.buttons === 0) {
        endDrag();
        detachGlobalDragListeners();
        return;
      }

      applyDragMovement(event.clientX, event.clientY);
    };

    const handleGlobalPointerUp = () => {
      endDrag();
      detachGlobalDragListeners();
    };

    globalMoveRef.current = handleGlobalPointerMove;
    globalUpRef.current = handleGlobalPointerUp;
    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
  }, [applyDragMovement, detachGlobalDragListeners, endDrag]);

  const startTableDrag = useCallback(
    (event: PointerEvent) => {
      if (
        !isSelectedRef.current ||
        !onPositionChangeRef.current ||
        !dragStartPositionRef.current ||
        !dragStartPointerRef.current ||
        isDraggingRef.current
      ) {
        return;
      }

      isDraggingRef.current = true;
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false;
      }
      attachGlobalDragListeners();
      onDragStartRef.current?.();
      document.body.style.cursor = "grabbing";
      applyDragMovement(event.clientX, event.clientY);
    },
    [applyDragMovement, attachGlobalDragListeners]
  );

  useEffect(() => {
    return () => {
      detachGlobalDragListeners();
    };
  }, [detachGlobalDragListeners]);

  const { begin, isClick } = usePressGesture({
    onLongPress: () => {
      onLongPressRef.current?.(tableRef.current);
    },
    onDrag: startTableDrag,
  });

  const meshPointerHandlers = {
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (!isClick() || !onSelect) {
        return;
      }
      onSelect(table);
    },
    onPointerDown: (e: {
      stopPropagation: () => void;
      clientX: number;
      clientY: number;
    }) => {
      e.stopPropagation();

      if (isSelected && onPositionChange) {
        const rect = gl.domElement.getBoundingClientRect();
        dragStartPointerRef.current = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        dragStartPositionRef.current = new THREE.Vector3(...table.position);
      } else {
        dragStartPointerRef.current = null;
        dragStartPositionRef.current = null;
      }

      begin(e);
    },
    onPointerUp: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      endDrag();
    },
    onPointerCancel: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
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
    },
  };

  return {
    meshPointerHandlers,
  };
}
