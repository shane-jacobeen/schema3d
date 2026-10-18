import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useInteractionHandlers } from "@/visualizer/3d/hooks/use-interaction-handlers";
import {
  consumeFollowingClick,
  usePressGesture,
} from "@/visualizer/3d/hooks/use-press-gesture";
import { LONG_PRESS_DURATION } from "@/visualizer/3d/constants";
import type { DatabaseSchema, Table } from "@/shared/types/schema";

const table: Table = {
  name: "users",
  columns: [],
  position: [0, 0, 0],
  color: "#3b82f6",
  category: "general",
};

const schema: DatabaseSchema = {
  name: "Schema",
  format: "sql",
  tables: [table],
};

describe("long-press selection guard", () => {
  it("keeps the selection through the click that ends the press", async () => {
    vi.useFakeTimers();
    const setSelectedTable = vi.fn();
    const setSelectedRelationship = vi.fn();
    const requestCameraMove = vi.fn();
    const { result: gesture } = renderHook(() =>
      usePressGesture({ onLongPress: () => {} })
    );
    const { result } = renderHook(() =>
      useInteractionHandlers(
        {
          selectedTable: table,
          selectedRelationship: null,
          setSelectedTable,
          setSelectedRelationship,
        },
        { requestCameraMove },
        schema,
        { current: null }
      )
    );

    act(() => {
      gesture.current.begin({ clientX: 5, clientY: 5 });
      vi.advanceTimersByTime(LONG_PRESS_DURATION);
    });

    expect(consumeFollowingClick()).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("pointerup"));
      result.current.handlePointerMissed();
    });

    expect(consumeFollowingClick()).toBe(true);
    expect(setSelectedTable).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(consumeFollowingClick()).toBe(false);

    act(() => {
      result.current.handlePointerMissed();
    });

    expect(setSelectedTable).toHaveBeenCalledWith(null);
    expect(setSelectedRelationship).toHaveBeenCalledWith(null);
    vi.useRealTimers();
  });

  it("pans the camera with one move after selecting a table", () => {
    const requestCameraMove = vi.fn();
    const { result } = renderHook(() =>
      useInteractionHandlers(
        {
          selectedTable: null,
          selectedRelationship: null,
          setSelectedTable: vi.fn(),
          setSelectedRelationship: vi.fn(),
        },
        { requestCameraMove },
        schema,
        { current: null }
      )
    );

    act(() => {
      result.current.handleTableLongPress(table);
    });

    expect(requestCameraMove).toHaveBeenCalledOnce();
    expect(requestCameraMove.mock.calls[0][0].motion).toBe("pan");
  });
});
