import type { DatabaseSchema, Table } from "@/shared/types/schema";

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
