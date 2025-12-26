import * as THREE from "three";
import type { Table, DatabaseSchema } from "@/shared/types/schema";

export type CardinalitySymbol = "1" | "N" | "0..1" | "1..N" | "0..N";
export type Cardinality = `${CardinalitySymbol}:${CardinalitySymbol}`;

export interface Relationship {
  id: string;
  points: THREE.Vector3[];
  fromTable: string;
  toTable: string;
  fkColumn: string;
  pkColumn: string;
  midpoint: THREE.Vector3;
  // use a generic Curve so we can use LineCurve3 for straight lines
  curve: THREE.Curve<THREE.Vector3>;
  cardinality: Cardinality; // Relationship cardinality
}

export interface Table3DProps {
  table: Table;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted?: boolean;
  isRelated?: boolean;
  isDimmed?: boolean;
  isRelationshipHighlighted?: boolean;
  onSelect: (table: Table) => void;
  onHover: (table: Table | null) => void;
  onLongPress?: (table: Table) => void;
  onPositionChange?: (
    table: Table,
    newPosition: [number, number, number]
  ) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  targetPosition?: [number, number, number];
  animationStartTime?: number | null;
  isAnimating?: boolean;
  onAnimatedPositionChange?: (
    tableName: string,
    position: [number, number, number]
  ) => void;
}

export interface RelationshipLinesProps {
  schema: DatabaseSchema;
  selectedRelationship?: Relationship | null;
  hoveredRelationship?: Relationship | null;
  selectedTable?: Table | null;
  onSelect?: (relationship: Relationship | null) => void;
  onHover?: (relationship: Relationship | null) => void;
  onLongPress?: (relationship: Relationship) => void;
  animatedPositions?: Map<string, [number, number, number]>;
  visibleTableNames?: Set<string>;
}

export interface RelationshipLineProps {
  relationship: Relationship;
  isSelected: boolean;
  isHovered: boolean;
  lineColor: string;
  lineOpacity: number;
  lineWidth: number;
  onSelect?: (relationship: Relationship | null) => void;
  onHover?: (relationship: Relationship | null) => void;
  onLongPress?: (relationship: Relationship) => void;
  animatedPositions?: Map<string, [number, number, number]>;
  schema: DatabaseSchema;
}

export interface CardinalityNotationProps {
  relationship: Relationship;
  lineColor: string;
}

export interface LineStyle {
  color: string;
  opacity: number;
  width: number;
}
