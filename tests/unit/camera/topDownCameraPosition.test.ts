import { describe, it, expect } from "vitest";
import { getTopDownCameraPosition } from "@/visualizer/3d/utils/camera-utils";

describe("getTopDownCameraPosition", () => {
  it("looks straight down the Y axis at the origin", () => {
    const position = getTopDownCameraPosition([
      { position: [10, 0, -6] },
      { position: [-4, 0, 8] },
    ]);

    expect(position.x).toBe(0);
    expect(position.y).toBeGreaterThan(0);
    // A tiny Z offset keeps OrbitControls out of gimbal lock at exact vertical.
    expect(position.z).toBeCloseTo(0, 2);
  });

  it("rises higher when the flattened schema is wider", () => {
    const narrow = getTopDownCameraPosition([{ position: [5, 0, 5] }]);
    const wide = getTopDownCameraPosition([{ position: [80, 0, 80] }]);

    expect(wide.y).toBeGreaterThan(narrow.y);
  });

  it("keeps a minimum height for an empty or tiny schema", () => {
    expect(getTopDownCameraPosition([]).y).toBeGreaterThanOrEqual(20);
    expect(
      getTopDownCameraPosition([{ position: [0, 0, 0] }]).y
    ).toBeGreaterThanOrEqual(20);
  });
});
