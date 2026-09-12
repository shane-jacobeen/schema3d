import { describe, it, expect } from "vitest";
import { isDrawdbDiagram, tryParseDrawdbJson } from "@/schemas/parsers/drawdb";
import blogPlatformDrawdb from "@/schemas/sample-schemas/blog-platform.drawdb.json";
import minimal from "../../../fixtures/drawdb/minimal.json";

describe("isDrawdbDiagram", () => {
  it("accepts Blog Platform DrawDB JSON", () => {
    expect(isDrawdbDiagram(blogPlatformDrawdb)).toBe(true);
  });

  it("accepts minimal fixture", () => {
    expect(isDrawdbDiagram(minimal)).toBe(true);
  });

  it("rejects random JSON objects", () => {
    expect(isDrawdbDiagram({ foo: "bar" })).toBe(false);
    expect(isDrawdbDiagram({ tables: [] })).toBe(false);
    expect(
      isDrawdbDiagram({ tables: [{ name: "x" }], relationships: [] })
    ).toBe(false);
  });

  it("rejects null, arrays, and primitives", () => {
    expect(isDrawdbDiagram(null)).toBe(false);
    expect(isDrawdbDiagram([])).toBe(false);
    expect(isDrawdbDiagram("sql")).toBe(false);
    expect(isDrawdbDiagram(42)).toBe(false);
  });

  it("rejects non-array notes or subjectAreas", () => {
    expect(
      isDrawdbDiagram({
        tables: minimal.tables,
        relationships: [],
        notes: "nope",
      })
    ).toBe(false);
    expect(
      isDrawdbDiagram({
        tables: minimal.tables,
        relationships: [],
        subjectAreas: {},
      })
    ).toBe(false);
  });

  it("rejects tables whose fields lack DrawDB field shape", () => {
    expect(
      isDrawdbDiagram({
        tables: [{ name: "t", fields: [{ name: "id", type: "INT" }] }],
        relationships: [],
      })
    ).toBe(false);
  });
});

describe("tryParseDrawdbJson", () => {
  it("parses DrawDB JSON text", () => {
    const text = JSON.stringify(minimal);
    expect(tryParseDrawdbJson(text)).not.toBeNull();
  });

  it("rejects SQL strings", () => {
    expect(
      tryParseDrawdbJson("CREATE TABLE users (id INT PRIMARY KEY);")
    ).toBeNull();
  });

  it("rejects invalid JSON", () => {
    expect(tryParseDrawdbJson("{not json")).toBeNull();
  });
});
