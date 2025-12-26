import { describe, it, expect } from "vitest";
import { guessCategory, COLOR_PALETTE } from "@/schemas/parsers/parser-utils";

describe("Category Filtering - guessCategory", () => {
  it("should categorize authentication tables correctly", () => {
    expect(guessCategory("users")).toBe("Auth");
    expect(guessCategory("user_profiles")).toBe("Auth");
    expect(guessCategory("accounts")).toBe("Auth");
    expect(guessCategory("authentication")).toBe("Auth");
  });

  it("should categorize product tables correctly", () => {
    expect(guessCategory("products")).toBe("Product");
    expect(guessCategory("inventory")).toBe("Product");
    expect(guessCategory("items")).toBe("Product");
    expect(guessCategory("product_categories")).toBe("Product");
  });

  it("should categorize order tables correctly", () => {
    expect(guessCategory("orders")).toBe("Order");
    expect(guessCategory("purchases")).toBe("Order");
    expect(guessCategory("shopping_cart")).toBe("Order");
    expect(guessCategory("customer_orders")).toBe("Order");
  });

  it("should categorize customer tables correctly", () => {
    expect(guessCategory("customers")).toBe("Customer");
    expect(guessCategory("clients")).toBe("Customer");
    expect(guessCategory("customer_addresses")).toBe("Customer");
  });

  it("should categorize content tables correctly", () => {
    expect(guessCategory("posts")).toBe("Content");
    expect(guessCategory("articles")).toBe("Content");
    expect(guessCategory("comments")).toBe("Content");
    expect(guessCategory("blog_content")).toBe("Content");
  });

  it("should categorize financial tables correctly", () => {
    expect(guessCategory("payments")).toBe("Financial");
    expect(guessCategory("transactions")).toBe("Financial");
    expect(guessCategory("invoices")).toBe("Financial");
    expect(guessCategory("salary")).toBe("Financial");
  });

  it("should categorize notification tables correctly", () => {
    expect(guessCategory("notifications")).toBe("Notification");
    expect(guessCategory("alerts")).toBe("Notification");
    expect(guessCategory("messages")).toBe("Notification");
  });

  it("should categorize log tables correctly", () => {
    expect(guessCategory("logs")).toBe("Logs");
    expect(guessCategory("audit_trail")).toBe("Logs");
    expect(guessCategory("history")).toBe("Logs");
    expect(guessCategory("log_entries")).toBe("Logs");
  });

  it("should categorize system tables correctly", () => {
    expect(guessCategory("system_config")).toBe("System");
    expect(guessCategory("settings")).toBe("System");
    expect(guessCategory("configurations")).toBe("System");
  });

  it("should return General for unknown tables", () => {
    expect(guessCategory("random_table")).toBe("General");
    expect(guessCategory("xyz_data")).toBe("General");
    expect(guessCategory("uncategorized")).toBe("General");
  });

  it("should be case-insensitive", () => {
    expect(guessCategory("USERS")).toBe("Auth");
    expect(guessCategory("Users")).toBe("Auth");
    expect(guessCategory("UsErS")).toBe("Auth");
  });

  it("should handle tables with prefixes", () => {
    expect(guessCategory("tbl_users")).toBe("Auth");
    expect(guessCategory("app_products")).toBe("Product");
    expect(guessCategory("sys_orders")).toBe("Order");
  });

  it("should handle tables with suffixes", () => {
    expect(guessCategory("user_data")).toBe("Auth");
    expect(guessCategory("product_info")).toBe("Product");
    expect(guessCategory("order_history")).toBe("Order");
  });

  it("should prioritize first matching category", () => {
    // If a table name matches multiple categories, it should return the first match
    expect(guessCategory("product_category")).toBe("Product");
  });
});

describe("Category Filtering - Color Palette", () => {
  it("should have exactly 15 colors in the palette", () => {
    expect(COLOR_PALETTE).toHaveLength(15);
  });

  it("should have all valid hex colors", () => {
    COLOR_PALETTE.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it("should have unique colors", () => {
    const uniqueColors = new Set(COLOR_PALETTE);
    expect(uniqueColors.size).toBe(COLOR_PALETTE.length);
  });

  it("should start with blue as the default color", () => {
    expect(COLOR_PALETTE[0]).toBe("#3b82f6");
  });
});
