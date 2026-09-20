export interface ParsedTable {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isUnique?: boolean;
    isForeignKey?: boolean;
    references?: { table: string; column: string; cardinality?: string };
  }>;
}
