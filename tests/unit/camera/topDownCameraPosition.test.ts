import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  getTopDownCameraPosition,
  shouldRotateToTopDownFor2D,
  getCameraElevationRadians,
  TOP_DOWN_POLAR_ANGLE,
  MIN_ELEVATION_2D,
} from "@/visualizer/3d/utils/camera-utils";

describe("getCameraElevationRadians", () => {
  it("is positive above the graph, zero edge-on, and negative from below", () => {
    const lookAt = new THREE.Vector3(0, 0, 0);

    expect(
      getCameraElevationRadians(new THREE.Vector3(0, 12, 35), lookAt)
    ).toBeGreaterThan(0);
    expect(
      getCameraElevationRadians(new THREE.Vector3(0, 0, 35), lookAt)
    ).toBeCloseTo(0, 5);
    expect(
      getCameraElevationRadians(new THREE.Vector3(0, -12, 35), lookAt)
    ).toBeLessThan(0);
  });
});

describe("shouldRotateToTopDownFor2D", () => {
  const lookAt = new THREE.Vector3(0, 0, 0);

  it("rotates when the default 3D view is shallower than 45°", () => {
    expect(
      shouldRotateToTopDownFor2D(new THREE.Vector3(0, 12, 35), lookAt)
    ).toBe(true);
  });

  it("rotates when looking from below the graph", () => {
    expect(
      shouldRotateToTopDownFor2D(new THREE.Vector3(0, -12, 35), lookAt)
    ).toBe(true);
  });

  it("does not rotate when already 45° or steeper above the graph", () => {
    const steep = new THREE.Vector3(0, 40, 10);
    expect(getCameraElevationRadians(steep, lookAt)).toBeGreaterThan(
      MIN_ELEVATION_2D
    );
    expect(shouldRotateToTopDownFor2D(steep, lookAt)).toBe(false);

    const exactly45 = new THREE.Vector3(0, 1, 1);
    expect(getCameraElevationRadians(exactly45, lookAt)).toBeCloseTo(
      MIN_ELEVATION_2D,
      5
    );
    expect(shouldRotateToTopDownFor2D(exactly45, lookAt)).toBe(false);
  });
});

describe("getTopDownCameraPosition", () => {
  it("rotates around the current look-at instead of flying to the origin", () => {
    const current = new THREE.Vector3(10, 12, 35);
    const lookAt = new THREE.Vector3(10, 0, 10);
    const next = getTopDownCameraPosition(current, lookAt);
    const offset = next.clone().sub(lookAt);
    const spherical = new THREE.Spherical().setFromVector3(offset);

    expect(spherical.phi).toBeCloseTo(TOP_DOWN_POLAR_ANGLE, 5);
    expect(next.distanceTo(lookAt)).toBeCloseTo(current.distanceTo(lookAt), 5);
    expect(next.x).not.toBeCloseTo(0);
    expect(next.z).not.toBeCloseTo(0);
  });

  it("preserves azimuth so the camera does not swing around the target", () => {
    const current = new THREE.Vector3(8, 12, 20);
    const lookAt = new THREE.Vector3(0, 0, 0);
    const before = new THREE.Spherical().setFromVector3(current.clone());
    const after = new THREE.Spherical().setFromVector3(
      getTopDownCameraPosition(current, lookAt)
    );

    expect(after.theta).toBeCloseTo(before.theta, 5);
  });
});
