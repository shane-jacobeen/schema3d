import * as THREE from "three";
import type { LineStyle } from "../../types";
import {
  calculateCardinality,
  parseCardinality,
} from "@/shared/types/cardinality";

export { calculateCardinality, parseCardinality };

/**
 * Calculate line styling based on selection and hover state
 */
export function getLineStyle(
  isSelected: boolean,
  isHovered: boolean,
  isConnectedToSelectedTable: boolean
): LineStyle {
  return {
    color: isSelected
      ? "#60a5fa"
      : isHovered
        ? "#93c5fd"
        : isConnectedToSelectedTable
          ? "#64748b"
          : "#334155",
    opacity: isSelected
      ? 1
      : isHovered
        ? 0.9
        : isConnectedToSelectedTable
          ? 0.9
          : 0.8,
    width: isSelected
      ? 3.5
      : isHovered
        ? 3
        : isConnectedToSelectedTable
          ? 3
          : 2.5,
  };
}

/**
 * Get a perpendicular vector to a given tangent vector
 */
export function getPerpendicular(tangent: THREE.Vector3): THREE.Vector3 {
  // Try different up vectors to find a good perpendicular
  const upVectors = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 1),
  ];

  for (const up of upVectors) {
    const perp = new THREE.Vector3().crossVectors(tangent, up);
    if (perp.length() > 0.1) {
      return perp.normalize();
    }
  }

  // Fallback: create a perpendicular using a different method
  const perp = new THREE.Vector3();
  if (Math.abs(tangent.y) < 0.9) {
    perp.set(0, 1, 0).cross(tangent).normalize();
  } else {
    perp.set(1, 0, 0).cross(tangent).normalize();
  }
  return perp;
}

/**
 * Calculate surface point on a table cylinder given center and direction
 * If out parameter is provided, writes to it instead of creating a new Vector3
 */
export function getTableSurfacePoint(
  center: THREE.Vector3,
  direction: THREE.Vector3,
  radius: number,
  out?: THREE.Vector3
): THREE.Vector3 {
  if (out) {
    return out.copy(center).add(direction.clone().multiplyScalar(radius));
  }
  return center.clone().add(direction.clone().multiplyScalar(radius));
}
