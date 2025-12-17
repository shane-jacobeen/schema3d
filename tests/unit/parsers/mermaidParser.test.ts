import { describe, it, expect } from "vitest";
import {
  parseMermaidSchema,
  identifyValidMermaidBlocks,
} from "@/schemas/parsers";

describe("parseMermaidSchema", () => {
  it("should parse a simple Mermaid ER diagram", () => {
    const mermaid = `
      erDiagram
          USER {
              int id PK
              string username
          }
    `;

    const schema = parseMermaidSchema(mermaid);
    expect(schema).not.toBeNull();
    expect(schema?.tables).toHaveLength(1);
    expect(schema?.tables[0].name).toBe("USER");
    expect(schema?.tables[0].columns).toHaveLength(2);
    expect(schema?.tables[0].columns[0].isPrimaryKey).toBe(true);
  });

  it("should parse relationships with cardinality", () => {
    const mermaid = `
      erDiagram
          USER ||--o{ POST : creates
          USER {
              int id PK
          }
          POST {
              int id PK
              int user_id FK
          }
    `;

    const schema = parseMermaidSchema(mermaid);
    expect(schema).not.toBeNull();
    expect(schema?.tables).toHaveLength(2);

    const postTable = schema?.tables.find((t) => t.name === "POST");
    const userIdColumn = postTable?.columns.find((c) => c.name === "user_id");
    expect(userIdColumn?.isForeignKey).toBe(true);
    expect(userIdColumn?.references?.table).toBe("USER");
  });

  it("should parse all cardinality types", () => {
    const mermaid = `
      erDiagram
          A ||--|| B : one_to_one
          C ||--o{ D : one_to_many
          E o{--|| F : many_to_one
          G o{--o{ H : many_to_many
    `;

    const schema = parseMermaidSchema(mermaid);
    expect(schema).not.toBeNull();
    expect(schema?.tables.length).toBeGreaterThanOrEqual(4);
  });

  it("should normalize cardinality when FK is on left side of Mermaid syntax", () => {
    // Mermaid: POST o{--|| USER means POST has many, USER has one
    // FK should be in POST, referenced is USER
    // Cardinality should be normalized to: left=USER (1), right=POST (0..N)
    const mermaid = `
      erDiagram
          POST o{--|| USER : created_by
          POST {
              int id PK
          }
          USER {
              int id PK
          }
    `;

    const schema = parseMermaidSchema(mermaid);
    expect(schema).not.toBeNull();

    const postTable = schema?.tables.find((t) => t.name === "POST");

    // Find FK column in POST
    const fkColumn = postTable?.columns.find((c) => c.isForeignKey);
    expect(fkColumn).toBeDefined();
    expect(fkColumn?.references?.table).toBe("USER");

    // Verify cardinality is normalized: left=referenced (USER), right=FK (POST)
    // Should be "1:0..N" where left (1) = USER, right (0..N) = POST
    const cardinality = fkColumn?.references?.cardinality;
    expect(cardinality).toBeDefined();
    // The cardinality should have referenced table (USER) on left, FK table (POST) on right
    // Since USER has "||" (1) and POST has "o{" (0..N), normalized should be "1:0..N"
    expect(cardinality).toMatch(/^1:/); // Left side should be "1" (referenced table)
    expect(cardinality).toMatch(/:0\.\.N$/); // Right side should be "0..N" (FK table)
  });

  it("should normalize cardinality when FK is on right side of Mermaid syntax", () => {
    // Mermaid: USER ||--o{ POST means USER has one, POST has many
    // FK should be in POST, referenced is USER
    // Cardinality should already be correct: left=USER (1), right=POST (0..N)
    const mermaid = `
      erDiagram
          USER ||--o{ POST : creates
          USER {
              int id PK
          }
          POST {
              int id PK
          }
    `;

    const schema = parseMermaidSchema(mermaid);
    expect(schema).not.toBeNull();

    const postTable = schema?.tables.find((t) => t.name === "POST");
    const fkColumn = postTable?.columns.find((c) => c.isForeignKey);
    expect(fkColumn).toBeDefined();
    expect(fkColumn?.references?.table).toBe("USER");

    // Verify cardinality: left=referenced (USER), right=FK (POST)
    const cardinality = fkColumn?.references?.cardinality;
    expect(cardinality).toBeDefined();
    expect(cardinality).toMatch(/^1:/); // Left side should be "1" (referenced table)
    expect(cardinality).toMatch(/:0\.\.N$/); // Right side should be "0..N" (FK table)
  });

  it("should parse multiple constraints on a column", () => {
    const mermaid = `
      erDiagram
          USER {
              int id PK, FK
              string email UK
          }
    `;

    const schema = parseMermaidSchema(mermaid);
    expect(schema).not.toBeNull();
    const idColumn = schema?.tables[0].columns.find((c) => c.name === "id");
    expect(idColumn?.isPrimaryKey).toBe(true);
    expect(idColumn?.isForeignKey).toBe(true);

    const emailColumn = schema?.tables[0].columns.find(
      (c) => c.name === "email"
    );
    expect(emailColumn?.isUnique).toBe(true);
  });

  it("should handle tables defined only by relationships", () => {
    const mermaid = `
      erDiagram
          USER ||--o{ POST : creates
    `;

    const schema = parseMermaidSchema(mermaid);
    expect(schema).not.toBeNull();
    expect(schema?.tables).toHaveLength(2);
    expect(schema?.tables.some((t) => t.name === "USER")).toBe(true);
    expect(schema?.tables.some((t) => t.name === "POST")).toBe(true);
  });

  it("should return null for non-Mermaid text", () => {
    const sql = "CREATE TABLE users (id INT);";
    const schema = parseMermaidSchema(sql);
    expect(schema).toBeNull();
  });

  it("should return null for empty input", () => {
    const schema = parseMermaidSchema("");
    expect(schema).toBeNull();
  });

  it("should parse complex relationships with all cardinality symbols", () => {
    const mermaid = `
      erDiagram
          STUDENT ||--o{ ENROLLMENT : has
          COURSE ||--o{ ENROLLMENT : contains
          STUDENT {
              int student_id PK
          }
          COURSE {
              string course_code PK
          }
          ENROLLMENT {
              int enrollment_id PK
              int student_id FK
              string course_code FK
          }
    `;

    const schema = parseMermaidSchema(mermaid);
    expect(schema).not.toBeNull();
    expect(schema?.tables).toHaveLength(3);

    const enrollmentTable = schema?.tables.find((t) => t.name === "ENROLLMENT");
    expect(enrollmentTable?.columns.filter((c) => c.isForeignKey)).toHaveLength(
      2
    );
  });
});

describe("identifyValidMermaidBlocks", () => {
  it("should identify valid Mermaid blocks", () => {
    const mermaid = "erDiagram\n    USER { int id PK }";
    const blocks = identifyValidMermaidBlocks(mermaid);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.some((b) => b.isValid)).toBe(true);
  });

  it("should mark invalid Mermaid as invalid", () => {
    const mermaid = "INVALID MERMAID";
    const blocks = identifyValidMermaidBlocks(mermaid);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.every((b) => !b.isValid)).toBe(true);
  });
});
