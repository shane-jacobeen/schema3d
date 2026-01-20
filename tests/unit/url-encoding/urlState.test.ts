/**
 * Unit tests for URL state management utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getSchemaFromHash,
  removeSchemaFromUrl,
  hasSchemaInUrl,
  createShareableUrl,
} from "@/shared/utils/url-state";
import { encodeSchemaToUrl } from "@/shared/utils/url-encoding";

describe("URL State Management", () => {
  // Save and restore original location
  const originalLocation = window.location;
  const originalHistory = window.history;

  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    (window as any).location = {
      hash: "",
      href: "https://schema3d.com/",
      origin: "https://schema3d.com",
      pathname: "/",
    };

    // Mock history API
    (window as any).history = {
      replaceState: vi.fn(),
    };
  });

  afterEach(() => {
    (window as any).location = originalLocation;
    (window as any).history = originalHistory;
    vi.restoreAllMocks();
  });

  describe("getSchemaFromHash", () => {
    it("should return null when no hash present", () => {
      window.location.hash = "";
      const result = getSchemaFromHash();

      expect(result).toBeNull();
    });

    it("should return null when hash has no colon", () => {
      window.location.hash = "#invalid";
      const result = getSchemaFromHash();

      expect(result).toBeNull();
    });

    it("should return null for unknown prefix", () => {
      window.location.hash = "#unknown:eNpVjc1ugzAQhF";
      const result = getSchemaFromHash();

      expect(result).toBeNull();
    });

    it("should decode schema with pako prefix", () => {
      const original = "erDiagram\n  CUSTOMER ||--o{ ORDER : places";
      const encoded = encodeSchemaToUrl(original);
      window.location.hash = `#pako:${encoded}`;

      const result = getSchemaFromHash();

      expect(result).not.toBeNull();
      expect(result?.schemaText).toBe(original);
      expect(result?.format).toBe("mermaid");
      expect(result?.prefix).toBe("pako");
    });

    it("should decode schema with sql prefix", () => {
      const original = "CREATE TABLE users (id INT PRIMARY KEY);";
      const encoded = encodeSchemaToUrl(original);
      window.location.hash = `#sql:${encoded}`;

      const result = getSchemaFromHash();

      expect(result).not.toBeNull();
      expect(result?.schemaText).toBe(original);
      expect(result?.format).toBe("sql");
      expect(result?.prefix).toBe("sql");
    });

    it("should decode schema with mermaid prefix", () => {
      const original = "erDiagram\n  USER ||--o{ POST : creates";
      const encoded = encodeSchemaToUrl(original);
      window.location.hash = `#mermaid:${encoded}`;

      const result = getSchemaFromHash();

      expect(result).not.toBeNull();
      expect(result?.schemaText).toBe(original);
      expect(result?.format).toBe("mermaid");
      expect(result?.prefix).toBe("mermaid");
    });

    it("should decode schema with schema prefix (auto-detect)", () => {
      const original = "CREATE TABLE test (id INT);";
      const encoded = encodeSchemaToUrl(original);
      window.location.hash = `#schema:${encoded}`;

      const result = getSchemaFromHash();

      expect(result).not.toBeNull();
      expect(result?.schemaText).toBe(original);
      expect(result?.format).toBe("auto");
      expect(result?.prefix).toBe("schema");
    });

    it("should handle uppercase prefix", () => {
      const original = "CREATE TABLE test (id INT);";
      const encoded = encodeSchemaToUrl(original);
      window.location.hash = `#SQL:${encoded}`;

      const result = getSchemaFromHash();

      expect(result).not.toBeNull();
      expect(result?.format).toBe("sql");
    });

    it("should return null for invalid encoded data", () => {
      window.location.hash = "#sql:invalid-data!!!";
      const result = getSchemaFromHash();

      expect(result).toBeNull();
    });
  });

  describe("removeSchemaFromUrl", () => {
    it("should remove hash from URL", () => {
      window.location.hash = "#pako:eNpVjc1ugzAQhF";
      removeSchemaFromUrl();

      expect(window.history.replaceState).toHaveBeenCalled();
      const call = (window.history.replaceState as any).mock.calls[0];
      expect(call[2]).toBe("https://schema3d.com/");
    });

    it("should handle URL with no hash gracefully", () => {
      window.location.hash = "";
      removeSchemaFromUrl();

      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  describe("hasSchemaInUrl", () => {
    it("should return false when no hash", () => {
      window.location.hash = "";
      expect(hasSchemaInUrl()).toBe(false);
    });

    it("should return false when hash has no colon", () => {
      window.location.hash = "#test";
      expect(hasSchemaInUrl()).toBe(false);
    });

    it("should return false for invalid prefix", () => {
      window.location.hash = "#invalid:data";
      expect(hasSchemaInUrl()).toBe(false);
    });

    it("should return true for pako prefix", () => {
      window.location.hash = "#pako:eNpVjc1ugzAQhF";
      expect(hasSchemaInUrl()).toBe(true);
    });

    it("should return true for sql prefix", () => {
      window.location.hash = "#sql:eNpVjc1ugzAQhF";
      expect(hasSchemaInUrl()).toBe(true);
    });

    it("should return true for mermaid prefix", () => {
      window.location.hash = "#mermaid:eNpVjc1ugzAQhF";
      expect(hasSchemaInUrl()).toBe(true);
    });

    it("should return true for schema prefix", () => {
      window.location.hash = "#schema:eNpVjc1ugzAQhF";
      expect(hasSchemaInUrl()).toBe(true);
    });
  });

  describe("createShareableUrl", () => {
    it("should create SQL shareable URL", () => {
      const encoded = "eNpVjc1ugzAQhF";
      const url = createShareableUrl(encoded, "sql");

      expect(url).toBe("https://schema3d.com/#sql:eNpVjc1ugzAQhF");
    });

    it("should create Mermaid shareable URL", () => {
      const encoded = "eNpVjc1ugzAQhF";
      const url = createShareableUrl(encoded, "mermaid");

      expect(url).toBe("https://schema3d.com/#mermaid:eNpVjc1ugzAQhF");
    });

    it("should use current origin", () => {
      (window as any).location.origin = "https://localhost:3000";
      (window as any).location.pathname = "/";

      const encoded = "abc123";
      const url = createShareableUrl(encoded, "sql");

      expect(url).toContain("https://localhost:3000");
    });

    it("should preserve pathname", () => {
      (window as any).location.pathname = "/test/path";

      const encoded = "abc123";
      const url = createShareableUrl(encoded, "sql");

      expect(url).toContain("/test/path");
    });
  });
});
