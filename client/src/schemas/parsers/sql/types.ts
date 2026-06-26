export interface ParsedTable {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isUnique?: boolean; // True if column has UNIQUE constraint
    isNullable?: boolean; // True if column allows NULL, false if NOT NULL
    references?: { table: string; column: string };
  }>;
}

export interface ParsedView {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    sourceTable?: string; // Source table for this column
    sourceColumn?: string; // Source column name (if different from view column name)
  }>;
  referencedTables: string[]; // Tables referenced via JOINs
}
