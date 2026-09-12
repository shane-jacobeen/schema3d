import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getEditorTextForSchema,
  resolveSchemaFormat,
  migrateSchemaFormat,
} from "@/visualizer/ui/schema/schema-editor-text";
import type { DatabaseSchema } from "@/shared/types/schema";

const blogJson = '{"title":"Blog Platform","tables":[]}';

vi.mock("@/schemas/utils/load-schemas", () => ({
  getSchemaText: vi.fn((name: string) => {
    if (name === "Blog Platform") return blogJson;
    if (name === "Retailer") return "CREATE TABLE products (id INT);";
    return null;
  }),
}));

vi.mock("@/schemas/utils/schema-converter", () => ({
  schemaToFormat: vi.fn((schema: DatabaseSchema) => {
    if (schema.format === "drawdb") {
      return '{"reconstructed":true}';
    }
    if (schema.format === "mermaid") {
      return "erDiagram\n  X";
    }
    return "CREATE TABLE reconstructed (id INT);";
  }),
}));

describe("resolveSchemaFormat", () => {
  it("forces Blog Platform to drawdb", () => {
    expect(
      resolveSchemaFormat({
        name: "Blog Platform",
        format: "sql",
        tables: [],
      })
    ).toBe("drawdb");
  });

  it("preserves other schema formats", () => {
    expect(
      resolveSchemaFormat({ name: "Retailer", format: "sql", tables: [] })
    ).toBe("sql");
    expect(
      resolveSchemaFormat({
        name: "University",
        format: "mermaid",
        tables: [],
      })
    ).toBe("mermaid");
  });
});

describe("getEditorTextForSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("migrates Blog Platform to fixture JSON (not reconstructed SQL)", () => {
    const schema: DatabaseSchema = {
      name: "Blog Platform",
      format: "sql",
      tables: [],
    };
    const text = getEditorTextForSchema(schema);
    expect(text).toBe(blogJson);
    expect(text).not.toMatch(/CREATE TABLE/i);
  });

  it("uses Retailer SQL fixture for Retailer", () => {
    const text = getEditorTextForSchema({
      name: "Retailer",
      format: "sql",
      tables: [],
    });
    expect(text).toContain("CREATE TABLE products");
  });

  it("falls back to schemaToFormat for unnamed custom schemas", () => {
    const text = getEditorTextForSchema({
      name: "Custom Database",
      format: "sql",
      tables: [],
    });
    expect(text).toContain("CREATE TABLE reconstructed");
  });
});

describe("migrateSchemaFormat", () => {
  it("rewrites Blog Platform sql → drawdb", () => {
    const migrated = migrateSchemaFormat({
      name: "Blog Platform",
      format: "sql",
      tables: [],
    });
    expect(migrated.format).toBe("drawdb");
  });

  it("returns same reference when format already correct", () => {
    const schema: DatabaseSchema = {
      name: "Blog Platform",
      format: "drawdb",
      tables: [],
    };
    expect(migrateSchemaFormat(schema)).toBe(schema);
  });
});
