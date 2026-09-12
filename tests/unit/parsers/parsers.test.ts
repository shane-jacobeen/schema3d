import { describe, it, expect } from "vitest";
import {
  parseSchema,
  validateAndParse,
  identifyValidBlocks,
} from "@/schemas/parsers";
import blogPlatformDrawdb from "@/schemas/sample-schemas/blog-platform.drawdb.json";
import minimal from "../../fixtures/drawdb/minimal.json";

describe("parseSchema auto-detect", () => {
  it("detects DrawDB JSON without an explicit format", () => {
    const schema = parseSchema(JSON.stringify(blogPlatformDrawdb));
    expect(schema).not.toBeNull();
    expect(schema!.format).toBe("drawdb");
    expect(schema!.tables.length).toBe(12);
    expect(schema!.name).toBe("Blog Platform");
  });

  it("parses DrawDB when format is explicitly drawdb", () => {
    const schema = parseSchema(JSON.stringify(minimal), "drawdb");
    expect(schema).not.toBeNull();
    expect(schema!.format).toBe("drawdb");
    expect(schema!.tables.map((t) => t.name).sort()).toEqual(["a", "b"]);
  });

  it("still prefers SQL for CREATE TABLE text", () => {
    const schema = parseSchema(
      "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(50));"
    );
    expect(schema).not.toBeNull();
    expect(schema!.format).toBe("sql");
    expect(schema!.tables[0].name).toBe("users");
  });

  it("still prefers Mermaid for erDiagram text", () => {
    const schema = parseSchema(`
      erDiagram
        USER {
          int id PK
        }
    `);
    expect(schema).not.toBeNull();
    expect(schema!.format).toBe("mermaid");
  });

  it("returns null-ish / empty for invalid DrawDB JSON shape", () => {
    const schema = parseSchema('{"tables":[],"relationships":[]}');
    // Empty tables fail DrawDB detect; SQL/Mermaid also yield nothing useful
    expect(schema === null || schema.tables.length === 0).toBe(true);
  });
});

describe("validateAndParse", () => {
  it("marks Blog Platform DrawDB JSON as valid", () => {
    const result = validateAndParse(JSON.stringify(blogPlatformDrawdb));
    expect(result.isValid).toBe(true);
    expect(result.schema?.format).toBe("drawdb");
  });

  it("marks empty text as invalid", () => {
    const result = validateAndParse("");
    expect(result.isValid).toBe(false);
    expect(result.schema).toBeNull();
  });

  it("marks garbage JSON as invalid", () => {
    const result = validateAndParse("{not-json");
    expect(result.isValid).toBe(false);
  });
});

describe("identifyValidBlocks", () => {
  it("returns empty blocks for DrawDB JSON (whole-document format)", () => {
    const blocks = identifyValidBlocks(JSON.stringify(minimal), "drawdb");
    expect(blocks).toEqual([]);
  });

  it("returns SQL blocks for CREATE TABLE when format is sql", () => {
    const sql = "CREATE TABLE users (id INT PRIMARY KEY);";
    const blocks = identifyValidBlocks(sql, "sql");
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.some((b) => b.isValid)).toBe(true);
  });
});
