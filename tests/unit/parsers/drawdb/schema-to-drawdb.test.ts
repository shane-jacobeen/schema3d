import { describe, it, expect } from "vitest";
import {
  drawdbDiagramToSchema,
  schemaToDrawdbJson,
  schemaToDrawdbText,
  tryParseDrawdbJson,
} from "@/schemas/parsers/drawdb";
import blogPlatformDrawdb from "@/schemas/sample-schemas/blog-platform.drawdb.json";
import type { DrawdbDiagram } from "@/schemas/parsers/drawdb";
import type { DatabaseSchema } from "@/shared/types/schema";

describe("schemaToDrawdbJson", () => {
  it("round-trips Blog Platform table and FK names", () => {
    const inbound = drawdbDiagramToSchema(
      blogPlatformDrawdb as unknown as DrawdbDiagram
    );
    const outbound = schemaToDrawdbJson(inbound);

    expect(outbound.title).toBe("Blog Platform");
    expect(outbound.database).toBe("postgresql");
    expect(outbound.notes).toEqual([]);
    expect(outbound.subjectAreas).toEqual([]);

    const inNames = inbound.tables.map((t) => t.name).sort();
    const outNames = outbound.tables.map((t) => t.name).sort();
    expect(outNames).toEqual(inNames);

    const inboundFks = new Set<string>();
    for (const table of inbound.tables) {
      for (const col of table.columns) {
        if (col.isForeignKey && col.references) {
          inboundFks.add(
            `${table.name}.${col.name}->${col.references.table}.${col.references.column}`
          );
        }
      }
    }

    const tableById = new Map(
      outbound.tables.map((t) => [String(t.id), t] as const)
    );
    const fieldById = new Map<
      string,
      { tableName: string; fieldName: string }
    >();
    for (const table of outbound.tables) {
      for (const field of table.fields) {
        fieldById.set(String(field.id), {
          tableName: table.name,
          fieldName: field.name,
        });
      }
    }

    const outboundFks = new Set<string>();
    for (const rel of outbound.relationships) {
      const start = fieldById.get(String(rel.startFieldId));
      const end = fieldById.get(String(rel.endFieldId));
      expect(start).toBeDefined();
      expect(end).toBeDefined();
      expect(tableById.get(String(rel.startTableId))?.name).toBe(
        start!.tableName
      );
      outboundFks.add(
        `${start!.tableName}.${start!.fieldName}->${end!.tableName}.${end!.fieldName}`
      );
    }

    expect(outboundFks).toEqual(inboundFks);
  });

  it("omits views from DrawDB export", () => {
    const schema = drawdbDiagramToSchema(
      blogPlatformDrawdb as unknown as DrawdbDiagram
    );
    schema.tables.push({
      name: "some_view",
      columns: [{ name: "id", type: "INTEGER" }],
      position: [0, 0, 0],
      color: "#000000",
      category: "View",
      isView: true,
    });

    const outbound = schemaToDrawdbJson(schema);
    expect(outbound.tables.find((t) => t.name === "some_view")).toBeUndefined();
  });

  it("maps SERIAL and VARCHAR(n) to DrawDB type/size/increment", () => {
    const schema: DatabaseSchema = {
      name: "Types",
      format: "sql",
      tables: [
        {
          name: "users",
          position: [0, 0, 0],
          color: "#3b82f6",
          category: "Auth",
          columns: [
            {
              name: "id",
              type: "SERIAL",
              isPrimaryKey: true,
              isNullable: false,
            },
            {
              name: "email",
              type: "VARCHAR(255)",
              isUnique: true,
              isNullable: false,
            },
            { name: "bio", type: "TEXT", isNullable: true },
          ],
        },
      ],
    };

    const outbound = schemaToDrawdbJson(schema);
    const fields = outbound.tables[0].fields;
    const id = fields.find((f) => f.name === "id")!;
    expect(id.type).toBe("INTEGER");
    expect(id.increment).toBe(true);
    expect(id.primary).toBe(true);

    const email = fields.find((f) => f.name === "email")!;
    expect(email.type).toBe("VARCHAR");
    expect(email.size).toBe(255);
    expect(email.unique).toBe(true);
    expect(email.notNull).toBe(true);
  });

  it("maps unique FK to one_to_one cardinality", () => {
    const schema: DatabaseSchema = {
      name: "O2O",
      format: "sql",
      tables: [
        {
          name: "users",
          position: [0, 0, 0],
          color: "#3b82f6",
          category: "Auth",
          columns: [
            {
              name: "id",
              type: "INTEGER",
              isPrimaryKey: true,
              isNullable: false,
            },
          ],
        },
        {
          name: "profiles",
          position: [1, 0, 0],
          color: "#3b82f6",
          category: "Auth",
          columns: [
            {
              name: "id",
              type: "INTEGER",
              isPrimaryKey: true,
              isNullable: false,
            },
            {
              name: "user_id",
              type: "INTEGER",
              isForeignKey: true,
              isUnique: true,
              isNullable: false,
              references: { table: "users", column: "id", cardinality: "1:1" },
            },
          ],
        },
      ],
    };

    const outbound = schemaToDrawdbJson(schema);
    expect(outbound.relationships).toHaveLength(1);
    expect(outbound.relationships[0].cardinality).toBe("one_to_one");
  });
});

describe("schemaToDrawdbText", () => {
  it("returns parseable DrawDB JSON for Blog Platform", () => {
    const schema = drawdbDiagramToSchema(
      blogPlatformDrawdb as unknown as DrawdbDiagram
    );
    const text = schemaToDrawdbText(schema);
    expect(tryParseDrawdbJson(text)).not.toBeNull();
    const reparsed = JSON.parse(text);
    expect(reparsed.tables.length).toBe(12);
    expect(reparsed.relationships.length).toBeGreaterThan(0);
  });
});
