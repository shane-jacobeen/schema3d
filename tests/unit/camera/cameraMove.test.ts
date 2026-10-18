import { describe, it, expect, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import * as THREE from "three";
import { useCameraControls } from "@/visualizer/3d/hooks/use-camera-controls";
import { orbitControlsRefHolder } from "@/visualizer/3d/context/orbit-controls-context";
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

describe("2D framing limit", () => {
  afterEach(() => {
    orbitControlsRefHolder.current = null;
  });

  it("does not dolly inward when the framed move finishes ahead of the schema limit", () => {
    const target = new THREE.Vector3(0, 0, 0);
    const position = new THREE.Vector3(0, 30, 40);
    orbitControlsRefHolder.current = {
      target,
      object: { position },
    } as NonNullable<typeof orbitControlsRefHolder.current>;

    const { result } = renderHook(() => useCameraControls([table]));

    act(() => {
      result.current.frameCameraForViewMode("2D", [{ position: [80, 0, 80] }]);
    });

    const move = result.current.cameraMove;
    expect(move?.motion).toBe("orbit");

    act(() => {
      position.copy(move!.position);
      target.copy(move!.lookAt);
      result.current.completeCameraMove();
    });

    expect(result.current.cameraMove).toBeNull();
    expect(result.current.maxCameraDistance).toBeGreaterThanOrEqual(
      position.distanceTo(target) - 0.5
    );
  });
});
