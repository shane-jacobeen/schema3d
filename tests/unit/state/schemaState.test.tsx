import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { DatabaseSchema } from "@/shared/types/schema";
import { useSchemaState } from "@/visualizer/state/hooks/use-schema-state";

const mockApplyLayoutToSchema = vi.fn();
const mockApplyLayoutToSchemaAsync = vi.fn();
const mockShouldApplyLayoutAsync = vi.fn();

vi.mock("@/visualizer/state/utils/schema-utils", () => ({
  applyLayoutToSchema: (...args: unknown[]) => mockApplyLayoutToSchema(...args),
  applyLayoutToSchemaAsync: (...args: unknown[]) =>
    mockApplyLayoutToSchemaAsync(...args),
  shouldApplyLayoutAsync: (...args: unknown[]) =>
    mockShouldApplyLayoutAsync(...args),
}));

describe("useSchemaState", () => {
  const baseSchema: DatabaseSchema = {
    name: "Small Schema",
    format: "sql",
    tables: [
      {
        name: "t1",
        columns: [],
        position: [0, 0, 0],
        color: "#3b82f6",
        category: "general",
      },
    ],
  };

  const largeSchema: DatabaseSchema = {
    ...baseSchema,
    name: "Large Schema",
    tables: Array.from({ length: 200 }, (_, index) => ({
      name: `t_${index}`,
      columns: [],
      position: [index, 0, 0] as [number, number, number],
      color: "#3b82f6",
      category: "general",
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApplyLayoutToSchema.mockImplementation(
      (schema: DatabaseSchema) => schema
    );
    mockApplyLayoutToSchemaAsync.mockImplementation(
      async (schema: DatabaseSchema) => schema
    );
    mockShouldApplyLayoutAsync.mockImplementation(
      (tableCount: number) => tableCount >= 50
    );
  });

  it("uses async layout for large force-layout schemas", async () => {
    const clearAllSelections = vi.fn();
    const handleRecenter = vi.fn();
    const onCategoriesReset = vi.fn();
    mockApplyLayoutToSchemaAsync.mockResolvedValue(largeSchema);

    const { result } = renderHook(() =>
      useSchemaState(clearAllSelections, handleRecenter, () => "3D")
    );

    expect(() => {
      act(() => {
        result.current.handleSchemaChangeFromSelector(
          largeSchema,
          onCategoriesReset
        );
      });
    }).not.toThrow();

    await waitFor(() => {
      expect(mockShouldApplyLayoutAsync).toHaveBeenCalledWith(200, "force");
      expect(mockApplyLayoutToSchemaAsync).toHaveBeenCalled();
      expect(mockApplyLayoutToSchema).not.toHaveBeenCalledWith(
        largeSchema,
        expect.anything(),
        expect.anything()
      );
      expect(result.current.currentSchema.name).toBe("Large Schema");
    });

    expect(clearAllSelections).toHaveBeenCalled();
    expect(handleRecenter).toHaveBeenCalled();
    expect(onCategoriesReset).toHaveBeenCalledWith(largeSchema);
  });
});
