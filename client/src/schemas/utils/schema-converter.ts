import type { DatabaseSchema } from "@/shared/types/schema";
import { schemaToSql } from "../parsers/sql-parser";
import type { Cardinality, CardinalitySymbol } from "@/visualizer/3d/types";
import { parseCardinality } from "@/visualizer/3d/components/relationships/relationship-utils";

/**
 * Convert a DatabaseSchema to Mermaid ER diagram format
 */
export function schemaToMermaid(schema: DatabaseSchema): string {
  const lines: string[] = ["erDiagram"];

  // Separate tables and views (views are not typically shown in ER diagrams)
  const regularTables = schema.tables.filter((table) => !table.isView);

  // First, collect all relationships
  const relationships: Array<{
    from: string;
    to: string;
    fromColumn: string;
    toColumn: string;
  }> = [];

  for (const table of regularTables) {
    for (const column of table.columns) {
      if (column.isForeignKey && column.references) {
        relationships.push({
          from: table.name,
          to: column.references.table,
          fromColumn: column.name,
          toColumn: column.references.column,
        });
      }
    }
  }

  /**
   * Convert a CardinalitySymbol to Mermaid ER syntax
   */
  const symbolToMermaid = (symbol: CardinalitySymbol): string => {
    switch (symbol) {
      case "1":
        return "||";
      case "0..1":
        return "o";
      case "N":
        return "o{";
      case "0..N":
        return "o{";
      case "1..N":
        return "|{";
      default:
        return "o{";
    }
  };

  // Add relationship lines
  relationships.forEach((rel) => {
    const fromTable = regularTables.find((t) => t.name === rel.from);
    const fkColumn = fromTable?.columns.find((c) => c.name === rel.fromColumn);

    // Use stored cardinality if available, otherwise calculate from UNIQUE constraints
    let cardinality: Cardinality;
    if (fkColumn?.references?.cardinality) {
      cardinality = fkColumn.references.cardinality as Cardinality;
    } else {
      // Fallback: determine cardinality based on whether the FK column is unique
      const toTable = regularTables.find((t) => t.name === rel.to);
      const _pkColumn = toTable?.columns.find((c) => c.name === rel.toColumn);
      const isOneToOne = fkColumn?.isUnique || false;
      const _isOneToMany = !isOneToOne;
      cardinality = isOneToOne ? "1:1" : "1:N";
    }

    // Parse cardinality and convert to Mermaid syntax
    // Cardinality format: "left:right" where:
    // - left = referenced table side (the "1" side)
    // - right = FK table side (the "many" side)
    // Mermaid syntax: FK_TABLE [symbols]--[symbols] REFERENCED_TABLE
    // So we need to swap: FK table (rel.from) gets right symbols, referenced (rel.to) gets left symbols
    const { left, right } = parseCardinality(cardinality);
    const fkMermaid = symbolToMermaid(right); // FK table symbols
    const refMermaid = symbolToMermaid(left); // Referenced table symbols
    const mermaidCardinality = `${fkMermaid}--${refMermaid}`;

    lines.push(
      `    ${rel.from} ${mermaidCardinality} ${rel.to} : "${rel.fromColumn}"`
    );
  });

  // Add table definitions
  for (const table of regularTables) {
    lines.push(`    ${table.name} {`);
    for (const column of table.columns) {
      let columnLine = `        ${column.type.toLowerCase()} ${column.name}`;
      if (column.isPrimaryKey) {
        columnLine += " PK";
      } else if (column.isUnique) {
        columnLine += " UK";
      }
      lines.push(columnLine);
    }
    lines.push(`    }`);
  }

  return lines.join("\n");
}

/**
 * Convert a DatabaseSchema to the specified format
 * @param schema The schema to convert
 * @param format The target format ("sql" or "mermaid")
 * @returns The schema in the specified format
 */
export function schemaToFormat(schema: DatabaseSchema): string {
  if (schema.format === "mermaid") {
    return schemaToMermaid(schema);
  }
  return schemaToSql(schema);
}

export { schemaToSql } from "../parsers/sql-parser";
