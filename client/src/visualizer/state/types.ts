// Shared types for visualization state management

export type { Relationship } from "@/visualizer/3d/types";

export interface FilterState {
  filteredTables: Set<string>;
  relatedTables: Set<string>;
  selectedCategories: Set<string>;
}
