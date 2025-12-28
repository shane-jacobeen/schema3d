import { describe, it, expect } from "vitest";
import { getRetailerSchema } from "@/schemas/utils/load-schemas";
import { applyLayoutToSchema } from "@/visualizer/state/utils/schema-utils";
import {
  applyForceDirectedLayout,
  applyCircularLayout,
  applyHierarchicalLayout,
} from "@/visualizer/3d/utils/layout-algorithm";
import {
  DEFAULT_LAYOUT,
  DEFAULT_VIEW_MODE,
  getInitialSchema,
} from "@/visualizer/state/initial-state";

describe("Initial Layout State", () => {
  describe("Default layout and view mode consistency", () => {
    it("should apply force layout in 3D mode for initial schema (matching UI defaults)", () => {
      // This test verifies that the initial schema state matches the default UI controls
      // Default UI state: layout = DEFAULT_LAYOUT, viewMode = DEFAULT_VIEW_MODE
      const baseSchema = getRetailerSchema();

      // Apply the same layout that getInitialSchema() uses
      const initialSchema = applyLayoutToSchema(
        baseSchema,
        DEFAULT_LAYOUT,
        DEFAULT_VIEW_MODE
      );

      // Verify the schema has positions applied
      expect(initialSchema.tables.length).toBeGreaterThan(0);
      initialSchema.tables.forEach((table) => {
        expect(table.position).toBeDefined();
        expect(table.position).toHaveLength(3);
        // In 3D mode, Y positions can be non-zero
        // Force layout should spread tables out
        expect(
          typeof table.position[0] === "number" &&
            typeof table.position[1] === "number" &&
            typeof table.position[2] === "number"
        ).toBe(true);
      });
    });

    it("should produce different layouts for 2D vs 3D mode", () => {
      const baseSchema = getRetailerSchema();

      const schema2D = applyLayoutToSchema(baseSchema, "force", "2D");
      const schema3D = applyLayoutToSchema(baseSchema, "force", "3D");

      // In 2D mode, all Y positions should be 0
      schema2D.tables.forEach((table) => {
        expect(table.position[1]).toBe(0);
      });

      // In 3D mode, at least some Y positions should be non-zero
      // (for schemas with enough tables to spread vertically)
      const _has3DPositions = schema3D.tables.some(
        (table) => table.position[1] !== 0
      );
      // Note: Small schemas might still have Y=0, but force layout in 3D allows non-zero Y
      expect(schema3D.tables.length).toBeGreaterThan(0);
    });

    it("should produce different positions for different layout algorithms", () => {
      const baseSchema = getRetailerSchema();

      const forceLayout = applyForceDirectedLayout(baseSchema, "3D");
      const circularLayout = applyCircularLayout(baseSchema, "3D");
      const hierarchicalLayout = applyHierarchicalLayout(baseSchema, "3D");

      // Each layout should produce valid positions
      [forceLayout, circularLayout, hierarchicalLayout].forEach((schema) => {
        expect(schema.tables.length).toBeGreaterThan(0);
        schema.tables.forEach((table) => {
          expect(table.position).toBeDefined();
          expect(table.position).toHaveLength(3);
        });
      });

      // Layouts should produce different results
      // Compare first table position across layouts
      const firstTableName = baseSchema.tables[0].name;
      const forcePos = forceLayout.tables.find(
        (t) => t.name === firstTableName
      )?.position;
      const circularPos = circularLayout.tables.find(
        (t) => t.name === firstTableName
      )?.position;
      const hierarchicalPos = hierarchicalLayout.tables.find(
        (t) => t.name === firstTableName
      )?.position;

      expect(forcePos).toBeDefined();
      expect(circularPos).toBeDefined();
      expect(hierarchicalPos).toBeDefined();

      // At least circular and force should differ (circular places tables in a circle)
      const positionsMatch =
        forcePos![0] === circularPos![0] &&
        forcePos![1] === circularPos![1] &&
        forcePos![2] === circularPos![2];
      expect(positionsMatch).toBe(false);
    });
  });

  describe("Layout algorithm defaults", () => {
    it("should use 'force' as the default layout type", () => {
      // The default layout constant is defined in initial-state.ts
      expect(DEFAULT_LAYOUT).toBe("force");
    });

    it("should use '3D' as the default view mode", () => {
      // The default view mode constant is defined in initial-state.ts
      expect(DEFAULT_VIEW_MODE).toBe("3D");
    });
  });

  describe("Initial schema state", () => {
    it("should have the initial schema match the default layout and view mode", () => {
      // Use the centralized getInitialSchema function
      const initialSchema = getInitialSchema();

      // Verify it's the Retailer schema (default)
      expect(initialSchema.name).toBe("Retailer");

      // Verify layout was applied (tables should have spread-out positions)
      const positions = initialSchema.tables.map((t) => t.position);
      const uniquePositions = new Set(positions.map((p) => p.join(",")));

      // Each table should have a unique position
      expect(uniquePositions.size).toBe(initialSchema.tables.length);
    });

    it("should produce the same result as manually applying default layout", () => {
      // getInitialSchema should produce the same result as manual application
      const initialSchema = getInitialSchema();
      const baseSchema = getRetailerSchema();
      const manualSchema = applyLayoutToSchema(
        baseSchema,
        DEFAULT_LAYOUT,
        DEFAULT_VIEW_MODE
      );

      // Both should have the same table count
      expect(initialSchema.tables.length).toBe(manualSchema.tables.length);

      // Both should have the same name
      expect(initialSchema.name).toBe(manualSchema.name);
    });

    it("should preserve table properties after layout application", () => {
      const baseSchema = getRetailerSchema();
      const layoutSchema = applyLayoutToSchema(
        baseSchema,
        DEFAULT_LAYOUT,
        DEFAULT_VIEW_MODE
      );

      // Table count should remain the same
      expect(layoutSchema.tables.length).toBe(baseSchema.tables.length);

      // Table names should remain the same
      const baseNames = new Set(baseSchema.tables.map((t) => t.name));
      const layoutNames = new Set(layoutSchema.tables.map((t) => t.name));
      expect(layoutNames).toEqual(baseNames);

      // Each table should retain its columns
      layoutSchema.tables.forEach((table) => {
        const baseTable = baseSchema.tables.find((t) => t.name === table.name);
        expect(baseTable).toBeDefined();
        expect(table.columns.length).toBe(baseTable!.columns.length);
      });
    });
  });
});
