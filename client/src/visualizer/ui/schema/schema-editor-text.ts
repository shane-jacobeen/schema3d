import type { DatabaseSchema } from "@/shared/types/schema";
import type { SchemaFormat } from "@/schemas/parsers";
import { getSchemaText } from "@/schemas/utils/load-schemas";
import { schemaToFormat } from "@/schemas/utils/schema-converter";

/**
 * Resolve editor text for a schema, preferring canonical sample fixtures.
 * Blog Platform always uses its DrawDB JSON (not SQL, not reconstructed).
 */
export function getEditorTextForSchema(schema: DatabaseSchema): string {
  const sampleText = getSchemaText(schema.name);
  if (sampleText) {
    return sampleText;
  }
  return schemaToFormat(schema);
}

/**
 * Ensure Blog Platform (and other DrawDB samples) keep format "drawdb".
 */
export function resolveSchemaFormat(schema: DatabaseSchema): SchemaFormat {
  if (schema.name === "Blog Platform") {
    return "drawdb";
  }
  return schema.format || "sql";
}

/**
 * Apply Blog Platform / DrawDB format migration to a schema object.
 */
export function migrateSchemaFormat(schema: DatabaseSchema): DatabaseSchema {
  const format = resolveSchemaFormat(schema);
  if (format === schema.format) {
    return schema;
  }
  return { ...schema, format };
}
