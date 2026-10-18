import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCameraControls } from "@/visualizer/3d/hooks/use-camera-controls";
import type { Table } from "@/shared/types/schema";

const table: Table = {
  name: "users",
  columns: [],
  position: [0, 0, 0],
  color: "#3b82f6",
  category: "general",
};

describe("camera move command", () => {
  it("recenter is one frame move to the default view", () => {
    const { result } = renderHook(() => useCameraControls([table]));

    act(() => {
      result.current.handleRecenter();
    });

    expect(result.current.cameraMove?.motion).toBe("frame");
    expect(result.current.cameraMove?.lookAt.toArray()).toEqual([0, 0, 0]);
    expect(result.current.isCameraAnimating).toBe(true);

    act(() => {
      result.current.completeCameraMove();
    });

    expect(result.current.cameraMove).toBeNull();
    expect(result.current.isCameraAnimating).toBe(false);
  });

  it("leaves 3D orbit unrestricted without starting a move", () => {
    const { result } = renderHook(() => useCameraControls([table]));

    act(() => {
      result.current.frameCameraForViewMode("3D");
    });

    expect(result.current.cameraMove).toBeNull();
    expect(result.current.restrictPolarAngle).toBe(false);
  });
});
