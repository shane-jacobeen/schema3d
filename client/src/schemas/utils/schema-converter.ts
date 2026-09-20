import type { DatabaseSchema } from "@/shared/types/schema";
import { schemaToSql } from "../parsers/sql-parser";
import { schemaToMermaid } from "../parsers/mermaid-parser";
import { schemaToDrawdbText } from "../parsers/drawdb";

/**
 * Convert a DatabaseSchema to its native editor/share text.
 * drawdb → DrawDB JSON; mermaid → ER diagram; sql → DDL.
 */
export function schemaToFormat(schema: DatabaseSchema): string {
  if (schema.format === "mermaid") {
    return schemaToMermaid(schema);
  }
  if (schema.format === "drawdb") {
    return schemaToDrawdbText(schema);
  }
  return schemaToSql(schema);
}

export { schemaToSql } from "../parsers/sql-parser";
export { schemaToMermaid } from "../parsers/mermaid-parser";
export { schemaToDrawdbJson, schemaToDrawdbText } from "../parsers/drawdb";
