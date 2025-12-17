import type { DatabaseSchema, Table } from "@/shared/types/schema";

// Helper function to calculate center of mass of tables
export function calculateCenterOfMass(
  tables: Table[]
): [number, number, number] {
  if (tables.length === 0) return [0, 0, 0];

  const sum = tables.reduce(
    (acc, item) => {
      const [x, y, z] = item.position;
      return [acc[0] + x, acc[1] + y, acc[2] + z];
    },
    [0, 0, 0]
  );

  return [
    sum[0] / tables.length,
    sum[1] / tables.length,
    sum[2] / tables.length,
  ];
}

// Helper function to center schema by center of mass
export function centerSchemaByMass(schema: DatabaseSchema): DatabaseSchema {
  const centerOfMass = calculateCenterOfMass(schema.tables);

  return {
    ...schema,
    tables: schema.tables.map((table) => ({
      ...table,
      position: [
        table.position[0] - centerOfMass[0],
        table.position[1] - centerOfMass[1],
        table.position[2] - centerOfMass[2],
      ] as [number, number, number],
    })),
  };
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  mass: number;
}

interface LayoutEdge {
  source: string;
  target: string;
}

export function applyForceDirectedLayout(
  schema: DatabaseSchema,
  viewMode: "2D" | "3D" = "3D"
): DatabaseSchema {
  const nodes = new Map<string, LayoutNode>();
  const edges: LayoutEdge[] = [];
  const totalItems = schema.tables.length;

  // Better initial distribution for 3D
  const initialRadius = Math.max(8, Math.sqrt(totalItems) * 2);

  schema.tables.forEach((table, index) => {
    let x, y, z;
    if (viewMode === "3D") {
      // Use golden angle spiral for better initial 3D distribution
      if (totalItems === 1) {
        x = 0;
        y = 0;
        z = 0;
      } else {
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians
        const theta = goldenAngle * index; // Azimuthal angle
        const yVal = 1 - (index / (totalItems - 1)) * 2; // Distribute from -1 to 1
        const radiusAtY = Math.sqrt(1 - yVal * yVal); // Radius at this y level (for unit sphere)

        x = Math.cos(theta) * radiusAtY * initialRadius;
        y = yVal * initialRadius;
        z = Math.sin(theta) * radiusAtY * initialRadius;
      }
    } else {
      // 2D: distribute evenly around a circle on the xz plane
      const angle = (index / totalItems) * Math.PI * 2;
      x = Math.cos(angle) * initialRadius;
      y = 0;
      z = Math.sin(angle) * initialRadius;
    }

    // Calculate mass based on column count (same for tables and views)
    const mass = 1 + table.columns.length * 0.1;

    nodes.set(table.name, {
      id: table.name,
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      mass,
    });

    // Add edges for all tables and views (views now have relationships via virtual columns)
    table.columns.forEach((column) => {
      if (column.isForeignKey && column.references) {
        edges.push({
          source: table.name,
          target: column.references.table,
        });
      }
    });
  });

  // Adjust parameters for better 3D behavior
  const iterations = 150; // More iterations for better convergence
  const springLength = viewMode === "3D" ? 4 : 3; // Longer springs in 3D
  const springStrength = 0.08;
  const repulsionStrength = viewMode === "3D" ? 15 : 12; // Stronger repulsion in 3D
  const damping = 0.85; // Slightly less damping for more movement
  const centerForce = viewMode === "3D" ? 0.01 : 0; // Weak center force in 3D to prevent drift

  for (let iter = 0; iter < iterations; iter++) {
    // Reset velocities
    nodes.forEach((node) => {
      node.vx = 0;
      node.vy = 0;
      node.vz = 0;
    });

    // Calculate center of mass for center force
    let centerX = 0,
      centerY = 0,
      centerZ = 0;
    if (viewMode === "3D" && centerForce > 0) {
      nodes.forEach((node) => {
        centerX += node.x;
        centerY += node.y;
        centerZ += node.z;
      });
      centerX /= totalItems;
      centerY /= totalItems;
      centerZ /= totalItems;
    }

    // Repulsion forces between all nodes
    nodes.forEach((node1, id1) => {
      nodes.forEach((node2, id2) => {
        if (id1 === id2) return;

        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const dz = node2.z - node1.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;

        const repulsion = repulsionStrength / (distance * distance);

        node1.vx -= (dx / distance) * repulsion;
        node1.vy -= (dy / distance) * repulsion;
        node1.vz -= (dz / distance) * repulsion;
      });

      // Weak center force in 3D to prevent collapse to a line
      // This is a weak restoring force that gently pulls nodes toward the center
      if (viewMode === "3D" && centerForce > 0) {
        const dx = centerX - node1.x;
        const dy = centerY - node1.y;
        const dz = centerZ - node1.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;

        // Apply a weak force proportional to distance from center
        // This prevents nodes from collapsing to a line while not being too strong
        node1.vx += (dx / distance) * centerForce * Math.min(distance, 20);
        node1.vy += (dy / distance) * centerForce * Math.min(distance, 20);
        node1.vz += (dz / distance) * centerForce * Math.min(distance, 20);
      }
    });

    // Spring forces along edges
    edges.forEach((edge) => {
      const source = nodes.get(edge.source);
      const target = nodes.get(edge.target);

      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dz = target.z - source.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;

      const displacement = (distance - springLength) * springStrength;

      const fx = (dx / distance) * displacement;
      const fy = (dy / distance) * displacement;
      const fz = (dz / distance) * displacement;

      source.vx += fx / source.mass;
      source.vy += fy / source.mass;
      source.vz += fz / source.mass;

      target.vx -= fx / target.mass;
      target.vy -= fy / target.mass;
      target.vz -= fz / target.mass;
    });

    // Update positions
    nodes.forEach((node) => {
      node.x += node.vx * damping;
      node.y += node.vy * damping;
      node.z += node.vz * damping;
    });
  }

  const updatedTables: Table[] = schema.tables.map((table) => {
    const node = nodes.get(table.name)!;
    // In 2D mode, force y=0; in 3D mode, use calculated y
    const y = viewMode === "2D" ? 0 : node.y;
    return {
      ...table,
      position: [node.x, y, node.z] as [number, number, number],
    };
  });

  // Center the schema by its center of mass
  return centerSchemaByMass({
    ...schema,
    tables: updatedTables,
  });
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
