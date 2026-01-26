import { describe, it, expect, beforeEach } from "vitest";
import {
  getSampleSchemas,
  getSchemaText,
  getSchemaFormat,
} from "@/schemas/utils/load-schemas";
import { encodeSchemaToUrl } from "@/shared/utils/url-encoding";
import {
  getSchemaFromHash,
  createShareableUrl,
} from "@/shared/utils/url-state";
import { parseSqlSchema } from "@/schemas/parsers/sql-parser";
import { parseMermaidSchema } from "@/schemas/parsers/mermaid-parser";
import { schemaToSql, schemaToMermaid } from "@/schemas/utils/schema-converter";

/**
 * Helper to mock window.location.hash in tests
 */
function mockWindowHash(hash: string) {
  delete (window as { location?: unknown }).location;
  (window as { location: { hash: string; origin: string } }).location = {
    hash,
    origin: "http://localhost:3000",
  };
}

/**
 * Integration tests for URL encoding/decoding round-trip
 * Tests the full flow: Schema → Text → URL → Hash → Parse → Schema
 */
describe("URL Schema Round-Trip Integration Tests", () => {
  beforeEach(() => {
    // Reset window.location to default
    mockWindowHash("");
  });

  describe("Sample Schemas Round-Trip", () => {
    const sampleSchemas = getSampleSchemas();

    sampleSchemas.forEach((schema) => {
      it(`should successfully round-trip ${schema.name} schema`, () => {
        // Get original schema text and format
        const originalText = getSchemaText(schema.name);
        const format = getSchemaFormat(schema.name);

        expect(originalText).toBeTruthy();
        expect(format).toBeTruthy();

        // Encode the schema text to URL
        const encoded = encodeSchemaToUrl(originalText!);
        expect(encoded).toBeTruthy();
        expect(typeof encoded).toBe("string");

        // Create a shareable URL with the encoded text
        const shareableUrl = createShareableUrl(encoded, format);
        expect(shareableUrl).toContain("#");
        expect(shareableUrl).toContain(":");

        // Extract the hash portion
        const hashPart = shareableUrl.split("#")[1];
        expect(hashPart).toBeTruthy();

        // Simulate setting the hash (like clicking a shared link)
        mockWindowHash(`#${hashPart}`);

        // Decode the schema from the hash
        const decodedResult = getSchemaFromHash();
        expect(decodedResult).not.toBeNull();
        expect(decodedResult?.schemaText).toBeTruthy();

        // Format should match (or be auto if using schema: prefix)
        const expectedFormats = [format, "auto"];
        expect(expectedFormats).toContain(decodedResult?.format);

        // Parse the decoded text back to a schema
        const parsedSchema =
          format === "sql"
            ? parseSqlSchema(decodedResult!.schemaText)
            : parseMermaidSchema(decodedResult!.schemaText);

        expect(parsedSchema).not.toBeNull();
        expect(parsedSchema?.tables.length).toBeGreaterThan(0);

        // Compare schema structures (not exact match due to layout/visual properties)
        expect(parsedSchema?.tables.length).toBe(schema.tables.length);
        // Note: parsers don't preserve schema names from raw text

        // Verify table names match
        const originalTableNames = schema.tables.map((t) => t.name).sort();
        const parsedTableNames = parsedSchema!.tables.map((t) => t.name).sort();
        expect(parsedTableNames).toEqual(originalTableNames);

        // Verify relationships are preserved
        const originalRelationshipCount = schema.tables.reduce(
          (count, table) =>
            count + table.columns.filter((col) => col.isForeignKey).length,
          0
        );
        const parsedRelationshipCount = parsedSchema!.tables.reduce(
          (count, table) =>
            count + table.columns.filter((col) => col.isForeignKey).length,
          0
        );
        expect(parsedRelationshipCount).toBe(originalRelationshipCount);
      });
    });
  });

  describe("Schema Converter Round-Trip", () => {
    const sampleSchemas = getSampleSchemas();

    it("should maintain schema integrity through SQL conversion round-trip", () => {
      // Test with SQL schemas
      const sqlSchemas = sampleSchemas.filter(
        (s) => getSchemaFormat(s.name) === "sql"
      );

      sqlSchemas.forEach((originalSchema) => {
        // Convert schema to SQL text
        const sqlText = schemaToSql(originalSchema);
        expect(sqlText).toBeTruthy();
        expect(sqlText.length).toBeGreaterThan(0);

        // Encode to URL
        const encoded = encodeSchemaToUrl(sqlText);

        // Create shareable URL
        const shareableUrl = createShareableUrl(encoded, "sql");
        const hashPart = shareableUrl.split("#")[1];

        // Simulate loading from URL
        mockWindowHash(`#${hashPart}`);
        const decodedResult = getSchemaFromHash();

        // Parse back to schema
        const parsedSchema = parseSqlSchema(decodedResult!.schemaText);

        // Verify structure
        expect(parsedSchema?.tables.length).toBe(originalSchema.tables.length);
        expect(parsedSchema?.tables.map((t) => t.name).sort()).toEqual(
          originalSchema.tables.map((t) => t.name).sort()
        );
      });
    });

    it("should maintain schema integrity through Mermaid conversion round-trip", () => {
      // Test with Mermaid schemas
      const mermaidSchemas = sampleSchemas.filter(
        (s) => getSchemaFormat(s.name) === "mermaid"
      );

      mermaidSchemas.forEach((originalSchema) => {
        // Convert schema to Mermaid text
        const mermaidText = schemaToMermaid(originalSchema);
        expect(mermaidText).toBeTruthy();
        expect(mermaidText.length).toBeGreaterThan(0);
        expect(mermaidText).toContain("erDiagram");

        // Encode to URL
        const encoded = encodeSchemaToUrl(mermaidText);

        // Create shareable URL
        const shareableUrl = createShareableUrl(encoded, "mermaid");
        const hashPart = shareableUrl.split("#")[1];

        // Simulate loading from URL
        mockWindowHash(`#${hashPart}`);
        const decodedResult = getSchemaFromHash();

        // Parse back to schema
        const parsedSchema = parseMermaidSchema(decodedResult!.schemaText);

        // Verify structure
        expect(parsedSchema?.tables.length).toBe(originalSchema.tables.length);
        expect(parsedSchema?.tables.map((t) => t.name).sort()).toEqual(
          originalSchema.tables.map((t) => t.name).sort()
        );
      });
    });
  });

  describe("Cross-Format Compatibility", () => {
    it("should handle pako: prefix (mermaid.live compatibility)", () => {
      const retailerText = getSchemaText("Retailer")!;
      const encoded = encodeSchemaToUrl(retailerText);

      // Test with pako: prefix
      mockWindowHash(`#pako:${encoded}`);
      const result = getSchemaFromHash();

      expect(result).not.toBeNull();
      expect(result?.schemaText).toBe(retailerText);
      expect(result?.format).toBe("mermaid"); // pako: uses mermaid format
    });

    it("should handle sql: prefix explicitly", () => {
      const retailerText = getSchemaText("Retailer")!;
      const encoded = encodeSchemaToUrl(retailerText);

      mockWindowHash(`#sql:${encoded}`);
      const result = getSchemaFromHash();

      expect(result).not.toBeNull();
      expect(result?.schemaText).toBe(retailerText);
      expect(result?.format).toBe("sql");
    });

    it("should handle mermaid: prefix explicitly", () => {
      const universityText = getSchemaText("University")!;
      const encoded = encodeSchemaToUrl(universityText);

      mockWindowHash(`#mermaid:${encoded}`);
      const result = getSchemaFromHash();

      expect(result).not.toBeNull();
      expect(result?.schemaText).toBe(universityText);
      expect(result?.format).toBe("mermaid");
    });

    it("should auto-detect format with schema: prefix", () => {
      const retailerText = getSchemaText("Retailer")!;
      const encoded = encodeSchemaToUrl(retailerText);

      mockWindowHash(`#schema:${encoded}`);
      const result = getSchemaFromHash();

      expect(result).not.toBeNull();
      expect(result?.schemaText).toBe(retailerText);
      expect(result?.format).toBe("auto");
    });
  });

  describe("Data Integrity", () => {
    const sampleSchemas = getSampleSchemas();

    it("should preserve column details through round-trip", () => {
      sampleSchemas.forEach((schema) => {
        const format = getSchemaFormat(schema.name);
        const text = getSchemaText(schema.name)!;
        const encoded = encodeSchemaToUrl(text);

        mockWindowHash(`#${format}:${encoded}`);
        const decodedResult = getSchemaFromHash();

        expect(decodedResult).not.toBeNull();

        const parsedSchema =
          format === "sql"
            ? parseSqlSchema(decodedResult!.schemaText)
            : parseMermaidSchema(decodedResult!.schemaText);

        expect(parsedSchema).not.toBeNull();

        // Check first table's columns in detail
        const originalTable = schema.tables[0];
        const parsedTable = parsedSchema!.tables.find(
          (t) => t.name === originalTable.name
        );

        expect(parsedTable).toBeDefined();
        expect(parsedTable!.columns.length).toBe(originalTable.columns.length);

        // Verify column properties
        originalTable.columns.forEach((originalCol) => {
          const parsedCol = parsedTable!.columns.find(
            (c) => c.name === originalCol.name
          );
          expect(parsedCol).toBeDefined();
          expect(parsedCol!.type).toBe(originalCol.type);
          expect(parsedCol!.isPrimaryKey).toBe(originalCol.isPrimaryKey);
          expect(parsedCol!.isForeignKey).toBe(originalCol.isForeignKey);

          if (originalCol.isForeignKey && originalCol.references) {
            expect(parsedCol!.references).toBeDefined();
            expect(parsedCol!.references!.table).toBe(
              originalCol.references.table
            );
            expect(parsedCol!.references!.column).toBe(
              originalCol.references.column
            );
          }
        });
      });
    });

    it("should handle large schemas efficiently", () => {
      // Test with the largest sample schema
      const schemas = getSampleSchemas();
      const largestSchema = schemas.reduce((prev, current) =>
        current.tables.length > prev.tables.length ? current : prev
      );

      const text = getSchemaText(largestSchema.name)!;
      const format = getSchemaFormat(largestSchema.name);

      // Encode
      const startEncode = Date.now();
      const encoded = encodeSchemaToUrl(text);
      const encodeTime = Date.now() - startEncode;

      // Should encode quickly (< 100ms)
      expect(encodeTime).toBeLessThan(100);

      // Decode
      mockWindowHash(`#${format}:${encoded}`);
      const startDecode = Date.now();
      const decodedResult = getSchemaFromHash();
      const decodeTime = Date.now() - startDecode;

      // Should decode quickly (< 100ms)
      expect(decodeTime).toBeLessThan(100);

      expect(decodedResult?.schemaText).toBe(text);
    });
  });

  describe("Error Handling", () => {
    it("should handle corrupted encoded data gracefully", () => {
      mockWindowHash("#sql:corrupted_data_123");
      const result = getSchemaFromHash();

      // Should return null or empty result for corrupted data
      if (result !== null) {
        expect(result.schemaText).toBe("");
      }
    });

    it("should handle empty hash", () => {
      mockWindowHash("");
      const result = getSchemaFromHash();
      expect(result).toBeNull();
    });

    it("should handle hash without prefix", () => {
      const retailerText = getSchemaText("Retailer")!;
      const encoded = encodeSchemaToUrl(retailerText);

      // Hash without format prefix
      mockWindowHash(`#${encoded}`);
      const result = getSchemaFromHash();

      // Should handle gracefully - return null since no prefix
      expect(result).toBeNull();
    });
  });

  describe("URL Length and Compression", () => {
    it("should compress schemas effectively", () => {
      const sampleSchemas = getSampleSchemas();

      sampleSchemas.forEach((schema) => {
        const text = getSchemaText(schema.name)!;
        const encoded = encodeSchemaToUrl(text);

        // Encoded length should be shorter than original (compression)
        expect(encoded.length).toBeLessThan(text.length);

        // URL should be reasonable length (< 8KB for browser compatibility)
        const format = getSchemaFormat(schema.name);
        const fullUrl = createShareableUrl(encoded, format);
        expect(fullUrl.length).toBeLessThan(8000);
      });
    });

    it("should create valid shareable URLs", () => {
      // Set up window.location.origin for URL creation
      mockWindowHash("");

      const retailerText = getSchemaText("Retailer")!;
      const encoded = encodeSchemaToUrl(retailerText);
      const url = createShareableUrl(encoded, "sql");

      // URL should contain the hash part
      expect(url).toContain("#sql:");

      // Extract just the hash part for validation
      const hashPart = url.split("#")[1];
      expect(hashPart).toContain("sql:");
      expect(hashPart).toContain(encoded);

      // Should create a valid URL when combined with a proper origin
      const fullUrl = `http://localhost:3000${url.startsWith("#") ? url : "#" + url}`;
      expect(() => new URL(fullUrl)).not.toThrow();
    });
  });
});
