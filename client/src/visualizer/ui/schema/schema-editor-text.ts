import type { DatabaseSchema } from "@/shared/types/schema";
import type { SchemaFormat } from "@/schemas/parsers";
import { getSchemaText, getSchemaFormat } from "@/schemas/utils/load-schemas";
import { schemaToFormat } from "@/schemas/utils/schema-converter";

/**
 * Resolve editor format for a schema.
 * Respects an explicit format when set; falls back to the sample's native
 * format when missing.
 */
export function resolveSchemaFormat(schema: DatabaseSchema): SchemaFormat {
  if (
    schema.format === "sql" ||
    schema.format === "mermaid" ||
    schema.format === "drawdb"
  ) {
    return schema.format;
  }
  return getSchemaFormat(schema.name) || "sql";
}

/**
 * Resolve editor text for a schema.
 * Uses the canonical sample fixture when the schema is in that sample's
 * native format; otherwise converts via schemaToFormat.
 */
export function getEditorTextForSchema(schema: DatabaseSchema): string {
  const format = resolveSchemaFormat(schema);
  const nativeFormat = getSchemaFormat(schema.name);

  if (format === nativeFormat) {
    const sampleText = getSchemaText(schema.name);
    if (sampleText) {
      return sampleText;
    }
  }

  return schemaToFormat({ ...schema, format });
}
