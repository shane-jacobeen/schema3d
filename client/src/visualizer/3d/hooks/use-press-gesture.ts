import { useCallback, useEffect, useRef } from "react";
import { DRAG_MOVEMENT_THRESHOLD_PX, LONG_PRESS_DURATION } from "../constants";

export type PressGesture = "pending" | "drag" | "long-press";

interface UsePressGestureOptions {
  onLongPress: () => void;
  onDragStart?: (event: PointerEvent) => void;
  onDragMove?: (event: PointerEvent) => void;
  onDragEnd?: () => void;
}

/**
 * True from a long-press until the pointerup and the click that follows it.
 * Shared across gesture instances so click-away and pointer-missed see one flag.
 */
let consumedClick = false;
let clearConsumedTimer: ReturnType<typeof setTimeout> | null = null;

function armConsumedClick() {
  if (clearConsumedTimer) {
    clearTimeout(clearConsumedTimer);
    clearConsumedTimer = null;
  }
  consumedClick = true;
}

function releaseConsumedClickAfterPointerUp() {
  if (clearConsumedTimer) {
    clearTimeout(clearConsumedTimer);
  }
  clearConsumedTimer = setTimeout(() => {
    clearConsumedTimer = null;
    consumedClick = false;
  }, 0);
}

export function consumeFollowingClick(): boolean {
  return consumedClick;
}

/**
 * One pointer-down produces one outcome:
 * long-press selects, drag leaves selection alone, a still release is a click.
 * This hook owns the window listeners for that pointer.
 */
export function usePressGesture({
  onLongPress,
  onDragStart,
  onDragMove,
  onDragEnd,
}: UsePressGestureOptions) {
  const gestureRef = useRef<PressGesture>("pending");
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLongPressRef = useRef(onLongPress);
  const onDragStartRef = useRef(onDragStart);
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndRef = useRef(onDragEnd);
  const detachRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onLongPressRef.current = onLongPress;
    onDragStartRef.current = onDragStart;
    onDragMoveRef.current = onDragMove;
    onDragEndRef.current = onDragEnd;
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
      if (gestureRef.current === "long-press") {
        consumedClick = false;
        if (clearConsumedTimer) {
          clearTimeout(clearConsumedTimer);
          clearConsumedTimer = null;
        }
      }
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
        armConsumedClick();
        onLongPressRef.current();
      }, LONG_PRESS_DURATION);

      const finish = (cancelled: boolean) => {
        clearTimer();
        const gesture = gestureRef.current;
        if (gesture === "drag") {
          onDragEndRef.current?.();
        }
        if (gesture === "long-press") {
          releaseConsumedClickAfterPointerUp();
        }
        if (cancelled && gesture === "pending") {
          gestureRef.current = "drag";
        }
        detach();
      };

      const handleMove = (event: PointerEvent) => {
        if (gestureRef.current === "drag") {
          if (event.buttons === 0) {
            finish(false);
            return;
          }
          onDragMoveRef.current?.(event);
          return;
        }
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
        onDragStartRef.current?.(event);
      };

      const handleUp = () => {
        finish(false);
      };

      const handleCancel = () => {
        finish(true);
      };

      detachRef.current = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp, true);
        window.removeEventListener("pointercancel", handleCancel, true);
      };
      window.addEventListener("pointermove", handleMove);
      // Capture so a mesh stopPropagation cannot skip the release.
      window.addEventListener("pointerup", handleUp, true);
      window.addEventListener("pointercancel", handleCancel, true);
    },
    [clearTimer, detach]
  );

  const isClick = useCallback(() => gestureRef.current === "pending", []);

  return { begin, isClick };
}
