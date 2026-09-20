import type { DatabaseSchema, Table } from "@/shared/types/schema";
import { calculateCenterOfMass, centerSchemaByMass } from "./layout-math";
import { computeForceDirectedLayout } from "./force-layout-core";

export { calculateCenterOfMass, centerSchemaByMass };

export function applyForceDirectedLayout(
  schema: DatabaseSchema,
  viewMode: "2D" | "3D" = "3D"
): DatabaseSchema {
  return computeForceDirectedLayout(schema, viewMode);
}

export function applyHierarchicalLayout(
  schema: DatabaseSchema,
  viewMode: "2D" | "3D" = "3D"
): DatabaseSchema {
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  // Include all tables and views in root calculation (views now have relationships)
  const rootTables = schema.tables.filter((table) => {
    const hasIncomingFK = schema.tables.some((t) =>
      t.columns.some(
        (col) => col.isForeignKey && col.references?.table === table.name
      )
    );
    const hasOutgoingFK = table.columns.some((col) => col.isForeignKey);

    return !hasOutgoingFK || !hasIncomingFK;
  });

  function assignLevel(tableName: string, level: number) {
    if (visited.has(tableName)) return;
    visited.add(tableName);

    const currentLevel = levels.get(tableName) || 0;
    levels.set(tableName, Math.max(currentLevel, level));

    const table = schema.tables.find((t) => t.name === tableName);
    if (!table) return;

    table.columns.forEach((col) => {
      if (col.isForeignKey && col.references) {
        assignLevel(col.references.table, level - 1);
      }
    });

    schema.tables.forEach((t) => {
      t.columns.forEach((col) => {
        if (col.isForeignKey && col.references?.table === tableName) {
          assignLevel(t.name, level + 1);
        }
      });
    });
  }

  rootTables.forEach((table) => assignLevel(table.name, 0));

  schema.tables.forEach((table) => {
    if (!visited.has(table.name)) {
      assignLevel(table.name, 0);
    }
  });

  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, tableName) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(tableName);
  });

  // Position all tables and views together based on their assigned levels
  const updatedTables: Table[] = schema.tables.map((table) => {
    const level = levels.get(table.name) || 0;
    const tablesInLevel = levelGroups.get(level) || [];
    const indexInLevel = tablesInLevel.indexOf(table.name);
    const tablesInLevelCount = tablesInLevel.length;

    if (viewMode === "3D") {
      // In 3D mode, distribute tables within each level using a 2D grid pattern
      // This better utilizes 3D space by spreading tables across Y and Z dimensions

      // Calculate grid dimensions for this level (aim for roughly square grid)
      const gridCols = Math.ceil(Math.sqrt(tablesInLevelCount));
      const gridRows = Math.ceil(tablesInLevelCount / gridCols);

      // Calculate position within the grid
      const row = Math.floor(indexInLevel / gridCols);
      const col = indexInLevel % gridCols;

      // Spacing for the grid
      const gridSpacing = 6; // Spacing between grid cells

      // X position: represents hierarchy depth (levels progress along X)
      const x = level * 12;

      // Y position: vertical position in grid (rows) + level offset for vertical separation
      // Use Y for level separation to avoid diagonal clustering
      const levelYOffset = level * 10; // Offset each level vertically
      const y = levelYOffset + (row - (gridRows - 1) / 2) * gridSpacing;

      // Z position: depth position in grid (columns) - no level offset to avoid diagonal
      const z = (col - (gridCols - 1) / 2) * gridSpacing;

      return {
        ...table,
        position: [x, y, z] as [number, number, number],
      };
    } else {
      // 2D mode: X for level, Z for within-level, Y=0
      const x = level * 12;
      // 2D mode: constrain to y=0, z varies only within level
      const z = (indexInLevel - (tablesInLevelCount - 1) / 2) * 5;
      return {
        ...table,
        position: [x, 0, z] as [number, number, number],
      };
    }
  });

  // Center the schema by its center of mass
  return centerSchemaByMass({
    ...schema,
    tables: updatedTables,
  });
}

export function applyCircularLayout(
  schema: DatabaseSchema,
  viewMode: "2D" | "3D" = "3D"
): DatabaseSchema {
  const totalItems = schema.tables.length;
  const radius = Math.max(6, totalItems * 0.8);

  const updatedTables: Table[] = schema.tables.map((table, index) => {
    if (viewMode === "3D") {
      // Use golden angle spiral for uniform spherical distribution
      // This provides better spacing than the previous vertical spiral approach
      if (totalItems === 1) {
        // Single table: place at origin
        return {
          ...table,
          position: [0, 0, 0] as [number, number, number],
        };
      }

      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians
      const theta = goldenAngle * index; // Azimuthal angle
      const y = 1 - (index / (totalItems - 1)) * 2; // Distribute from -1 to 1
      const radiusAtY = Math.sqrt(1 - y * y); // Radius at this y level (for unit sphere)

      const x = Math.cos(theta) * radiusAtY * radius;
      const z = Math.sin(theta) * radiusAtY * radius;
      const yPos = y * radius;

      return {
        ...table,
        position: [x, yPos, z] as [number, number, number],
      };
    } else {
      // 2D: distribute evenly around a circle on the xz plane
      if (totalItems === 1) {
        return {
          ...table,
          position: [0, 0, 0] as [number, number, number],
        };
      }
      const angle = (index / totalItems) * Math.PI * 2;
      return {
        ...table,
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [
          number,
          number,
          number,
        ],
      };
    }
  });

  // Center the schema by its center of mass
  return centerSchemaByMass({
    ...schema,
    tables: updatedTables,
  });
}
