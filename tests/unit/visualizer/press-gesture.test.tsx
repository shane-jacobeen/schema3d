import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import {
  consumeFollowingClick,
  usePressGesture,
} from "@/visualizer/3d/hooks/use-press-gesture";
import {
  DRAG_MOVEMENT_THRESHOLD_PX,
  LONG_PRESS_DURATION,
} from "@/visualizer/3d/constants";

function pointer(type: string, x: number, y: number, buttons = 1) {
  return new PointerEvent(type, {
    clientX: x,
    clientY: y,
    buttons,
    bubbles: true,
  });
}

describe("usePressGesture", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("selects on a release that stays within the drag threshold", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onDragStart = vi.fn();
    const { result } = renderHook(() =>
      usePressGesture({ onLongPress, onDragStart })
    );

    act(() => {
      result.current.begin({ clientX: 10, clientY: 10 });
      window.dispatchEvent(
        pointer("pointermove", 10 + DRAG_MOVEMENT_THRESHOLD_PX, 10)
      );
      window.dispatchEvent(pointer("pointerup", 10, 10, 0));
    });

    expect(onDragStart).not.toHaveBeenCalled();
    expect(result.current.isClick()).toBe(true);
    expect(consumeFollowingClick()).toBe(false);

    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_DURATION);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("reports drag start, move, and end on one window subscription", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onDragStart = vi.fn();
    const onDragMove = vi.fn();
    const onDragEnd = vi.fn();
    const { result } = renderHook(() =>
      usePressGesture({ onLongPress, onDragStart, onDragMove, onDragEnd })
    );

    act(() => {
      result.current.begin({ clientX: 0, clientY: 0 });
      window.dispatchEvent(
        pointer("pointermove", DRAG_MOVEMENT_THRESHOLD_PX + 1, 0)
      );
      window.dispatchEvent(
        pointer("pointermove", DRAG_MOVEMENT_THRESHOLD_PX + 12, 4)
      );
    });

    expect(onDragStart).toHaveBeenCalledOnce();
    expect(onDragMove).toHaveBeenCalledOnce();
    expect(result.current.isClick()).toBe(false);

    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_DURATION);
      window.dispatchEvent(pointer("pointerup", 40, 0, 0));
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onDragEnd).toHaveBeenCalledOnce();
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
    expect(consumeFollowingClick()).toBe(true);

    act(() => {
      window.dispatchEvent(pointer("pointerup", 5, 5, 0));
    });

    expect(result.current.isClick()).toBe(false);
    expect(consumeFollowingClick()).toBe(true);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(consumeFollowingClick()).toBe(false);
  });
});
