import type { Column, DatabaseSchema, Table } from "@/shared/types/schema";
import {
  calculatePosition,
  createCategoryColorMap,
  guessCategory,
} from "../parser-utils";
import { isDrawdbDiagram } from "./detect";
import type {
  DrawdbCardinality,
  DrawdbDiagram,
  DrawdbField,
  DrawdbId,
  DrawdbRelationship,
  DrawdbTable,
} from "./types";

function idsEqual(a: DrawdbId, b: DrawdbId): boolean {
  return String(a) === String(b);
}

function formatFieldType(field: DrawdbField): string {
  const base = field.type?.trim() || "TEXT";
  if (field.size === undefined || field.size === null || field.size === "") {
    return base;
  }
  // Avoid double-sizing if type already includes parentheses
  if (base.includes("(")) {
    return base;
  }
  return `${base}(${field.size})`;
}

function mapCardinality(
  cardinality: string | undefined,
  fkNotNull: boolean
): string | undefined {
  const normalized = (cardinality || "").toLowerCase();
  const leftOptional = fkNotNull ? "1" : "0..1";

  switch (normalized) {
    case "one_to_one":
      return `${leftOptional}:1`;
    case "one_to_many":
      // DrawDB: start = FK table, end = referenced. one_to_many often means
      // one referenced → many FK rows → Schema3D "1:N" / "0..1:N"
      return `${leftOptional}:N`;
    case "many_to_one":
      return `${leftOptional}:N`;
    default:
      return undefined;
  }
}

/**
 * Convert a DrawDB diagram JSON object into Schema3D's DatabaseSchema.
 *
 * MVP notes:
 * - DrawDB `views[]` are ignored (not mapped to isView tables).
 * - Canvas x/y are ignored; positions use the shared circular layout helper
 *   so force/hierarchical layout can take over like SQL/Mermaid imports.
 * - notes, subjectAreas, types, enums, and UI flags are ignored.
 */
export function drawdbDiagramToSchema(diagram: DrawdbDiagram): DatabaseSchema {
  const drawdbTables = diagram.tables ?? [];
  const relationships = diagram.relationships ?? [];

  const tableById = new Map<string, DrawdbTable>();
  const fieldById = new Map<
    string,
    { table: DrawdbTable; field: DrawdbField }
  >();

  for (const table of drawdbTables) {
    tableById.set(String(table.id), table);
    for (const field of table.fields ?? []) {
      fieldById.set(String(field.id), { table, field });
    }
  }

  // Build column maps keyed by table id → field id → Column (mutable for FKs)
  const columnsByTableId = new Map<string, Map<string, Column>>();

  for (const table of drawdbTables) {
    const colMap = new Map<string, Column>();
    for (const field of table.fields ?? []) {
      const column: Column = {
        name: field.name,
        type: formatFieldType(field),
        isPrimaryKey: !!field.primary,
        isUnique: !!field.unique,
        isNullable: !field.notNull,
      };
      colMap.set(String(field.id), column);
    }
    columnsByTableId.set(String(table.id), colMap);
  }

  // Apply relationships → Column.references
  for (const rel of relationships) {
    applyRelationship(rel, tableById, fieldById, columnsByTableId);
  }

  const categories = drawdbTables.map((t) => guessCategory(t.name));
  const colorMap = createCategoryColorMap(categories);

  const tables: Table[] = drawdbTables.map((drawdbTable, index) => {
    const colMap = columnsByTableId.get(String(drawdbTable.id));
    const columns = (drawdbTable.fields ?? []).map((field) => {
      const col = colMap?.get(String(field.id));
      return (
        col ?? {
          name: field.name,
          type: formatFieldType(field),
          isPrimaryKey: !!field.primary,
          isUnique: !!field.unique,
          isNullable: !field.notNull,
        }
      );
    });

    const category = guessCategory(drawdbTable.name);
    return {
      name: drawdbTable.name,
      columns,
      position: calculatePosition(index, drawdbTables.length),
      color: colorMap.get(category) || "#3b82f6",
      category,
    };
  });

  return {
    name: diagram.title?.trim() || "Custom Database",
    format: "drawdb",
    tables,
  };
}

function applyRelationship(
  rel: DrawdbRelationship,
  tableById: Map<string, DrawdbTable>,
  fieldById: Map<string, { table: DrawdbTable; field: DrawdbField }>,
  columnsByTableId: Map<string, Map<string, Column>>
): void {
  const startTable = tableById.get(String(rel.startTableId));
  const endTable = tableById.get(String(rel.endTableId));
  const startFieldEntry = fieldById.get(String(rel.startFieldId));
  const endFieldEntry = fieldById.get(String(rel.endFieldId));

  if (!startTable || !endTable || !startFieldEntry || !endFieldEntry) {
    console.warn(
      `DrawDB relationship skipped (unresolved ids): ${rel.name || rel.id}`
    );
    return;
  }

  // Validate field belongs to the declared table
  if (
    !idsEqual(startFieldEntry.table.id, rel.startTableId) ||
    !idsEqual(endFieldEntry.table.id, rel.endTableId)
  ) {
    console.warn(
      `DrawDB relationship skipped (field/table mismatch): ${rel.name || rel.id}`
    );
    return;
  }

  const colMap = columnsByTableId.get(String(rel.startTableId));
  const column = colMap?.get(String(rel.startFieldId));
  if (!column) {
    console.warn(
      `DrawDB relationship skipped (missing start column): ${rel.name || rel.id}`
    );
    return;
  }

  column.isForeignKey = true;
  column.references = {
    table: endTable.name,
    column: endFieldEntry.field.name,
    cardinality: mapCardinality(
      rel.cardinality as DrawdbCardinality,
      !!startFieldEntry.field.notNull
    ),
  };
}

/**
 * Parse DrawDB JSON text into a DatabaseSchema.
 * Returns null if the text is not valid DrawDB JSON or has no tables.
 */
export function parseDrawdbSchema(text: string): DatabaseSchema | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }

  if (!isDrawdbDiagram(parsed)) {
    return null;
  }

  const schema = drawdbDiagramToSchema(parsed);
  if (!schema.tables.length) {
    return null;
  }
  return schema;
}
