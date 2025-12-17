import React from "react";
import { Line as DreiLine } from "@react-three/drei";
import * as THREE from "three";
import type { CardinalitySymbol, CardinalityNotationProps } from "../../types";
import {
  CARDINALITY_TORUS_RADIUS,
  CARDINALITY_TORUS_TUBE,
  CARDINALITY_PYRAMID_BASE_SIZE,
  CARDINALITY_PYRAMID_HEIGHT_MULTIPLIER,
} from "../../constants";
import { getPerpendicular, parseCardinality } from "../../index";

const OFFSET_DISTANCE = 0.8; // world units from each end

/**
 * Renderer for "zero" style (sphere)
 */
function renderZeroNotation(
  point: THREE.Vector3,
  lineColor: string,
  keyPrefix: string
) {
  // For "0" notation, show a sphere centered on the line
  // Spheres don't need orientation, so no quaternion needed
  return (
    <mesh
      key={`${keyPrefix}-zero-sphere-${point.x}-${point.y}-${point.z}`}
      position={[point.x, point.y, point.z]}
    >
      <sphereGeometry args={[CARDINALITY_TORUS_RADIUS, 16, 16]} />
      <meshBasicMaterial color={lineColor} />
    </mesh>
  );
}

/**
 * Base renderer for "exactly one" style (donut)
 */
function renderOneNotation(
  point: THREE.Vector3,
  direction: THREE.Vector3,
  lineColor: string,
  keyPrefix: string
) {
  // For "1" nontation, show a donut (torus) centered on the line (not offset)
  // The donut's plane should be perpendicular to the line
  // Torus default orientation has ring in XY plane (perpendicular to Z)
  // We need the ring to be perpendicular to the line direction, so the ring's normal should be along the direction
  const quaternion = new THREE.Quaternion();
  const defaultNormal = new THREE.Vector3(0, 0, 1); // Z-axis is normal to default torus ring plane
  const targetNormal = direction.clone().normalize();
  quaternion.setFromUnitVectors(defaultNormal, targetNormal);

  return (
    <mesh
      key={`${keyPrefix}-one-donut-${point.x}-${point.y}-${point.z}`}
      position={[point.x, point.y, point.z]}
      quaternion={quaternion}
    >
      <torusGeometry
        args={[CARDINALITY_TORUS_RADIUS, CARDINALITY_TORUS_TUBE, 16, 32]}
      />
      <meshBasicMaterial color={lineColor} />
    </mesh>
  );
}

/**
 * For now, render "0..1" the same as "1" but keep a separate function
 * so we can style it differently in the future if desired.
 */
function renderZeroOrOneNotation(
  point: THREE.Vector3,
  direction: THREE.Vector3,
  lineColor: string,
  keyPrefix: string
) {
  const innerPoint = point.clone().add(
    direction
      .clone()
      .normalize()
      .multiplyScalar(-OFFSET_DISTANCE / 2)
  );

  return (
    <group key={`${keyPrefix}-1..N-group`}>
      {renderZeroNotation(innerPoint, lineColor, keyPrefix)}
      {renderOneNotation(point, direction, lineColor, keyPrefix)}
    </group>
  );
}

/**
 * Base renderer for "many" style (crow's-foot pyramid)
 */
function renderManyNotation(
  point: THREE.Vector3,
  direction: THREE.Vector3,
  lineColor: string,
  keySuffix: string
) {
  // For "many" side, show a 3D square pyramid (wireframe only - long edges only)
  // Pyramid: 2x as tall as its base is across, with vertical axis centered on the line
  // The apex should be at the point on the line, pointing towards the table (same direction as line)
  const baseSize = CARDINALITY_PYRAMID_BASE_SIZE; // Size of the square base
  const height = baseSize * CARDINALITY_PYRAMID_HEIGHT_MULTIPLIER; // 2x as tall as base width

  // Apex is at the point on the line, pointing in the same direction as the line
  const apex = point.clone();

  // Base center is at height distance from apex along the line direction
  const baseCenter = apex.clone().add(direction.clone().multiplyScalar(height));

  // Calculate perpendicular vectors for the square base using the line direction
  const perp1 = getPerpendicular(direction);
  const perp2 = new THREE.Vector3().crossVectors(direction, perp1).normalize();

  // Calculate the 4 corners of the square base
  const halfBase = baseSize / 2;
  const baseCorner1 = baseCenter
    .clone()
    .add(perp1.clone().multiplyScalar(halfBase))
    .add(perp2.clone().multiplyScalar(halfBase));
  const baseCorner2 = baseCenter
    .clone()
    .add(perp1.clone().multiplyScalar(halfBase))
    .add(perp2.clone().multiplyScalar(-halfBase));
  const baseCorner3 = baseCenter
    .clone()
    .add(perp1.clone().multiplyScalar(-halfBase))
    .add(perp2.clone().multiplyScalar(-halfBase));
  const baseCorner4 = baseCenter
    .clone()
    .add(perp1.clone().multiplyScalar(-halfBase))
    .add(perp2.clone().multiplyScalar(halfBase));

  // Draw only the long edges from apex to base corners (no base edges)
  return (
    <group
      key={`crowsfoot-pyramid-${keySuffix}-${point.x}-${point.y}-${point.z}`}
    >
      {/* Edges from base corners to apex */}
      <DreiLine points={[apex, baseCorner1]} color={lineColor} lineWidth={3} />
      <DreiLine points={[apex, baseCorner2]} color={lineColor} lineWidth={3} />
      <DreiLine points={[apex, baseCorner3]} color={lineColor} lineWidth={3} />
      <DreiLine points={[apex, baseCorner4]} color={lineColor} lineWidth={3} />
    </group>
  );
}

// "0..N" – zero or many (same geometry for now, separate hook for future styling)
function renderZeroOrManyNotation(
  point: THREE.Vector3,
  direction: THREE.Vector3,
  lineColor: string,
  keyPrefix: string
) {
  const innerPoint = point.clone().add(
    direction
      .clone()
      .normalize()
      .multiplyScalar(-OFFSET_DISTANCE / 2)
  );

  return (
    <group key={`${keyPrefix}-1..N-group`}>
      {renderZeroNotation(innerPoint, lineColor, keyPrefix)}
      {renderManyNotation(point, direction, lineColor, keyPrefix)}
    </group>
  );
}

// "1..N" – one or many (same geometry for now, separate hook for future styling)
function renderOneOrManyNotation(
  point: THREE.Vector3,
  direction: THREE.Vector3,
  lineColor: string,
  keyPrefix: string
) {
  const innerPoint = point.clone().add(
    direction
      .clone()
      .normalize()
      .multiplyScalar(-OFFSET_DISTANCE / 2)
  );

  return (
    <group key={`${keyPrefix}-1..N-group`}>
      {renderOneNotation(innerPoint, direction, lineColor, keyPrefix)}
      {renderManyNotation(point, direction, lineColor, keyPrefix)}
    </group>
  );
}

/**
 * Dispatcher function that renders the appropriate 3D geometry for a cardinality symbol.
 *
 * Maps cardinality symbols to their corresponding renderer functions:
 * - "1" → donut (torus) perpendicular to line
 * - "0..1" → sphere + donut at offset
 * - "N" → crow's-foot pyramid (three-sided pyramid)
 * - "0..N" → sphere + crow's-foot at offset
 * - "1..N" → donut + crow's-foot at offset
 *
 * @param symbol - The cardinality symbol to render ("1", "0..1", "N", "0..N", "1..N")
 * @param point - 3D position where the symbol should be rendered
 * @param direction - Normalized direction vector along the relationship line
 * @param lineColor - Color for the symbol geometry
 * @param sideKey - "from" or "to" to distinguish symbols at different ends
 * @returns JSX element with the rendered symbol geometry, or null if symbol is unknown
 */
export function createNotationForSymbol(
  symbol: CardinalitySymbol,
  point: THREE.Vector3,
  direction: THREE.Vector3,
  lineColor: string,
  sideKey: "from" | "to"
) {
  const keyPrefix = `${sideKey}-${symbol}`;

  switch (symbol) {
    case "1":
      return renderOneNotation(point, direction, lineColor, keyPrefix);
    case "0..1":
      return renderZeroOrOneNotation(point, direction, lineColor, keyPrefix);
    case "N":
      return renderManyNotation(point, direction, lineColor, keyPrefix);
    case "0..N":
      return renderZeroOrManyNotation(point, direction, lineColor, keyPrefix);
    case "1..N":
      return renderOneOrManyNotation(point, direction, lineColor, keyPrefix);
    default:
      return null;
  }
}

/**
 * Component to render ERD-style cardinality notation for a relationship line.
 *
 * Renders cardinality symbols at both ends of a relationship line to indicate
 * the relationship type (one-to-one, one-to-many, etc.). Symbols are positioned
 * at a fixed offset from the line endpoints and oriented along the relationship direction.
 *
 * Supported cardinality types:
 * - "1" - Exactly one (donut/torus)
 * - "0..1" - Zero or one (sphere + donut)
 * - "N" - Many (crow's-foot pyramid)
 * - "0..N" - Zero or many (sphere + crow's-foot)
 * - "1..N" - One or many (donut + crow's-foot)
 *
 * @param relationship - Relationship object containing curve and cardinality information
 * @param lineColor - Color to use for the cardinality symbols (matches relationship line)
 */
export function CardinalityNotation({
  relationship,
  lineColor,
}: CardinalityNotationProps) {
  const { curve, cardinality } = relationship;

  // Use points a fixed distance from the ends (in world units) instead of fixed fractions
  // This computes normalized positions along the curve based on arc length.

  // total curve length (works for LineCurve3 and other Curve types)
  const totalLength =
    typeof (curve as THREE.Curve<THREE.Vector3> & { getLength?: () => number })
      .getLength === "function"
      ? (
          curve as THREE.Curve<THREE.Vector3> & { getLength: () => number }
        ).getLength()
      : 0;
  // Determine normalized u positions (0..1) for start and end notation points

  const d = Math.min(OFFSET_DISTANCE, totalLength * 0.25); // don't push past quarter length
  const startU = d / totalLength;
  const endU = 1 - d / totalLength;

  const startPoint = curve.getPointAt(startU);
  const endPoint = curve.getPointAt(endU);

  // Direction along the relationship line from start to end
  const direction = new THREE.Vector3()
    .subVectors(endPoint, startPoint)
    .normalize();

  // Determine cardinality symbols for each side
  const { left, right } = parseCardinality(cardinality);

  return (
    <group>
      {/* Start point notation (fromTable side) */}
      {createNotationForSymbol(
        left,
        startPoint,
        direction.clone().multiplyScalar(-1),
        lineColor,
        "from"
      )}

      {/* End point notation (toTable side) */}
      {createNotationForSymbol(right, endPoint, direction, lineColor, "to")}
    </group>
  );
}
