import { describe, it, expect } from "vitest";
import { encodeViewState, decodeViewState } from "@/shared/utils/url-encoding";
import {
  createShareableUrl,
  getSchemaFromHash,
} from "@/shared/utils/url-state";
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

describe("View State Encoding/Decoding", () => {
  describe("View State Serialization", () => {
    it("should encode and decode view state with all fields", () => {
      const viewState: SharedViewState = {
        selectedCategories: ["Core", "Auth", "Payment"],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
    });

    it("should encode and decode view state with partial fields", () => {
      const viewState: SharedViewState = {
        selectedCategories: ["Core"],
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
    });

    it("should handle empty categories array", () => {
      const viewState: SharedViewState = {
        selectedCategories: [],
        layoutAlgorithm: "hierarchical",
        viewMode: "2D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
    });

    it("should handle view state with special characters in categories", () => {
      const viewState: SharedViewState = {
        selectedCategories: ["Core & Base", "Auth/Security", "Data-Layer"],
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
        selectedCategories: ["Core", "Sales"],
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
        selectedCategories: ["Academic"],
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
        selectedCategories: ["Core", "Sales", "Inventory"],
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
        selectedCategories: ["Content", "Users"],
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
        selectedCategories: ["Academic", "Administration"],
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
        selectedCategories: ["OnlyCategory"],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
    });

    it("should handle view state with many categories", () => {
      const viewState: SharedViewState = {
        selectedCategories: Array.from({ length: 20 }, (_, i) => `Cat${i}`),
        layoutAlgorithm: "hierarchical",
        viewMode: "2D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded).toEqual(viewState);
    });

    it("should preserve category order", () => {
      const viewState: SharedViewState = {
        selectedCategories: ["Zebra", "Alpha", "Beta"],
        layoutAlgorithm: "circular",
        viewMode: "3D",
      };

      const encoded = encodeViewState(viewState);
      const decoded = decodeViewState(encoded);

      expect(decoded?.selectedCategories).toEqual(["Zebra", "Alpha", "Beta"]);
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

  describe("URL Length Validation", () => {
    it("should generate reasonable URL lengths with view state", () => {
      const viewState: SharedViewState = {
        selectedCategories: ["Core", "Auth", "Payment", "Analytics"],
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
        selectedCategories: ["Core", "Sales"],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };
      const viewStateEncoded = encodeViewState(viewState);
      const urlWithView = createShareableUrl(
        schemaEncoded,
        "sql",
        viewStateEncoded
      );

      // View state should add < 200 chars
      const sizeDiff = urlWithView.length - urlWithoutView.length;
      expect(sizeDiff).toBeLessThan(200);
    });
  });
});
