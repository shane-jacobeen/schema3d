import { parseSqlSchema } from "../parsers/sql-parser";
import { parseMermaidSchema } from "../parsers/mermaid-parser";
import { drawdbDiagramToSchema } from "../parsers/drawdb";
import type { DatabaseSchema } from "@/shared/types/schema";
import type { DrawdbDiagram } from "../parsers/drawdb";

// Import SQL files as raw text
import retailerSql from "../sample-schemas/retailer.sql?raw";
import blogPlatformSql from "../sample-schemas/blog-platform.sql?raw";

// Import Mermaid files as raw text
import universityMermaid from "../sample-schemas/university.mmd?raw";

// DrawDB Blog Platform demo (in-app sample source)
import blogPlatformDrawdb from "../sample-schemas/blog-platform.drawdb.json";

// Cache parsed schemas
let retailerSchemaCache: DatabaseSchema | null = null;
let blogPlatformSchemaCache: DatabaseSchema | null = null;
let universitySchemaCache: DatabaseSchema | null = null;

// Store original text for each schema
export const RETAILER_SQL = retailerSql;
/** SQL regression fixture — Blog Platform in-app sample uses DrawDB JSON */
export const BLOG_PLATFORM_SQL = blogPlatformSql;
export const UNIVERSITY_MERMAID = universityMermaid;
/** DrawDB diagram JSON used by the Blog Platform sample */
export const BLOG_PLATFORM_DRAWDB = blogPlatformDrawdb as DrawdbDiagram;

export function getRetailerSchema(): DatabaseSchema {
  if (!retailerSchemaCache) {
    const parsed = parseSqlSchema(retailerSql);
    if (!parsed) {
      throw new Error("Failed to parse retailer schema");
    }
    retailerSchemaCache = {
      ...parsed,
      name: "Retailer",
    };
  }
  return retailerSchemaCache;
}

export function getBlogPlatformSchema(): DatabaseSchema {
  if (!blogPlatformSchemaCache) {
    const parsed = drawdbDiagramToSchema(BLOG_PLATFORM_DRAWDB);
    if (!parsed || parsed.tables.length === 0) {
      throw new Error("Failed to convert blog platform DrawDB schema");
    }
    // Internal format is DrawDB JSON (not SQL) — editor content is the JSON fixture
    blogPlatformSchemaCache = {
      ...parsed,
      name: "Blog Platform",
      format: "drawdb",
    };
  }
  return blogPlatformSchemaCache;
}

export function getUniversitySchema(): DatabaseSchema {
  if (!universitySchemaCache) {
    const parsed = parseMermaidSchema(universityMermaid);
    if (!parsed) {
      throw new Error("Failed to parse university schema");
    }
    universitySchemaCache = {
      ...parsed,
      name: "University",
    };
  }
  return universitySchemaCache;
}

export function getSampleSchemas(): DatabaseSchema[] {
  return [getRetailerSchema(), getBlogPlatformSchema(), getUniversitySchema()];
}

// Get the original text for a schema by name
export function getSchemaText(schemaName: string): string | null {
  if (schemaName === "Retailer") {
    return RETAILER_SQL;
  } else if (schemaName === "Blog Platform") {
    return JSON.stringify(BLOG_PLATFORM_DRAWDB, null, 2);
  } else if (schemaName === "University") {
    return UNIVERSITY_MERMAID;
  }
  return null;
}

export type SampleSchemaFormat = "sql" | "mermaid" | "drawdb";

/** Source format metadata for sample schemas (Blog Platform is DrawDB). */
export function getSchemaFormat(schemaName: string): SampleSchemaFormat {
  if (schemaName === "University") {
    return "mermaid";
  }
  if (schemaName === "Blog Platform") {
    return "drawdb";
  }
  return "sql";
}
