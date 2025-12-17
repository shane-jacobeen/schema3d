import { describe, it, expect } from "vitest";
import { parseSqlSchema, identifyValidSqlBlocks } from "@/schemas/parsers";

describe("parseSqlSchema", () => {
  it("should parse a simple CREATE TABLE statement", () => {
    const sql = `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50),
        email VARCHAR(255)
      );
    `;

    const schema = parseSqlSchema(sql);
    expect(schema).not.toBeNull();
    expect(schema?.tables).toHaveLength(1);
    expect(schema?.tables[0].name).toBe("users");
    expect(schema?.tables[0].columns).toHaveLength(3);
    expect(schema?.tables[0].columns[0].name).toBe("id");
    expect(schema?.tables[0].columns[0].isPrimaryKey).toBe(true);
  });

  it("should parse table-level FOREIGN KEY constraints", () => {
    const sql = `
      CREATE TABLE orders (
        id INT PRIMARY KEY,
        user_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE users (
        id INT PRIMARY KEY
      );
    `;

    const schema = parseSqlSchema(sql);
    expect(schema).not.toBeNull();
    const ordersTable = schema?.tables.find((t) => t.name === "orders");
    expect(ordersTable).toBeDefined();
    const userIdColumn = ordersTable?.columns.find((c) => c.name === "user_id");
    expect(userIdColumn?.isForeignKey).toBe(true);
    expect(userIdColumn?.references?.table).toBe("users");
    expect(userIdColumn?.references?.column).toBe("id");
  });

  it("should parse column-level FOREIGN KEY constraints", () => {
    const sql = `
      CREATE TABLE users (
        id INT PRIMARY KEY
      );
      CREATE TABLE posts (
        id INT PRIMARY KEY,
        user_id INT REFERENCES users(id)
      );
    `;

    const schema = parseSqlSchema(sql);
    expect(schema).not.toBeNull();
    const postsTable = schema?.tables.find((t) => t.name === "posts");
    expect(postsTable).toBeDefined();
    const userIdColumn = postsTable?.columns.find((c) => c.name === "user_id");
    expect(userIdColumn?.isForeignKey).toBe(true);
    expect(userIdColumn?.references?.table).toBe("users");
  });

  it("should parse T-SQL bracketed identifiers", () => {
    const sql = `
      CREATE TABLE [Users] (
        [Id] INT PRIMARY KEY,
        [UserName] VARCHAR(50)
      );
    `;

    const schema = parseSqlSchema(sql);
    expect(schema).not.toBeNull();
    expect(schema?.tables[0].name).toBe("Users");
    expect(schema?.tables[0].columns[0].name).toBe("Id");
  });

  it("should parse ALTER TABLE ADD statements", () => {
    const sql = `
      CREATE TABLE users (
        id INT PRIMARY KEY
      );
      ALTER TABLE users ADD email VARCHAR(255);
    `;

    const schema = parseSqlSchema(sql);
    expect(schema).not.toBeNull();
    const usersTable = schema?.tables.find((t) => t.name === "users");
    expect(usersTable?.columns).toHaveLength(2);
    expect(usersTable?.columns.some((c) => c.name === "email")).toBe(true);
  });

  it("should parse UNIQUE constraints", () => {
    const sql = `
      CREATE TABLE users (
        id INT PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        username VARCHAR(50) UNIQUE
      );
    `;

    const schema = parseSqlSchema(sql);
    expect(schema).not.toBeNull();
    const emailColumn = schema?.tables[0].columns.find(
      (c) => c.name === "email"
    );
    const usernameColumn = schema?.tables[0].columns.find(
      (c) => c.name === "username"
    );
    expect(emailColumn?.isUnique).toBe(true);
    expect(usernameColumn?.isUnique).toBe(true);
  });

  it("should return null for invalid SQL", () => {
    const sql = "INVALID SQL STATEMENT";
    const schema = parseSqlSchema(sql);
    expect(schema).toBeNull();
  });

  it("should handle empty input", () => {
    const schema = parseSqlSchema("");
    expect(schema).toBeNull();
  });

  it("should parse multiple tables with relationships", () => {
    const sql = `
      CREATE TABLE users (
        id INT PRIMARY KEY,
        name VARCHAR(100)
      );
      CREATE TABLE posts (
        id INT PRIMARY KEY,
        user_id INT REFERENCES users(id),
        title VARCHAR(200)
      );
      CREATE TABLE comments (
        id INT PRIMARY KEY,
        post_id INT REFERENCES posts(id),
        content TEXT
      );
    `;

    const schema = parseSqlSchema(sql);
    expect(schema).not.toBeNull();
    expect(schema?.tables).toHaveLength(3);

    const postsTable = schema?.tables.find((t) => t.name === "posts");
    expect(
      postsTable?.columns.find((c) => c.name === "user_id")?.isForeignKey
    ).toBe(true);

    const commentsTable = schema?.tables.find((t) => t.name === "comments");
    expect(
      commentsTable?.columns.find((c) => c.name === "post_id")?.isForeignKey
    ).toBe(true);
  });
});

describe("identifyValidSqlBlocks", () => {
  it("should identify valid SQL blocks", () => {
    const sql = "CREATE TABLE users (id INT PRIMARY KEY);";
    const blocks = identifyValidSqlBlocks(sql);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.some((b) => b.isValid)).toBe(true);
  });

  it("should mark invalid SQL as invalid", () => {
    const sql = "INVALID SQL STATEMENT";
    const blocks = identifyValidSqlBlocks(sql);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.every((b) => !b.isValid)).toBe(true);
  });

  it("should handle mixed valid and invalid SQL", () => {
    const sql = "CREATE TABLE users (id INT); INVALID STATEMENT";
    const blocks = identifyValidSqlBlocks(sql);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.some((b) => b.isValid)).toBe(true);
    expect(blocks.some((b) => !b.isValid)).toBe(true);
  });
});
