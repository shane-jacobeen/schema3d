import * as THREE from "three";
import type { Cardinality, CardinalitySymbol, LineStyle } from "../../types";

/**
 * Calculate relationship cardinality based on UNIQUE constraints
 */
export function calculateCardinality(
  pkColumn: { isPrimaryKey?: boolean; isUnique?: boolean } | undefined,
  fkColumn: { isUnique?: boolean }
): Cardinality {
  // PK is unique if it's a primary key (primary keys are always unique)
  const pkIsUnique = pkColumn?.isPrimaryKey || pkColumn?.isUnique || false;
  const fkIsUnique = fkColumn.isUnique || false;

  if (!pkIsUnique && !fkIsUnique) {
    return "N:N"; // Many-to-many
  } else if (pkIsUnique && !fkIsUnique) {
    return "1:N"; // One-to-many
  } else if (!pkIsUnique && fkIsUnique) {
    return "N:1"; // Many-to-one
  } else {
    return "1:1"; // One-to-one
  }
}

/**
 * Parse a Cardinality string ("1:N", "0..1:1..N", "0..N:0..N", etc.)
 * into left/right symbols plus convenience flags for "many" sides.
 */
export function parseCardinality(cardinality: Cardinality): {
  left: CardinalitySymbol;
  right: CardinalitySymbol;
  leftIsMany: boolean;
  rightIsMany: boolean;
} {
  const [leftRaw, rightRaw] = cardinality.split(":") as [
    CardinalitySymbol,
    CardinalitySymbol,
  ];

  const isMany = (symbol: CardinalitySymbol): boolean =>
    symbol === "N" || symbol === "0..N" || symbol === "1..N";

  return {
    left: leftRaw,
    right: rightRaw,
    leftIsMany: isMany(leftRaw),
    rightIsMany: isMany(rightRaw),
  };
}

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
