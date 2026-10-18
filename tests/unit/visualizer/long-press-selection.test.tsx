import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useInteractionHandlers } from "@/visualizer/3d/hooks/use-interaction-handlers";
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
    const setSelectedTable = vi.fn();
    const setSelectedRelationship = vi.fn();
    const { result } = renderHook(() =>
      useInteractionHandlers(
        {
          selectedTable: table,
          selectedRelationship: null,
          setSelectedTable,
          setSelectedRelationship,
        },
        {
          setRecenterTarget: vi.fn(),
          setRecenterLookAt: vi.fn(),
          setRecenterTranslateOnly: vi.fn(),
          setRecenterOrbitOnly: vi.fn(),
          setShouldRecenter: vi.fn(),
        },
        schema,
        { current: null }
      )
    );

    act(() => {
      result.current.setLongPressFlag();
    });

    act(() => {
      window.dispatchEvent(new Event("pointerup"));
      result.current.handlePointerMissed();
    });

    expect(result.current.justLongPressedRef.current).toBe(true);
    expect(setSelectedTable).not.toHaveBeenCalled();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.justLongPressedRef.current).toBe(false);

    act(() => {
      result.current.handlePointerMissed();
    });

    expect(setSelectedTable).toHaveBeenCalledWith(null);
    expect(setSelectedRelationship).toHaveBeenCalledWith(null);
  });
});
