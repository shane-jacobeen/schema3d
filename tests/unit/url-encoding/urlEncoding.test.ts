/**
 * Unit tests for URL encoding/decoding utilities
 */

import { describe, it, expect } from "vitest";
import {
  encodeSchemaToUrl,
  decodeSchemaFromUrl,
  estimateEncodedSize,
  isValidEncodedString,
} from "@/shared/utils/url-encoding";

describe("URL Encoding", () => {
  describe("encodeSchemaToUrl", () => {
    it("should encode a simple SQL schema", () => {
      const sql = "CREATE TABLE users (id INT PRIMARY KEY);";
      const encoded = encodeSchemaToUrl(sql);

      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
    });

    it("should encode a Mermaid ERD schema", () => {
      const mermaid = `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE-ITEM : contains`;

      const encoded = encodeSchemaToUrl(mermaid);

      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe("string");
    });

    it("should produce URL-safe output (no +, /, or =)", () => {
      const schema = "CREATE TABLE test (id INT);".repeat(100);
      const encoded = encodeSchemaToUrl(schema);

      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
      expect(encoded).not.toContain("=");
    });

    it("should handle large schemas", () => {
      const largeSql = `
        CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
        CREATE TABLE posts (id INT PRIMARY KEY, user_id INT);
        CREATE TABLE comments (id INT PRIMARY KEY, post_id INT);
      `.repeat(50);

      const encoded = encodeSchemaToUrl(largeSql);
      expect(encoded).toBeTruthy();
    });

    it("should handle special characters", () => {
      const schemaWithSpecialChars = `CREATE TABLE "user-data" (
        id INT PRIMARY KEY,
        email VARCHAR(255) CHECK (email LIKE '%@%.%')
      );`;

      const encoded = encodeSchemaToUrl(schemaWithSpecialChars);
      expect(encoded).toBeTruthy();
    });
  });

  describe("decodeSchemaFromUrl", () => {
    it("should decode an encoded schema back to original text", () => {
      const original = "CREATE TABLE users (id INT PRIMARY KEY);";
      const encoded = encodeSchemaToUrl(original);
      const decoded = decodeSchemaFromUrl(encoded);

      expect(decoded).toBe(original);
    });

    it("should handle Mermaid ERD round-trip", () => {
      const original = `erDiagram
  CUSTOMER ||--o{ ORDER : places`;

      const encoded = encodeSchemaToUrl(original);
      const decoded = decodeSchemaFromUrl(encoded);

      expect(decoded).toBe(original);
    });

    it("should return null for invalid encoded string", () => {
      const decoded = decodeSchemaFromUrl("not-valid-base64!");
      expect(decoded).toBeNull();
    });

    it("should return null for empty string", () => {
      const decoded = decodeSchemaFromUrl("");
      expect(decoded).toBeNull();
    });

    it("should handle large schemas round-trip", () => {
      const large = "CREATE TABLE test (id INT PRIMARY KEY);".repeat(100);
      const encoded = encodeSchemaToUrl(large);
      const decoded = decodeSchemaFromUrl(encoded);

      expect(decoded).toBe(large);
    });

    it("should preserve whitespace and newlines", () => {
      const withWhitespace = `CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);`;

      const encoded = encodeSchemaToUrl(withWhitespace);
      const decoded = decodeSchemaFromUrl(encoded);

      expect(decoded).toBe(withWhitespace);
    });
  });

  describe("estimateEncodedSize", () => {
    it("should return size in bytes", () => {
      const schema = "CREATE TABLE users (id INT);";
      const size = estimateEncodedSize(schema);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe("number");
    });

    it("should show compression benefit for repetitive content", () => {
      const small = "CREATE TABLE test (id INT);";
      const large = small.repeat(100);

      const smallSize = estimateEncodedSize(small);
      const largeSize = estimateEncodedSize(large);

      // Compressed size should be much less than 100x
      expect(largeSize).toBeLessThan(smallSize * 50);
    });

    it("should handle invalid input gracefully", () => {
      // This shouldn't happen in practice, but test the error path
      const size = estimateEncodedSize(null as any);
      expect(size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("isValidEncodedString", () => {
    it("should return true for valid base64url strings", () => {
      expect(isValidEncodedString("eNpVjc1ugzAQhF")).toBe(true);
      expect(isValidEncodedString("ABC123-_")).toBe(true);
    });

    it("should return false for strings with invalid characters", () => {
      expect(isValidEncodedString("abc+def")).toBe(false); // + not allowed
      expect(isValidEncodedString("abc/def")).toBe(false); // / not allowed
      expect(isValidEncodedString("abc=def")).toBe(false); // = not allowed
      expect(isValidEncodedString("abc def")).toBe(false); // space not allowed
    });

    it("should return false for empty strings", () => {
      expect(isValidEncodedString("")).toBe(false);
    });

    it("should accept actual encoded schemas", () => {
      const schema = "CREATE TABLE test (id INT);";
      const encoded = encodeSchemaToUrl(schema);

      expect(isValidEncodedString(encoded)).toBe(true);
    });
  });
});
