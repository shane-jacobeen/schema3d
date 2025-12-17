import * as THREE from "three";
import type { Cardinality, CardinalitySymbol, LineStyle } from "../../types";

/**
 * Calculate relationship cardinality based on UNIQUE constraints and NULL/NOT NULL constraints
 *
 * Rules:
 * - The table with the FK is always the many side (right side of cardinality)
 * - The table being pointed to is always the 1 side (left side of cardinality)
 * - If the FK column is nullable, the parent (referenced table) is 0 or 1 (0..1)
 * - If the FK column is NOT NULL, the parent (referenced table) is 1 and only 1 (1)
 *
 * Cardinality format: "left:right" where:
 * - left = referenced table side (the "1" side)
 * - right = FK table side (the "many" side, unless FK is unique then it's "1")
 *
 * Many side (right side) determination (conservative approach):
 * - If FK is unique → "1" (one-to-one relationship)
 * - If FK is NOT NULL and not unique → "1..N" (parent must have at least 1 child)
 * - If FK is explicitly NULL and not unique → "0..N" (parent can have 0 children)
 * - If FK nullable status is unknown and not unique → "N" (generic many, ambiguous)
 *
 * Examples:
 * - FK nullable, not unique → "0..1:0..N" (many children can reference 0 or 1 parent, parent can have 0 children)
 * - FK NOT NULL, not unique → "1:1..N" (many children must reference exactly 1 parent, parent must have at least 1 child)
 * - FK nullable, unique → "0..1:1" (one child can reference 0 or 1 parent)
 * - FK NOT NULL, unique → "1:1" (one child must reference exactly 1 parent)
 * - FK unknown nullable, not unique → "0..1:N" (generic many, ambiguous participation)
 *
 * Note: This cardinality format is used consistently throughout the codebase. When displaying
 * relationships, the symbols are mapped as follows:
 * - fromTable (FK table) displays the "right" symbol
 * - toTable (referenced table) displays the "left" symbol
 */
export function calculateCardinality(
  pkColumn: { isPrimaryKey?: boolean; isUnique?: boolean } | undefined,
  fkColumn: { isUnique?: boolean; isNullable?: boolean }
): Cardinality {
  // PK is unique if it's a primary key (primary keys are always unique)
  const pkIsUnique = pkColumn?.isPrimaryKey || pkColumn?.isUnique || false;
  const fkIsUnique = fkColumn.isUnique || false;

  // Determine the left side (referenced table / parent side)
  // If FK is nullable → parent is 0 or 1 (0..1)
  // If FK is NOT NULL → parent is 1 and only 1 (1)
  // Conservative: if nullable status is unknown, default to nullable (0..1)
  const fkIsNullable = fkColumn.isNullable !== false;
  const leftSide: CardinalitySymbol = fkIsNullable ? "0..1" : "1";

  // Determine the right side (FK table / child side)
  // Conservative approach: only use specific cardinality when we have explicit information
  let rightSide: CardinalitySymbol;
  if (fkIsUnique) {
    // One-to-one relationship
    rightSide = "1";
  } else {
    // Many relationship - distinguish based on nullable status (conservative)
    if (fkColumn.isNullable === false) {
      // NOT NULL = parent must have at least 1 child
      rightSide = "1..N";
    } else if (fkColumn.isNullable === true) {
      // Explicitly NULL = parent can have 0 children
      rightSide = "0..N";
    } else {
      // Unknown nullable status = generic many (ambiguous)
      rightSide = "N";
    }
  }

  // Combine into cardinality string
  return `${leftSide}:${rightSide}` as Cardinality;
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
