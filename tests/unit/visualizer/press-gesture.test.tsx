import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { usePressGesture } from "@/visualizer/3d/hooks/use-press-gesture";
import {
  DRAG_MOVEMENT_THRESHOLD_PX,
  LONG_PRESS_DURATION,
} from "@/visualizer/3d/constants";

function pointer(type: string, x: number, y: number) {
  return new PointerEvent(type, { clientX: x, clientY: y, bubbles: true });
}

describe("usePressGesture", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("selects on a release that stays within the drag threshold", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onDrag = vi.fn();
    const { result } = renderHook(() =>
      usePressGesture({ onLongPress, onDrag })
    );

    act(() => {
      result.current.begin({ clientX: 10, clientY: 10 });
      window.dispatchEvent(
        pointer("pointermove", 10 + DRAG_MOVEMENT_THRESHOLD_PX, 10)
      );
      window.dispatchEvent(pointer("pointerup", 10, 10));
    });

    expect(onDrag).not.toHaveBeenCalled();
    expect(result.current.isClick()).toBe(true);

    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_DURATION);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("drops the long-press timer once the pointer drags", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onDrag = vi.fn();
    const { result } = renderHook(() =>
      usePressGesture({ onLongPress, onDrag })
    );

    act(() => {
      result.current.begin({ clientX: 0, clientY: 0 });
      window.dispatchEvent(
        pointer("pointermove", DRAG_MOVEMENT_THRESHOLD_PX + 1, 0)
      );
    });

    expect(onDrag).toHaveBeenCalledOnce();
    expect(result.current.isClick()).toBe(false);

    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_DURATION);
      window.dispatchEvent(pointer("pointerup", 40, 0));
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(result.current.isClick()).toBe(false);
  });

  it("long-presses without treating the later release as a click", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { result } = renderHook(() => usePressGesture({ onLongPress }));

    act(() => {
      result.current.begin({ clientX: 5, clientY: 5 });
      vi.advanceTimersByTime(LONG_PRESS_DURATION);
    });

    expect(onLongPress).toHaveBeenCalledOnce();

    act(() => {
      window.dispatchEvent(pointer("pointerup", 5, 5));
    });

    expect(result.current.isClick()).toBe(false);
  });
});
