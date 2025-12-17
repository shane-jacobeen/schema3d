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
