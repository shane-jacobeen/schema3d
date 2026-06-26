import * as THREE from "three";
import type React from "react";
import type { Table, DatabaseSchema } from "@/shared/types/schema";
export type {
  CardinalitySymbol,
  Cardinality,
} from "@/shared/types/cardinality";
import type { Cardinality } from "@/shared/types/cardinality";

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
  simplifiedRendering?: boolean;
  onSelect: (table: Table | null) => void;
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
  animatedPositionsRef?: React.MutableRefObject<
    Map<string, [number, number, number]>
  >;
  isAnimating?: boolean;
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
  animatedPositionsRef?: React.MutableRefObject<
    Map<string, [number, number, number]>
  >;
  isAnimating?: boolean;
  schema: DatabaseSchema;
  showLabel?: boolean;
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
