import type { DatabaseSchema, Table } from "@/shared/types/schema";
import { centerSchemaByMass } from "./layout-math";

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

export function computeForceDirectedLayout(
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
  // Scale iterations down for large schemas to avoid blocking the main thread
  const iterations = totalItems > 200 ? 50 : totalItems > 100 ? 80 : 150;
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
