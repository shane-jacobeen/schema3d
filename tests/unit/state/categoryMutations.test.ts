import { describe, it, expect } from "vitest";
import type { DatabaseSchema } from "@/shared/types/schema";
import {
  deleteCategoryFromSchema,
  saveCategoryToSchema,
} from "@/visualizer/state/utils/category-state-utils";

function makeSchema(
  tables: Array<{ name: string; category: string; color: string }>
): DatabaseSchema {
  return {
    name: "Test",
    format: "sql",
    tables: tables.map((t) => ({
      name: t.name,
      category: t.category,
      color: t.color,
      columns: [],
      position: [0, 0, 0] as [number, number, number],
    })),
  };
}

describe("category mutations", () => {
  it("moves deleted category tables to General", () => {
    const schema = makeSchema([
      { name: "users", category: "Auth", color: "#111111" },
      { name: "posts", category: "Content", color: "#222222" },
      { name: "sessions", category: "Auth", color: "#111111" },
    ]);

    const updated = deleteCategoryFromSchema(schema, "Auth");
    expect(updated).not.toBeNull();
    expect(updated!.tables.filter((t) => t.category === "Auth")).toHaveLength(
      0
    );
    const moved = updated!.tables.filter((t) => t.category === "General");
    expect(moved.map((t) => t.name).sort()).toEqual(["sessions", "users"]);
    expect(
      moved.every((t) => t.color === "#3b82f6" || t.color.length > 0)
    ).toBe(true);
  });

  it("creates a new category for selected tables", () => {
    const schema = makeSchema([
      { name: "users", category: "General", color: "#3b82f6" },
      { name: "posts", category: "General", color: "#3b82f6" },
    ]);

    const updated = saveCategoryToSchema(schema, {
      categoryName: "auth",
      tableNames: new Set(["users"]),
      categoryColor: "#10b981",
      editingCategory: null,
      isNewCategory: true,
    });

    expect(updated).not.toBeNull();
    const users = updated!.tables.find((t) => t.name === "users")!;
    const posts = updated!.tables.find((t) => t.name === "posts")!;
    expect(users.category).toBe("Auth");
    expect(users.color).toBe("#10b981");
    expect(posts.category).toBe("General");
  });

  it("renames a category and reassigns membership", () => {
    const schema = makeSchema([
      { name: "users", category: "Auth", color: "#111111" },
      { name: "posts", category: "Auth", color: "#111111" },
      { name: "tags", category: "General", color: "#3b82f6" },
    ]);

    const updated = saveCategoryToSchema(schema, {
      categoryName: "identity",
      tableNames: new Set(["users", "tags"]),
      editingCategory: "Auth",
      isNewCategory: false,
    });

    expect(updated).not.toBeNull();
    expect(updated!.tables.find((t) => t.name === "users")!.category).toBe(
      "Identity"
    );
    expect(updated!.tables.find((t) => t.name === "tags")!.category).toBe(
      "Identity"
    );
    expect(updated!.tables.find((t) => t.name === "posts")!.category).toBe(
      "General"
    );
  });
});
