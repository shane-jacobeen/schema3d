import { describe, it, expect, vi, afterEach } from "vitest";
import {
  drawdbDiagramToSchema,
  parseDrawdbSchema,
} from "@/schemas/parsers/drawdb";
import blogPlatformDrawdb from "@/schemas/sample-schemas/blog-platform.drawdb.json";
import type { DrawdbDiagram } from "@/schemas/parsers/drawdb";

describe("drawdbDiagramToSchema — Blog Platform", () => {
  const schema = drawdbDiagramToSchema(
    blogPlatformDrawdb as unknown as DrawdbDiagram
  );

  it("converts to a named drawdb schema with 12 tables", () => {
    expect(schema.format).toBe("drawdb");
    expect(schema.name).toBe("Blog Platform");
    expect(schema.tables).toHaveLength(12);
    expect(schema.tables.every((t) => !t.isView)).toBe(true);
  });

  it("preserves key columns on posts and post_tags", () => {
    const posts = schema.tables.find((t) => t.name === "posts");
    expect(posts).toBeDefined();
    expect(posts!.columns.find((c) => c.name === "user_id")?.isNullable).toBe(
      false
    );
    expect(
      posts!.columns.find((c) => c.name === "category_id")?.isNullable
    ).toBe(true);

    const postTags = schema.tables.find((t) => t.name === "post_tags");
    expect(postTags).toBeDefined();
    const postId = postTags!.columns.find((c) => c.name === "post_id");
    const tagId = postTags!.columns.find((c) => c.name === "tag_id");
    expect(postId?.isPrimaryKey).toBe(true);
    expect(tagId?.isPrimaryKey).toBe(true);
  });

  it("maps FK graph: posts→users, post_tags both FKs, categories self-FK", () => {
    const posts = schema.tables.find((t) => t.name === "posts")!;
    const userId = posts.columns.find((c) => c.name === "user_id")!;
    expect(userId.isForeignKey).toBe(true);
    expect(userId.references).toEqual(
      expect.objectContaining({ table: "users", column: "id" })
    );

    const categoryId = posts.columns.find((c) => c.name === "category_id")!;
    expect(categoryId.isForeignKey).toBe(true);
    expect(categoryId.references?.table).toBe("categories");
    expect(categoryId.isNullable).toBe(true);

    const postTags = schema.tables.find((t) => t.name === "post_tags")!;
    expect(
      postTags.columns.find((c) => c.name === "post_id")?.references
    ).toEqual(expect.objectContaining({ table: "posts", column: "id" }));
    expect(
      postTags.columns.find((c) => c.name === "tag_id")?.references
    ).toEqual(expect.objectContaining({ table: "tags", column: "id" }));

    const categories = schema.tables.find((t) => t.name === "categories")!;
    const parent = categories.columns.find(
      (c) => c.name === "parent_category_id"
    )!;
    expect(parent.isForeignKey).toBe(true);
    expect(parent.references).toEqual(
      expect.objectContaining({ table: "categories", column: "id" })
    );
    expect(parent.isNullable).toBe(true);
  });

  it("keeps nullable parent_comment_id self-FK", () => {
    const comments = schema.tables.find((t) => t.name === "comments")!;
    const parent = comments.columns.find(
      (c) => c.name === "parent_comment_id"
    )!;
    expect(parent.isNullable).toBe(true);
    expect(parent.isForeignKey).toBe(true);
    expect(parent.references?.table).toBe("comments");
  });
});

describe("drawdbDiagramToSchema — bad relationships", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips unresolved relationship ids and still returns tables", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const diagram: DrawdbDiagram = {
      title: "Broken",
      database: "generic",
      tables: [
        {
          id: 0,
          name: "a",
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
      relationships: [
        {
          id: 99,
          name: "bad_fk",
          startTableId: 0,
          startFieldId: 1,
          endTableId: 999,
          endFieldId: 888,
          cardinality: "many_to_one",
          updateConstraint: "No action",
          deleteConstraint: "No action",
        },
      ],
      notes: [],
      subjectAreas: [],
    };

    const schema = drawdbDiagramToSchema(diagram);
    expect(schema.tables).toHaveLength(1);
    expect(schema.tables[0].columns[0].isForeignKey).toBeFalsy();
    expect(warn).toHaveBeenCalled();
  });
});

describe("parseDrawdbSchema", () => {
  it("parses Blog Platform JSON text", () => {
    const schema = parseDrawdbSchema(JSON.stringify(blogPlatformDrawdb));
    expect(schema).not.toBeNull();
    expect(schema!.tables.length).toBe(12);
  });

  it("returns null for SQL", () => {
    expect(parseDrawdbSchema("CREATE TABLE x (id INT);")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseDrawdbSchema("")).toBeNull();
    expect(parseDrawdbSchema("   ")).toBeNull();
  });
});

describe("drawdbDiagramToSchema — field types & cardinality", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("combines type + size into Schema3D type (VARCHAR(50))", () => {
    const diagram: DrawdbDiagram = {
      title: "Sized",
      database: "postgresql",
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
              name: "username",
              type: "VARCHAR",
              size: 50,
              default: "",
              check: "",
              primary: false,
              unique: true,
              notNull: true,
              increment: false,
              comment: "",
            },
          ],
        },
      ],
      relationships: [],
      notes: [],
      subjectAreas: [],
    };

    const schema = drawdbDiagramToSchema(diagram);
    expect(schema.tables[0].columns[0].type).toBe("VARCHAR(50)");
    expect(schema.tables[0].columns[0].isUnique).toBe(true);
  });

  it("maps one_to_one nullable FK to 0..1:1 cardinality", () => {
    const diagram: DrawdbDiagram = {
      title: "O2O",
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
        {
          id: 1,
          name: "profiles",
          x: 280,
          y: 0,
          comment: "",
          indices: [],
          color: "#175e7a",
          fields: [
            {
              id: 2,
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
            {
              id: 3,
              name: "user_id",
              type: "INTEGER",
              default: "",
              check: "",
              primary: false,
              unique: true,
              notNull: false,
              increment: false,
              comment: "",
            },
          ],
        },
      ],
      relationships: [
        {
          id: 1,
          name: "profiles_user_id_fk",
          startTableId: 1,
          startFieldId: 3,
          endTableId: 0,
          endFieldId: 1,
          cardinality: "one_to_one",
          updateConstraint: "No action",
          deleteConstraint: "No action",
        },
      ],
      notes: [],
      subjectAreas: [],
    };

    const schema = drawdbDiagramToSchema(diagram);
    const userId = schema.tables
      .find((t) => t.name === "profiles")!
      .columns.find((c) => c.name === "user_id")!;
    expect(userId.isForeignKey).toBe(true);
    expect(userId.references?.cardinality).toBe("0..1:1");
  });

  it("ignores views[] and still maps tables", () => {
    const diagram = {
      ...(blogPlatformDrawdb as unknown as DrawdbDiagram),
      views: [
        {
          id: 99,
          name: "published_posts_view",
          x: 0,
          y: 0,
          joins: [],
          columns: [],
          color: "#175e7a",
        },
      ],
    } as DrawdbDiagram;

    const schema = drawdbDiagramToSchema(diagram);
    expect(schema.tables).toHaveLength(12);
    expect(
      schema.tables.find((t) => t.name === "published_posts_view")
    ).toBeUndefined();
  });

  it("skips relationship when field/table ids mismatch", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const diagram: DrawdbDiagram = {
      title: "Mismatch",
      database: "generic",
      tables: [
        {
          id: 0,
          name: "a",
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
              increment: false,
              comment: "",
            },
          ],
        },
        {
          id: 1,
          name: "b",
          x: 0,
          y: 0,
          comment: "",
          indices: [],
          color: "#175e7a",
          fields: [
            {
              id: 2,
              name: "id",
              type: "INTEGER",
              default: "",
              check: "",
              primary: true,
              unique: false,
              notNull: true,
              increment: false,
              comment: "",
            },
            {
              id: 3,
              name: "a_id",
              type: "INTEGER",
              default: "",
              check: "",
              primary: false,
              unique: false,
              notNull: true,
              increment: false,
              comment: "",
            },
          ],
        },
      ],
      relationships: [
        {
          id: 1,
          name: "bad",
          // Field 1 belongs to table 0, but startTableId claims table 1
          startTableId: 1,
          startFieldId: 1,
          endTableId: 0,
          endFieldId: 1,
          cardinality: "many_to_one",
          updateConstraint: "No action",
          deleteConstraint: "No action",
        },
      ],
      notes: [],
      subjectAreas: [],
    };

    const schema = drawdbDiagramToSchema(diagram);
    const aId = schema.tables
      .find((t) => t.name === "b")!
      .columns.find((c) => c.name === "a_id")!;
    expect(aId.isForeignKey).toBeFalsy();
    expect(warn).toHaveBeenCalled();
  });
});
