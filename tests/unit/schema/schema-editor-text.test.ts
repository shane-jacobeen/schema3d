import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getEditorTextForSchema,
  resolveSchemaFormat,
} from "@/visualizer/ui/schema/schema-editor-text";
import type { DatabaseSchema } from "@/shared/types/schema";

const blogJson = '{"title":"Blog Platform","tables":[]}';

vi.mock("@/schemas/utils/load-schemas", () => ({
  getSchemaText: vi.fn((name: string) => {
    if (name === "Blog Platform") return blogJson;
    if (name === "Retailer") return "CREATE TABLE products (id INT);";
    return null;
  }),
  getSchemaFormat: vi.fn((name: string) => {
    if (name === "Blog Platform") return "drawdb";
    if (name === "University") return "mermaid";
    if (name === "Retailer") return "sql";
    return "sql";
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
  it("respects an explicit Blog Platform format", () => {
    expect(
      resolveSchemaFormat({
        name: "Blog Platform",
        format: "sql",
        tables: [],
      })
    ).toBe("sql");
  });

  it("falls back to native DrawDB for Blog Platform when format unset", () => {
    expect(
      resolveSchemaFormat({
        name: "Blog Platform",
        format: undefined as unknown as "sql",
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

  it("uses Blog Platform fixture JSON when format is drawdb", () => {
    const schema: DatabaseSchema = {
      name: "Blog Platform",
      format: "drawdb",
      tables: [],
    };
    const text = getEditorTextForSchema(schema);
    expect(text).toBe(blogJson);
  });

  it("converts Blog Platform via schemaToFormat when format is SQL", () => {
    const text = getEditorTextForSchema({
      name: "Blog Platform",
      format: "sql",
      tables: [],
    });
    expect(text).toContain("CREATE TABLE reconstructed");
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
