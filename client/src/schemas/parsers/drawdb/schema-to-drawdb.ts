import type { DatabaseSchema } from "@/shared/types/schema";
import type {
  DrawdbCardinality,
  DrawdbDiagram,
  DrawdbField,
  DrawdbRelationship,
  DrawdbTable,
} from "./types";

const DEFAULT_TABLE_COLOR = "#175e7a";
const DEFAULT_CONSTRAINT = "No action";

/**
 * Parse a Schema3D column type like "VARCHAR(50)" into DrawDB type + size.
 */
function splitTypeAndSize(type: string): {
  type: string;
  size?: string | number;
  increment: boolean;
} {
  const trimmed = (type || "TEXT").trim();
  const upper = trimmed.toUpperCase();

  // SERIAL / BIGSERIAL → INTEGER/BIGINT + increment
  if (upper === "SERIAL" || upper === "SMALLSERIAL") {
    return { type: "INTEGER", increment: true };
  }
  if (upper === "BIGSERIAL") {
    return { type: "BIGINT", increment: true };
  }

  const match = trimmed.match(/^([A-Za-z_][\w\s]*?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    const base = match[1].trim();
    const sizeRaw = match[2].trim();
    const sizeNum = Number(sizeRaw);
    return {
      type: base,
      size:
        Number.isFinite(sizeNum) && String(sizeNum) === sizeRaw
          ? sizeNum
          : sizeRaw,
      increment: false,
    };
  }

  return { type: trimmed, increment: false };
}

function mapToDrawdbCardinality(
  cardinality: string | undefined,
  isUnique: boolean | undefined
): DrawdbCardinality {
  if (isUnique) return "one_to_one";
  if (!cardinality) return "many_to_one";

  const right = cardinality.split(":")[1]?.toLowerCase() ?? "";
  if (right === "1" || right === "0..1") {
    return "one_to_one";
  }
  return "many_to_one";
}

/**
 * Convert a Schema3D DatabaseSchema into DrawDB diagram JSON.
 * Uses stable numeric ids derived from table/column order.
 * Views (isView) are omitted — DrawDB view model is out of scope for MVP.
 */
export function schemaToDrawdbJson(schema: DatabaseSchema): DrawdbDiagram {
  const regularTables = schema.tables.filter((t) => !t.isView);

  const tables: DrawdbTable[] = [];
  const relationships: DrawdbRelationship[] = [];

  // Stable id maps: table name → id, `${table}.${column}` → field id
  const tableIdByName = new Map<string, number>();
  const fieldIdByKey = new Map<string, number>();

  let nextFieldId = 1;
  let nextRelId = 1;

  regularTables.forEach((table, tableIndex) => {
    const tableId = tableIndex;
    tableIdByName.set(table.name, tableId);

    const fields: DrawdbField[] = table.columns.map((column) => {
      const fieldId = nextFieldId++;
      fieldIdByKey.set(`${table.name}.${column.name}`, fieldId);

      const { type, size, increment } = splitTypeAndSize(column.type);
      const field: DrawdbField = {
        id: fieldId,
        name: column.name,
        type,
        default: "",
        check: "",
        primary: !!column.isPrimaryKey,
        unique: !!column.isUnique,
        notNull: column.isNullable === false,
        increment:
          increment ||
          (!!column.isPrimaryKey && type.toUpperCase() === "INTEGER"),
        comment: "",
      };
      if (size !== undefined) {
        field.size = size;
      }
      return field;
    });

    // Grid layout for a usable default canvas (import into DrawDB)
    const col = tableIndex % 4;
    const row = Math.floor(tableIndex / 4);

    tables.push({
      id: tableId,
      name: table.name,
      x: col * 280,
      y: row * 320,
      fields,
      comment: "",
      indices: [],
      color: DEFAULT_TABLE_COLOR,
    });
  });

  for (const table of regularTables) {
    const startTableId = tableIdByName.get(table.name);
    if (startTableId === undefined) continue;

    for (const column of table.columns) {
      if (!column.isForeignKey || !column.references) continue;

      const startFieldId = fieldIdByKey.get(`${table.name}.${column.name}`);
      const endTableId = tableIdByName.get(column.references.table);
      const endFieldId = fieldIdByKey.get(
        `${column.references.table}.${column.references.column}`
      );

      if (
        startFieldId === undefined ||
        endTableId === undefined ||
        endFieldId === undefined
      ) {
        continue;
      }

      relationships.push({
        id: nextRelId++,
        name: `${table.name}_${column.name}_fk`,
        startTableId,
        startFieldId,
        endTableId,
        endFieldId,
        cardinality: mapToDrawdbCardinality(
          column.references.cardinality,
          column.isUnique
        ),
        updateConstraint: DEFAULT_CONSTRAINT,
        deleteConstraint: DEFAULT_CONSTRAINT,
      });
    }
  }

  return {
    tables,
    relationships,
    notes: [],
    subjectAreas: [],
    title: schema.name || "Untitled",
    database: "postgresql",
  };
}

/**
 * Serialize a schema to pretty-printed DrawDB JSON text.
 */
export function schemaToDrawdbText(schema: DatabaseSchema): string {
  return JSON.stringify(schemaToDrawdbJson(schema), null, 2);
}
