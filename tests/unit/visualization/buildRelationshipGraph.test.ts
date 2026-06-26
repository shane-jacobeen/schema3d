import { describe, it, expect } from "vitest";
import { buildRelationshipGraph } from "@/visualizer/3d/utils/build-relationship-graph";
import type { DatabaseSchema } from "@/shared/types/schema";

const sampleSchema: DatabaseSchema = {
  name: "Test",
  format: "sql",
  tables: [
    {
      name: "users",
      category: "Auth",
      color: "#3b82f6",
      position: [0, 0, 0],
      columns: [
        { name: "id", type: "int", isPrimaryKey: true, isForeignKey: false },
      ],
    },
    {
      name: "posts",
      category: "Content",
      color: "#10b981",
      position: [5, 0, 0],
      columns: [
        { name: "id", type: "int", isPrimaryKey: true, isForeignKey: false },
        {
          name: "user_id",
          type: "int",
          isPrimaryKey: false,
          isForeignKey: true,
          references: { table: "users", column: "id" },
        },
      ],
    },
  ],
};

describe("buildRelationshipGraph", () => {
  it("builds relationships from foreign keys", () => {
    const relationships = buildRelationshipGraph({ schema: sampleSchema });
    expect(relationships).toHaveLength(1);
    expect(relationships[0]?.fromTable).toBe("posts");
    expect(relationships[0]?.toTable).toBe("users");
  });

  it("respects visible table filter", () => {
    const relationships = buildRelationshipGraph({
      schema: sampleSchema,
      visibleTableNames: new Set(["users"]),
    });
    expect(relationships).toHaveLength(0);
  });
});
