import { useCallback, useEffect, useRef } from "react";
import { DRAG_MOVEMENT_THRESHOLD_PX, LONG_PRESS_DURATION } from "../constants";

export type PressGesture = "pending" | "drag" | "long-press";

interface UsePressGestureOptions {
  onLongPress: () => void;
  onDrag?: (event: PointerEvent) => void;
}

/**
 * One pointer-down produces one outcome:
 * long-press selects, drag leaves selection alone, a still release is a click.
 */
export function usePressGesture({
  onLongPress,
  onDrag,
}: UsePressGestureOptions) {
  const gestureRef = useRef<PressGesture>("pending");
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLongPressRef = useRef(onLongPress);
  const onDragRef = useRef(onDrag);
  const detachRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onLongPressRef.current = onLongPress;
    onDragRef.current = onDrag;
  });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const detach = useCallback(() => {
    detachRef.current?.();
    detachRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      detach();
    };
  }, [clearTimer, detach]);

  const begin = useCallback(
    (point: { clientX: number; clientY: number }) => {
      clearTimer();
      detach();
      gestureRef.current = "pending";
      startRef.current = { x: point.clientX, y: point.clientY };

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (gestureRef.current !== "pending") {
          return;
        }
        gestureRef.current = "long-press";
        onLongPressRef.current();
      }, LONG_PRESS_DURATION);

      const handleMove = (event: PointerEvent) => {
        if (gestureRef.current !== "pending" || !startRef.current) {
          return;
        }
        const travel = Math.hypot(
          event.clientX - startRef.current.x,
          event.clientY - startRef.current.y
        );
        if (travel <= DRAG_MOVEMENT_THRESHOLD_PX) {
          return;
        }
        gestureRef.current = "drag";
        clearTimer();
        onDragRef.current?.(event);
      };

      const handleUp = () => {
        clearTimer();
        detach();
      };

      const handleCancel = () => {
        if (gestureRef.current === "pending") {
          gestureRef.current = "drag";
        }
        clearTimer();
        detach();
      };

      detachRef.current = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleCancel);
      };
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleCancel);
    },
    [clearTimer, detach]
  );

  const isClick = useCallback(() => gestureRef.current === "pending", []);

  return { begin, isClick };
}
