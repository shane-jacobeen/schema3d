// Shared types for visualization state management
// These types are used across different visualization modes (3D, 2D, etc.)

// Re-export Relationship type from 3d/types for state hooks
// This allows state hooks to reference relationships without being tied to 3D implementation
export type { Relationship } from "@/visualizer/3d/types";

// Selection state types
export interface SelectionState {
  selectedTable: string | null;
  selectedRelationship: string | null;
  hoveredTable: string | null;
  hoveredRelationship: string | null;
}

// Filter state types
export interface FilterState {
  filteredTables: Set<string>;
  relatedTables: Set<string>;
  selectedCategories: Set<string>;
}
