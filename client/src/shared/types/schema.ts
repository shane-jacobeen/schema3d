export interface Column {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean; // True if column has UNIQUE constraint
  isNullable?: boolean; // True if column allows NULL, false if NOT NULL. Defaults to true (nullable) if not specified
  references?: {
    table: string;
    column: string;
    cardinality?: string; // Optional cardinality from Mermaid (e.g., "1:N", "0..1:1..N")
  };
  // For view columns: source table and column they are derived from
  sourceTable?: string;
  sourceColumn?: string;
}

export interface Table {
  name: string;
  columns: Column[];
  position: [number, number, number];
  color: string;
  category: string;
  isView?: boolean; // True if this is a view (hollow cylinder), false/null if table (filled cylinder)
}

export interface DatabaseSchema {
  format: "sql" | "mermaid";
  name: string;
  tables: Table[];
}

/**
 * Category definition for custom category colors and names.
 */
export interface CategoryDefinition {
  name: string;
  color: string;
  /** Whether this category is selected/visible (true if visible, false if hidden) */
  selected?: boolean;
}

/**
 * View state that can be shared via URL.
 * Captures user customizations like category filters, layout algorithm, view mode, and custom categories.
 */
export interface SharedViewState {
  /** Layout algorithm used for positioning tables */
  layoutAlgorithm?: "force" | "hierarchical" | "circular";
  /** View mode (2D or 3D) */
  viewMode?: "2D" | "3D";
  /** Custom category definitions (names, colors, and visibility) */
  categories?: CategoryDefinition[];
  /** Table-to-category assignments (table name -> category name) for custom organization */
  tableCategoryMap?: Record<string, string>;
}
