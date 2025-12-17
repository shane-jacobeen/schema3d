import { parseSqlSchema } from "../parsers/sql-parser";
import { parseMermaidSchema } from "../parsers/mermaid-parser";
import type { DatabaseSchema } from "@/shared/types/schema";

// Import SQL files as raw text
import retailerSql from "../sample-schemas/retailer.sql?raw";
import blogPlatformSql from "../sample-schemas/blog-platform.sql?raw";

// Import Mermaid files as raw text
import universityMermaid from "../sample-schemas/university.mmd?raw";

// Cache parsed schemas
let retailerSchemaCache: DatabaseSchema | null = null;
let blogPlatformSchemaCache: DatabaseSchema | null = null;
let universitySchemaCache: DatabaseSchema | null = null;

// Store original text for each schema
export const RETAILER_SQL = retailerSql;
export const BLOG_PLATFORM_SQL = blogPlatformSql;
export const UNIVERSITY_MERMAID = universityMermaid;

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
    const parsed = parseSqlSchema(blogPlatformSql);
    if (!parsed) {
      throw new Error("Failed to parse blog platform schema");
    }
    blogPlatformSchemaCache = {
      ...parsed,
      name: "Blog Platform",
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
    return BLOG_PLATFORM_SQL;
  } else if (schemaName === "University") {
    return UNIVERSITY_MERMAID;
  }
  return null;
}

// Get the format (sql or mermaid) for a schema by name
export function getSchemaFormat(schemaName: string): "sql" | "mermaid" {
  if (schemaName === "University") {
    return "mermaid";
  }
  return "sql";
}
