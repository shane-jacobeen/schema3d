import * as THREE from "three";
import type { DatabaseSchema } from "@/shared/types/schema";
import type { Cardinality } from "@/shared/types/cardinality";
import { calculateCardinality } from "@/shared/types/cardinality";
import { TABLE_RADIUS, RELATIONSHIP_LINE_Y_OFFSET } from "../constants";
import { getTableSurfacePoint } from "../components/relationships/relationship-utils";
import type { Relationship } from "../types";

export interface RelationshipGraphInput {
  schema: DatabaseSchema;
  visibleTableNames?: Set<string>;
}

/**
 * Build relationship objects from schema foreign keys (pure, testable).
 */
export function buildRelationshipGraph({
  schema,
  visibleTableNames,
}: RelationshipGraphInput): Relationship[] {
  const result: Relationship[] = [];

  schema.tables.forEach((table) => {
    if (visibleTableNames && !visibleTableNames.has(table.name)) {
      return;
    }

    table.columns.forEach((column) => {
      if (column.isForeignKey && column.references) {
        const referencedTable = schema.tables.find(
          (t) => t.name.toLowerCase() === column.references!.table.toLowerCase()
        );

        if (
          referencedTable &&
          (!visibleTableNames || visibleTableNames.has(referencedTable.name))
        ) {
          const fromTablePos = table.position;
          const toTablePos = referencedTable.position;
          const fromCenter = new THREE.Vector3(...fromTablePos);
          const toCenter = new THREE.Vector3(...toTablePos);

          fromCenter.y += RELATIONSHIP_LINE_Y_OFFSET;
          toCenter.y += RELATIONSHIP_LINE_Y_OFFSET;

          const direction = new THREE.Vector3()
            .subVectors(toCenter, fromCenter)
            .normalize();

          const fromPos = getTableSurfacePoint(
            fromCenter,
            direction,
            TABLE_RADIUS
          );
          const toPos = getTableSurfacePoint(
            toCenter,
            direction.clone().multiplyScalar(-1),
            TABLE_RADIUS
          );

          const curve = new THREE.LineCurve3(fromPos, toPos);
          const points = [fromPos.clone(), toPos.clone()];
          const midpoint = new THREE.Vector3()
            .addVectors(fromPos, toPos)
            .multiplyScalar(0.5);

          const pkColumn = referencedTable.columns.find(
            (c) => c.name === column.references!.column
          );

          const cardinality: Cardinality =
            (column.references!.cardinality as Cardinality | undefined) ||
            calculateCardinality(pkColumn, column);

          result.push({
            id: `${table.name}.${column.name}->${referencedTable.name}.${column.references.column}`,
            points,
            fromTable: table.name,
            toTable: referencedTable.name,
            fkColumn: column.name,
            pkColumn: column.references.column,
            midpoint,
            curve,
            cardinality,
          });
        }
      }
    });
  });

  return result;
}
