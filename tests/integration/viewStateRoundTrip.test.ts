import { describe, it, expect } from "vitest";
import { encodeViewState, decodeViewState } from "@/shared/utils/url-encoding";
import { createShareableUrl } from "@/shared/utils/url-state";
import type { SharedViewState } from "@/shared/types/schema";
import {
  encodeSchemaToUrl,
  decodeSchemaFromUrl,
} from "@/shared/utils/url-encoding";
import {
  RETAILER_SQL,
  BLOG_PLATFORM_SQL,
  UNIVERSITY_MERMAID,
} from "@/schemas/utils/load-schemas";
import { parseSqlSchema } from "@/schemas/parsers/sql-parser";

describe("View State Encoding/Decoding", () => {
  describe("View State Serialization", () => {
    it("should encode and decode view state with all fields", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true },
          { name: "Auth", color: "#10b981", selected: true },
          { name: "Payment", color: "#f59e0b", selected: true },
        ],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
    });

    it("should encode and decode view state with partial fields", () => {
      const viewState: SharedViewState = {
        categories: [{ name: "Core", color: "#3b82f6", selected: true }],
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
    });

    it("should handle empty categories array", () => {
      const viewState: SharedViewState = {
        categories: [],
        layoutAlgorithm: "hierarchical",
        viewMode: "2D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
    });

    it("should handle view state with special characters in categories", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "Core & Base", color: "#3b82f6", selected: true },
          { name: "Auth/Security", color: "#10b981", selected: true },
          { name: "Data-Layer", color: "#f59e0b", selected: true },
        ],
        layoutAlgorithm: "circular",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
    });

    it("should return null for invalid encoded view state", () => {
      const decoded = decodeViewState("invalid!!!");
      expect(decoded).toBeNull();
    });

    it("should return null for empty string", () => {
      const decoded = decodeViewState("");
      expect(decoded).toBeNull();
    });
  });

  describe("URL Integration with View State", () => {
    it("should create URL with schema and view state", () => {
      const schemaEncoded = encodeSchemaToUrl(RETAILER_SQL);
      const viewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true },
          { name: "Sales", color: "#10b981", selected: true },
        ],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };
      const viewStateEncoded = encodeViewState(viewState);

      const url = createShareableUrl(schemaEncoded, "sql", viewStateEncoded);

      expect(url).toContain("#sql:");
      expect(url).toContain(":");
      // Should have format: #sql:SCHEMA:VIEW
      const hashPart = url.split("#")[1];
      const parts = hashPart.split(":");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("sql");
    });

    it("should create URL without view state when not provided", () => {
      const schemaEncoded = encodeSchemaToUrl(RETAILER_SQL);
      const url = createShareableUrl(schemaEncoded, "sql");

      expect(url).toContain("#sql:");
      const hashPart = url.split("#")[1];
      const parts = hashPart.split(":");
      expect(parts).toHaveLength(2);
      expect(parts[0]).toBe("sql");
    });

    it("should handle mermaid format with view state", () => {
      const schemaEncoded = encodeSchemaToUrl(UNIVERSITY_MERMAID);
      const viewState: SharedViewState = {
        categories: [{ name: "Academic", color: "#3b82f6", selected: true }],
        layoutAlgorithm: "hierarchical",
        viewMode: "2D",
      };
      const viewStateEncoded = encodeViewState(viewState);

      const url = createShareableUrl(
        schemaEncoded,
        "mermaid",
        viewStateEncoded
      );

      expect(url).toContain("#mermaid:");
      const hashPart = url.split("#")[1];
      const parts = hashPart.split(":");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("mermaid");
    });
  });

  describe("Full Round-Trip with Sample Schemas", () => {
    // Helper to simulate URL hash navigation
    const simulateUrlHash = (url: string) => {
      const hashIndex = url.indexOf("#");
      if (hashIndex === -1) return null;
      const hash = url.slice(hashIndex + 1);

      // Parse the hash manually
      const colonIndex = hash.indexOf(":");
      if (colonIndex === -1) return null;

      const prefix = hash.slice(0, colonIndex);
      const afterPrefix = hash.slice(colonIndex + 1);
      const parts = afterPrefix.split(":");

      const schemaEncoded = parts[0];
      const viewStateEncoded = parts[1];

      const schemaText = decodeSchemaFromUrl(schemaEncoded);
      const viewState = viewStateEncoded
        ? decodeViewState(viewStateEncoded)
        : null;

      return {
        schemaText,
        format: prefix === "sql" ? "sql" : "mermaid",
        viewState,
      };
    };

    it("should round-trip Retailer SQL with view state", () => {
      const originalViewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true },
          { name: "Sales", color: "#10b981", selected: true },
          { name: "Inventory", color: "#f59e0b", selected: true },
        ],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      // Encode
      const schemaEncoded = encodeSchemaToUrl(RETAILER_SQL);
      const viewStateEncoded = encodeViewState(originalViewState);
      const url = createShareableUrl(schemaEncoded, "sql", viewStateEncoded);

      // Decode
      const result = simulateUrlHash(url);

      expect(result).not.toBeNull();
      expect(result!.schemaText).toBe(RETAILER_SQL);
      expect(result!.format).toBe("sql");
      expect(result!.viewState).toEqual(originalViewState);
    });

    it("should round-trip Blog Platform SQL with 2D hierarchical layout", () => {
      const originalViewState: SharedViewState = {
        categories: [
          { name: "Content", color: "#3b82f6", selected: true },
          { name: "Users", color: "#10b981", selected: true },
        ],
        layoutAlgorithm: "hierarchical",
        viewMode: "2D",
      };

      const schemaEncoded = encodeSchemaToUrl(BLOG_PLATFORM_SQL);
      const viewStateEncoded = encodeViewState(originalViewState);
      const url = createShareableUrl(schemaEncoded, "sql", viewStateEncoded);

      const result = simulateUrlHash(url);

      expect(result).not.toBeNull();
      expect(result!.schemaText).toBe(BLOG_PLATFORM_SQL);
      expect(result!.viewState).toEqual(originalViewState);
    });

    it("should round-trip University Mermaid with circular layout", () => {
      const originalViewState: SharedViewState = {
        categories: [
          { name: "Academic", color: "#3b82f6", selected: true },
          { name: "Administration", color: "#10b981", selected: true },
        ],
        layoutAlgorithm: "circular",
        viewMode: "3D",
      };

      const schemaEncoded = encodeSchemaToUrl(UNIVERSITY_MERMAID);
      const viewStateEncoded = encodeViewState(originalViewState);
      const url = createShareableUrl(
        schemaEncoded,
        "mermaid",
        viewStateEncoded
      );

      const result = simulateUrlHash(url);

      expect(result).not.toBeNull();
      expect(result!.schemaText).toBe(UNIVERSITY_MERMAID);
      expect(result!.format).toBe("mermaid");
      expect(result!.viewState).toEqual(originalViewState);
    });

    it("should round-trip schema without view state (backward compatibility)", () => {
      const schemaEncoded = encodeSchemaToUrl(RETAILER_SQL);
      const url = createShareableUrl(schemaEncoded, "sql");

      const result = simulateUrlHash(url);

      expect(result).not.toBeNull();
      expect(result!.schemaText).toBe(RETAILER_SQL);
      expect(result!.viewState).toBeNull();
    });

    it("should handle corrupted view state gracefully", () => {
      const schemaEncoded = encodeSchemaToUrl(RETAILER_SQL);
      const url = createShareableUrl(schemaEncoded, "sql", "corrupted!!!");

      const result = simulateUrlHash(url);

      expect(result).not.toBeNull();
      expect(result!.schemaText).toBe(RETAILER_SQL);
      expect(result!.viewState).toBeNull(); // Should fail gracefully
    });
  });

  describe("View State Edge Cases", () => {
    it("should handle view state with single category", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "OnlyCategory", color: "#3b82f6", selected: true },
        ],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
    });

    it("should handle view state with many categories", () => {
      const viewState: SharedViewState = {
        categories: Array.from({ length: 20 }, (_, i) => ({
          name: `Cat${i}`,
          color: "#3b82f6",
          selected: true,
        })),
        layoutAlgorithm: "hierarchical",
        viewMode: "2D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
    });

    it("should preserve category order", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "Zebra", color: "#3b82f6", selected: true },
          { name: "Alpha", color: "#10b981", selected: true },
          { name: "Beta", color: "#f59e0b", selected: true },
        ],
        layoutAlgorithm: "circular",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded?.categories?.map((c) => c.name)).toEqual([
        "Zebra",
        "Alpha",
        "Beta",
      ]);
    });

    it("should handle all layout algorithms", () => {
      const layouts: Array<"force" | "hierarchical" | "circular"> = [
        "force",
        "hierarchical",
        "circular",
      ];

      layouts.forEach((layout) => {
        const viewState: SharedViewState = {
          layoutAlgorithm: layout,
          viewMode: "3D",
        };

        const encoded = encodeViewState(viewState);
        const decoded = decodeViewState(encoded);

        expect(decoded?.layoutAlgorithm).toBe(layout);
      });
    });

    it("should handle both view modes", () => {
      const viewModes: Array<"2D" | "3D"> = ["2D", "3D"];

      viewModes.forEach((mode) => {
        const viewState: SharedViewState = {
          layoutAlgorithm: "force",
          viewMode: mode,
        };

        const encoded = encodeViewState(viewState);
        const decoded = decodeViewState(encoded);

        expect(decoded?.viewMode).toBe(mode);
      });
    });
  });

  describe("Category Customization Scenarios", () => {
    it("should preserve custom category colors", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#ff0000", selected: true }, // Custom red
          { name: "Auth", color: "#00ff00", selected: true }, // Custom green
          { name: "Payment", color: "#0000ff", selected: true }, // Custom blue
        ],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded?.categories).toHaveLength(3);
      expect(decoded?.categories?.[0].color).toBe("#ff0000");
      expect(decoded?.categories?.[1].color).toBe("#00ff00");
      expect(decoded?.categories?.[2].color).toBe("#0000ff");
    });

    it("should preserve table-to-category mappings when tables are moved", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "Auth", color: "#3b82f6", selected: true },
          { name: "Core", color: "#10b981", selected: true },
        ],
        tableCategoryMap: {
          users: "Auth",
          sessions: "Auth",
          products: "Core",
          orders: "Core",
        },
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded?.tableCategoryMap).toEqual({
        users: "Auth",
        sessions: "Auth",
        products: "Core",
        orders: "Core",
      });
    });

    it("should handle renamed categories with table mappings", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "Authentication", color: "#3b82f6", selected: true }, // Renamed from "Auth"
          { name: "UserManagement", color: "#10b981", selected: true }, // Renamed from "Users"
        ],
        tableCategoryMap: {
          users: "Authentication",
          sessions: "Authentication",
          profiles: "UserManagement",
          permissions: "UserManagement",
        },
        layoutAlgorithm: "hierarchical",
        viewMode: "2D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded?.categories?.map((c) => c.name)).toEqual([
        "Authentication",
        "UserManagement",
      ]);
      expect(decoded?.tableCategoryMap?.users).toBe("Authentication");
      expect(decoded?.tableCategoryMap?.profiles).toBe("UserManagement");
    });

    it("should preserve new custom categories created by user", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true },
          { name: "CustomCategory1", color: "#ff00ff", selected: true }, // User created
          { name: "CustomCategory2", color: "#00ffff", selected: true }, // User created
        ],
        tableCategoryMap: {
          table1: "Core",
          table2: "CustomCategory1",
          table3: "CustomCategory1",
          table4: "CustomCategory2",
        },
        layoutAlgorithm: "circular",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded?.categories).toHaveLength(3);
      expect(
        decoded?.categories?.find((c) => c.name === "CustomCategory1")
      ).toBeDefined();
      expect(
        decoded?.categories?.find((c) => c.name === "CustomCategory2")
      ).toBeDefined();
      expect(decoded?.tableCategoryMap?.table2).toBe("CustomCategory1");
      expect(decoded?.tableCategoryMap?.table4).toBe("CustomCategory2");
    });

    it("should handle category visibility (selected/hidden)", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true }, // Visible
          { name: "Auth", color: "#10b981" }, // Hidden (selected undefined)
          { name: "Payment", color: "#f59e0b", selected: true }, // Visible
        ],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded?.categories?.[0].selected).toBe(true);
      expect(decoded?.categories?.[1].selected).toBeUndefined();
      expect(decoded?.categories?.[2].selected).toBe(true);
    });

    it("should handle complex category reorganization scenario", () => {
      // Simulates user:
      // 1. Renamed "User" to "Authentication"
      // 2. Created new category "Security"
      // 3. Moved some tables to Security
      // 4. Changed colors
      // 5. Hidden some categories
      const viewState: SharedViewState = {
        categories: [
          { name: "Authentication", color: "#ff0000", selected: true }, // Renamed + custom color
          { name: "Security", color: "#00ff00", selected: true }, // New category
          { name: "General", color: "#3b82f6" }, // Hidden
        ],
        tableCategoryMap: {
          users: "Authentication",
          sessions: "Authentication",
          passwords: "Security",
          tokens: "Security",
          logs: "General",
        },
        layoutAlgorithm: "hierarchical",
        viewMode: "2D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      // Verify categories preserved
      expect(decoded?.categories).toHaveLength(3);
      expect(
        decoded?.categories?.find((c) => c.name === "Authentication")?.color
      ).toBe("#ff0000");
      expect(
        decoded?.categories?.find((c) => c.name === "Security")?.color
      ).toBe("#00ff00");

      // Verify visibility
      expect(
        decoded?.categories?.find((c) => c.name === "Authentication")?.selected
      ).toBe(true);
      expect(
        decoded?.categories?.find((c) => c.name === "Security")?.selected
      ).toBe(true);
      expect(
        decoded?.categories?.find((c) => c.name === "General")?.selected
      ).toBeUndefined();

      // Verify table mappings
      expect(decoded?.tableCategoryMap?.users).toBe("Authentication");
      expect(decoded?.tableCategoryMap?.passwords).toBe("Security");
      expect(decoded?.tableCategoryMap?.logs).toBe("General");
    });

    it("should preserve table mappings after category deletion (tables moved to General)", () => {
      // User deleted "OldCategory" and all its tables went to "General"
      const viewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true },
          { name: "General", color: "#10b981", selected: true },
        ],
        tableCategoryMap: {
          products: "Core",
          old_table1: "General", // Was in deleted category
          old_table2: "General", // Was in deleted category
        },
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded?.tableCategoryMap?.old_table1).toBe("General");
      expect(decoded?.tableCategoryMap?.old_table2).toBe("General");
    });
  });

  describe("URL Length Validation", () => {
    it("should generate reasonable URL lengths with view state", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true },
          { name: "Auth", color: "#10b981", selected: true },
          { name: "Payment", color: "#f59e0b", selected: true },
          { name: "Analytics", color: "#8b5cf6", selected: true },
        ],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      const schemaEncoded = encodeSchemaToUrl(RETAILER_SQL);
      const viewStateEncoded = encodeViewState(viewState);
      const url = createShareableUrl(schemaEncoded, "sql", viewStateEncoded);

      // Should be under 3000 chars (safe for all browsers)
      expect(url.length).toBeLessThan(3000);
    });

    it("should not significantly increase URL size with view state", () => {
      const schemaEncoded = encodeSchemaToUrl(RETAILER_SQL);
      const urlWithoutView = createShareableUrl(schemaEncoded, "sql");

      const viewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true },
          { name: "Sales", color: "#10b981", selected: true },
        ],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };
      const viewStateEncoded = encodeViewState(viewState);
      const urlWithView = createShareableUrl(
        schemaEncoded,
        "sql",
        viewStateEncoded
      );

      // View state should add < 300 chars (now includes colors and names)
      const sizeDiff = urlWithView.length - urlWithoutView.length;
      expect(sizeDiff).toBeLessThan(300);
    });
  });

  describe("Category Visibility and Views", () => {
    it("should preserve unchecked (hidden) categories in shared URLs", () => {
      // Create view state with some categories unchecked
      const viewState: SharedViewState = {
        categories: [
          { name: "Inventory", color: "#3b82f6", selected: true }, // visible
          { name: "Sales", color: "#10b981", selected: false }, // hidden
          { name: "Analytics", color: "#f59e0b", selected: true }, // visible
          { name: "Customers", color: "#8b5cf6", selected: false }, // hidden
        ],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
      expect(decoded?.categories).toHaveLength(4);

      // Verify specific visibility states
      const inventoryCategory = decoded?.categories?.find(
        (c) => c.name === "Inventory"
      );
      const salesCategory = decoded?.categories?.find(
        (c) => c.name === "Sales"
      );
      const analyticsCategory = decoded?.categories?.find(
        (c) => c.name === "Analytics"
      );
      const customersCategory = decoded?.categories?.find(
        (c) => c.name === "Customers"
      );

      expect(inventoryCategory?.selected).toBe(true);
      expect(salesCategory?.selected).toBe(false);
      expect(analyticsCategory?.selected).toBe(true);
      expect(customersCategory?.selected).toBe(false);
    });

    it("should handle schemas with views (CREATE VIEW statements)", () => {
      // Parse blog platform schema which contains views
      const parsedSchema = parseSqlSchema(BLOG_PLATFORM_SQL);

      expect(parsedSchema).toBeTruthy();
      expect(parsedSchema!.tables).toBeDefined();

      // Blog platform has views: published_posts_view, user_posts_summary_view, recent_comments_view
      const views = parsedSchema!.tables.filter((t) => t.isView);
      expect(views.length).toBeGreaterThan(0);
      expect(views.length).toBe(3); // Exactly 3 views in blog platform

      // Verify views have proper structure
      views.forEach((view) => {
        expect(view.isView).toBe(true);
        expect(view.name).toBeDefined();
        expect(view.columns).toBeDefined();
        expect(view.category).toBeDefined();
        expect(view.color).toBeDefined();
      });
    });

    it("should preserve view visibility when categories are toggled", () => {
      // Simulate loading blog platform with view state that hides view categories
      const viewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true },
          { name: "Content", color: "#10b981", selected: true },
          { name: "Engagement", color: "#f59e0b", selected: false }, // Hidden, might contain views
          { name: "Views", color: "#8b5cf6", selected: false }, // Hidden, contains views
        ],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      const schemaEncoded = encodeSchemaToUrl(BLOG_PLATFORM_SQL);
      const viewStateEncoded = encodeViewState(viewState);
      const url = createShareableUrl(schemaEncoded, "sql", viewStateEncoded);

      // Decode the schema from URL and verify it contains views
      const hashFragment = url.split("#")[1];
      const parts = hashFragment.split(":");
      const encodedSchema = parts[1];
      const schemaText = decodeSchemaFromUrl(encodedSchema);
      expect(schemaText).toBeTruthy();

      // Parse the schema and verify views are present
      const parsedSchema = parseSqlSchema(schemaText!);
      expect(parsedSchema).toBeTruthy();

      const views = parsedSchema!.tables.filter((t) => t.isView);
      expect(views.length).toBeGreaterThan(0); // Views should be preserved in shared URL

      const decodedViewState = decodeViewState(viewStateEncoded);
      expect(decodedViewState).toEqual(viewState);

      // Verify hidden categories stay hidden
      const hiddenCategories = decodedViewState?.categories?.filter(
        (c) => c.selected === false
      );
      expect(hiddenCategories).toHaveLength(2);
      expect(hiddenCategories?.map((c) => c.name)).toContain("Engagement");
      expect(hiddenCategories?.map((c) => c.name)).toContain("Views");
    });
  });
});
