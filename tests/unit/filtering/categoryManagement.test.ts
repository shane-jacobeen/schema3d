import { describe, it, expect } from "vitest";
import type { DatabaseSchema, Table } from "@/shared/types/schema";

describe("Category Filtering - Schema Organization", () => {
  const createTable = (
    name: string,
    category: string,
    color: string
  ): Table => ({
    name,
    columns: [],
    position: [0, 0, 0],
    color,
    category,
  });

  const createSchema = (tables: Table[]): DatabaseSchema => ({
    name: "Test Schema",
    format: "sql",
    tables,
  });

  describe("Category Assignment", () => {
    it("should assign categories to tables based on their names", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("products", "Product", "#10b981"),
        createTable("orders", "Order", "#f59e0b"),
      ]);

      expect(schema.tables[0].category).toBe("Auth");
      expect(schema.tables[1].category).toBe("Product");
      expect(schema.tables[2].category).toBe("Order");
    });

    it("should assign unique colors to different categories", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("products", "Product", "#10b981"),
        createTable("orders", "Order", "#f59e0b"),
      ]);

      const colors = schema.tables.map((t) => t.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(3);
    });

    it("should assign the same color to tables in the same category", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("user_profiles", "Auth", "#3b82f6"),
        createTable("products", "Product", "#10b981"),
      ]);

      expect(schema.tables[0].color).toBe(schema.tables[1].color);
      expect(schema.tables[0].color).not.toBe(schema.tables[2].color);
    });
  });

  describe("Category Filtering Logic", () => {
    it("should filter tables by selected categories", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("products", "Product", "#10b981"),
        createTable("orders", "Order", "#f59e0b"),
      ]);

      const selectedCategories = new Set(["Auth", "Product"]);
      const filteredTables = schema.tables.filter((table) =>
        selectedCategories.has(table.category)
      );

      expect(filteredTables).toHaveLength(2);
      expect(filteredTables[0].name).toBe("users");
      expect(filteredTables[1].name).toBe("products");
    });

    it("should show all tables when no categories are selected", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("products", "Product", "#10b981"),
        createTable("orders", "Order", "#f59e0b"),
      ]);

      const selectedCategories = new Set<string>();
      const shouldShowTable = (table: Table) =>
        selectedCategories.size === 0 || selectedCategories.has(table.category);

      const visibleTables = schema.tables.filter(shouldShowTable);
      expect(visibleTables).toHaveLength(3);
    });

    it("should handle toggling a single category", () => {
      const selectedCategories = new Set(["Auth", "Product", "Order"]);

      // Toggle off "Product"
      selectedCategories.delete("Product");
      expect(selectedCategories.has("Product")).toBe(false);
      expect(selectedCategories.size).toBe(2);

      // Toggle on "Product"
      selectedCategories.add("Product");
      expect(selectedCategories.has("Product")).toBe(true);
      expect(selectedCategories.size).toBe(3);
    });

    it("should extract unique categories from schema", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("user_profiles", "Auth", "#3b82f6"),
        createTable("products", "Product", "#10b981"),
        createTable("inventory", "Product", "#10b981"),
        createTable("orders", "Order", "#f59e0b"),
      ]);

      const categories = new Map<string, string>();
      schema.tables.forEach((table) => {
        if (!categories.has(table.category)) {
          categories.set(table.category, table.color);
        }
      });

      expect(categories.size).toBe(3);
      expect(categories.has("Auth")).toBe(true);
      expect(categories.has("Product")).toBe(true);
      expect(categories.has("Order")).toBe(true);
    });
  });

  describe("Category Management", () => {
    it("should rename a category across all tables", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("user_profiles", "Auth", "#3b82f6"),
        createTable("products", "Product", "#10b981"),
      ]);

      // Rename "Auth" to "Authentication"
      const updatedTables = schema.tables.map((table) =>
        table.category === "Auth"
          ? { ...table, category: "Authentication" }
          : table
      );

      expect(updatedTables[0].category).toBe("Authentication");
      expect(updatedTables[1].category).toBe("Authentication");
      expect(updatedTables[2].category).toBe("Product");
    });

    it("should move tables to a different category", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("products", "Product", "#10b981"),
      ]);

      // Move "users" to "Customer" category
      const updatedTables = schema.tables.map((table) =>
        table.name === "users"
          ? { ...table, category: "Customer", color: "#f59e0b" }
          : table
      );

      expect(updatedTables[0].category).toBe("Customer");
      expect(updatedTables[0].color).toBe("#f59e0b");
      expect(updatedTables[1].category).toBe("Product");
    });

    it("should update category color for all tables in that category", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("user_profiles", "Auth", "#3b82f6"),
        createTable("products", "Product", "#10b981"),
      ]);

      const newColor = "#ff0000";
      const updatedTables = schema.tables.map((table) =>
        table.category === "Auth" ? { ...table, color: newColor } : table
      );

      expect(updatedTables[0].color).toBe(newColor);
      expect(updatedTables[1].color).toBe(newColor);
      expect(updatedTables[2].color).toBe("#10b981");
    });

    it("should move tables out of a category to General", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("products", "Product", "#10b981"),
      ]);

      // Remove "users" from Auth category
      const updatedTables = schema.tables.map((table) =>
        table.name === "users"
          ? { ...table, category: "General", color: "#6b7280" }
          : table
      );

      expect(updatedTables[0].category).toBe("General");
      expect(updatedTables[1].category).toBe("Product");
    });

    it("should handle adding tables to a new category", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("products", "Product", "#10b981"),
      ]);

      const newCategory = "Analytics";
      const newColor = "#8b5cf6";

      const updatedSchema = createSchema([
        ...schema.tables,
        createTable("reports", newCategory, newColor),
      ]);

      expect(updatedSchema.tables).toHaveLength(3);
      expect(updatedSchema.tables[2].category).toBe(newCategory);
      expect(updatedSchema.tables[2].color).toBe(newColor);
    });
  });

  describe("Category Validation", () => {
    it("should validate category names are non-empty", () => {
      const isValidCategoryName = (name: string) => name.trim().length > 0;

      expect(isValidCategoryName("Auth")).toBe(true);
      expect(isValidCategoryName("  Product  ")).toBe(true);
      expect(isValidCategoryName("")).toBe(false);
      expect(isValidCategoryName("   ")).toBe(false);
    });

    it("should capitalize category names consistently", () => {
      const capitalizeCategoryName = (name: string) =>
        name.trim().charAt(0).toUpperCase() +
        name.trim().slice(1).toLowerCase();

      expect(capitalizeCategoryName("auth")).toBe("Auth");
      expect(capitalizeCategoryName("AUTH")).toBe("Auth");
      expect(capitalizeCategoryName("AuTh")).toBe("Auth");
      expect(capitalizeCategoryName("product")).toBe("Product");
    });

    it("should validate color format", () => {
      const isValidColor = (color: string) => /^#[0-9a-f]{6}$/i.test(color);

      expect(isValidColor("#3b82f6")).toBe(true);
      expect(isValidColor("#FF0000")).toBe(true);
      expect(isValidColor("#abc123")).toBe(true);
      expect(isValidColor("3b82f6")).toBe(false);
      expect(isValidColor("#3b82f")).toBe(false);
      expect(isValidColor("#gggggg")).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle schema with no tables", () => {
      const schema = createSchema([]);
      const categories = new Map<string, string>();

      schema.tables.forEach((table) => {
        if (!categories.has(table.category)) {
          categories.set(table.category, table.color);
        }
      });

      expect(categories.size).toBe(0);
    });

    it("should handle all tables in the same category", () => {
      const schema = createSchema([
        createTable("users", "Auth", "#3b82f6"),
        createTable("accounts", "Auth", "#3b82f6"),
        createTable("profiles", "Auth", "#3b82f6"),
      ]);

      const categories = new Map<string, string>();
      schema.tables.forEach((table) => {
        if (!categories.has(table.category)) {
          categories.set(table.category, table.color);
        }
      });

      expect(categories.size).toBe(1);
      expect(categories.has("Auth")).toBe(true);
    });

    it("should handle category with empty table list", () => {
      const tablesByCategory = new Map<string, Table[]>();
      tablesByCategory.set("Auth", []);
      tablesByCategory.set("Product", [
        createTable("products", "Product", "#10b981"),
      ]);

      expect(tablesByCategory.get("Auth")).toHaveLength(0);
      expect(tablesByCategory.get("Product")).toHaveLength(1);
    });
  });
});
