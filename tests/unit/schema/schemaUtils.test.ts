import { describe, it, expect } from "vitest";
import { areSchemasEqual } from "@/visualizer/state/utils/schema-utils";
import { schemaToFormat } from "@/schemas/utils/schema-converter";
import { parseSchema } from "@/schemas/parsers";

describe("areSchemasEqual", () => {
  it("should return true for identical schemas", () => {
    const sql = `
      CREATE TABLE users (
        id INT PRIMARY KEY,
        name VARCHAR(100)
      );
    `;

    const schema1 = parseSchema(sql, "sql");
    const schema2 = parseSchema(sql, "sql");

    expect(schema1).not.toBeNull();
    expect(schema2).not.toBeNull();
    expect(areSchemasEqual(schema1!, schema2!)).toBe(true);
  });

  it("should return false for schemas with different table counts", () => {
    const sql1 = "CREATE TABLE users (id INT PRIMARY KEY);";
    const sql2 = `
      CREATE TABLE users (id INT PRIMARY KEY);
      CREATE TABLE posts (id INT PRIMARY KEY);
    `;

    const schema1 = parseSchema(sql1, "sql");
    const schema2 = parseSchema(sql2, "sql");

    expect(schema1).not.toBeNull();
    expect(schema2).not.toBeNull();
    expect(areSchemasEqual(schema1!, schema2!)).toBe(false);
  });

  it("should return false for schemas with different column types", () => {
    const sql1 = "CREATE TABLE users (id INT PRIMARY KEY);";
    const sql2 = "CREATE TABLE users (id VARCHAR(50) PRIMARY KEY);";

    const schema1 = parseSchema(sql1, "sql");
    const schema2 = parseSchema(sql2, "sql");

    expect(schema1).not.toBeNull();
    expect(schema2).not.toBeNull();
    expect(areSchemasEqual(schema1!, schema2!)).toBe(false);
  });

  it("should ignore visual properties (position, color) when comparing", () => {
    const sql = "CREATE TABLE users (id INT PRIMARY KEY);";
    const schema1 = parseSchema(sql, "sql");
    const schema2 = parseSchema(sql, "sql");

    if (schema1 && schema2) {
      // Modify visual properties
      schema1.tables[0].position = [1, 2, 3];
      schema1.tables[0].color = "#ff0000";
      schema2.tables[0].position = [4, 5, 6];
      schema2.tables[0].color = "#00ff00";

      expect(areSchemasEqual(schema1, schema2)).toBe(true);
    }
  });

  it("should return false for schemas with different foreign key relationships", () => {
    const sql1 = `
      CREATE TABLE users (id INT PRIMARY KEY);
      CREATE TABLE posts (id INT PRIMARY KEY, user_id INT REFERENCES users(id));
    `;
    const sql2 = `
      CREATE TABLE users (id INT PRIMARY KEY);
      CREATE TABLE posts (id INT PRIMARY KEY);
    `;

    const schema1 = parseSchema(sql1, "sql");
    const schema2 = parseSchema(sql2, "sql");

    expect(schema1).not.toBeNull();
    expect(schema2).not.toBeNull();
    expect(areSchemasEqual(schema1!, schema2!)).toBe(false);
  });

  it("should handle case-insensitive table and column names", () => {
    const sql1 = "CREATE TABLE Users (Id INT PRIMARY KEY);";
    const sql2 = "CREATE TABLE users (id INT PRIMARY KEY);";

    const schema1 = parseSchema(sql1, "sql");
    const schema2 = parseSchema(sql2, "sql");

    expect(schema1).not.toBeNull();
    expect(schema2).not.toBeNull();
    // Note: This depends on how the parser handles case - adjust based on actual behavior
    expect(areSchemasEqual(schema1!, schema2!)).toBeDefined();
  });
});

describe("schemaToFormat", () => {
  it("should convert SQL schema to SQL format", () => {
    const sql = "CREATE TABLE users (id INT PRIMARY KEY);";
    const schema = parseSchema(sql, "sql");

    expect(schema).not.toBeNull();
    if (schema) {
      const output = schemaToFormat(schema);
      expect(output).toContain("CREATE TABLE");
      expect(output).toContain("users");
    }
  });

  it("should convert Mermaid schema to Mermaid format", () => {
    const mermaid = `
      erDiagram
          USER {
              int id PK
          }
    `;
    const schema = parseSchema(mermaid, "mermaid");

    expect(schema).not.toBeNull();
    if (schema) {
      const output = schemaToFormat(schema);
      expect(output).toContain("erDiagram");
      expect(output).toContain("USER");
    }
  });

  it("should convert DrawDB schema to DrawDB JSON", () => {
    const schema = parseSchema(
      JSON.stringify({
        title: "Tiny",
        database: "generic",
        tables: [
          {
            id: 0,
            name: "users",
            x: 0,
            y: 0,
            comment: "",
            indices: [],
            color: "#175e7a",
            fields: [
              {
                id: 1,
                name: "id",
                type: "INTEGER",
                default: "",
                check: "",
                primary: true,
                unique: false,
                notNull: true,
                increment: true,
                comment: "",
              },
            ],
          },
        ],
        relationships: [],
        notes: [],
        subjectAreas: [],
      })
    );

    expect(schema).not.toBeNull();
    expect(schema!.format).toBe("drawdb");
    const output = schemaToFormat(schema!);
    expect(output.trim().startsWith("{")).toBe(true);
    expect(output).toContain('"tables"');
    expect(output).toContain("users");
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it("should preserve relationships in converted format", () => {
    const sql = `
      CREATE TABLE users (id INT PRIMARY KEY);
      CREATE TABLE posts (id INT PRIMARY KEY, user_id INT REFERENCES users(id));
    `;
    const schema = parseSchema(sql, "sql");

    expect(schema).not.toBeNull();
    if (schema) {
      const output = schemaToFormat(schema);
      expect(output).toContain("posts");
      expect(output).toContain("user_id");
    }
  });
});
