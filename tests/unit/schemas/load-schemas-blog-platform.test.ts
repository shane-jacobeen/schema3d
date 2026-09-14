import { describe, it, expect } from "vitest";
import {
  getBlogPlatformSchema,
  BLOG_PLATFORM_DRAWDB,
  BLOG_PLATFORM_SQL,
  getSchemaFormat,
  getSchemaText,
  getRetailerSchema,
  getUniversitySchema,
} from "@/schemas/utils/load-schemas";
import { parseSqlSchema } from "@/schemas/parsers/sql-parser";

describe("getBlogPlatformSchema (DrawDB)", () => {
  it("returns non-null schema with expected tables from DrawDB JSON", () => {
    const schema = getBlogPlatformSchema();
    expect(schema).not.toBeNull();
    expect(schema.name).toBe("Blog Platform");
    expect(schema.format).toBe("drawdb");
    expect(getSchemaFormat("Blog Platform")).toBe("drawdb");

    const names = schema.tables.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "bookmarks",
        "categories",
        "comments",
        "follows",
        "likes",
        "media",
        "notifications",
        "post_tags",
        "posts",
        "tags",
        "user_profiles",
        "users",
      ].sort()
    );

    const posts = schema.tables.find((t) => t.name === "posts")!;
    expect(
      posts.columns.find((c) => c.name === "user_id")?.references?.table
    ).toBe("users");
  });

  it("migrates sample editor content to DrawDB JSON (not SQL)", () => {
    const text = getSchemaText("Blog Platform");
    expect(text).toBeTruthy();
    expect(text!.trim().startsWith("{")).toBe(true);
    expect(text).toContain('"title": "Blog Platform"');
    expect(text).not.toMatch(/CREATE TABLE/i);
    expect(getBlogPlatformSchema().format).toBe("drawdb");
  });

  it("exposes DrawDB JSON via getSchemaText and BLOG_PLATFORM_DRAWDB", () => {
    expect(BLOG_PLATFORM_DRAWDB.title).toBe("Blog Platform");
    const text = getSchemaText("Blog Platform");
    expect(text).toContain('"title": "Blog Platform"');
    expect(text).toContain('"tables"');
  });

  it("keeps SQL fixture parseable for regression", () => {
    const sqlSchema = parseSqlSchema(BLOG_PLATFORM_SQL);
    expect(sqlSchema).not.toBeNull();
    expect(sqlSchema!.tables.filter((t) => !t.isView).length).toBe(12);
    expect(sqlSchema!.tables.filter((t) => t.isView).length).toBe(3);
  });

  it("does not regress Retailer or University samples", () => {
    expect(getRetailerSchema().tables.length).toBeGreaterThan(0);
    expect(getUniversitySchema().format).toBe("mermaid");
    expect(getSchemaFormat("Retailer")).toBe("sql");
    expect(getSchemaFormat("University")).toBe("mermaid");
  });
});
