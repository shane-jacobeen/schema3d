/**
 * DrawDB diagram JSON types (jsonSchema / export format).
 * @see https://github.com/drawdb-io/drawdb/blob/main/src/data/schemas.js
 */

export type DrawdbId = number | string;

export interface DrawdbField {
  id: DrawdbId;
  name: string;
  type: string;
  default: string | number | boolean;
  check: string;
  primary: boolean;
  unique: boolean;
  notNull: boolean;
  increment: boolean;
  comment: string;
  size?: string | number;
  values?: string[];
}

export interface DrawdbIndex {
  name: string;
  unique: boolean;
  fields: string[];
}

export interface DrawdbTable {
  id: DrawdbId;
  name: string;
  x: number;
  y: number;
  fields: DrawdbField[];
  comment: string;
  indices: DrawdbIndex[];
  color: string;
  locked?: boolean;
  hidden?: boolean;
  collapsed?: boolean;
  uniqueConstraints?: Array<{ name: string; fields: string[] }>;
  inherits?: string[];
}

export type DrawdbCardinality = "one_to_one" | "one_to_many" | "many_to_one";

export interface DrawdbRelationship {
  id: DrawdbId;
  name: string;
  startTableId: DrawdbId;
  startFieldId: DrawdbId;
  endTableId: DrawdbId;
  endFieldId: DrawdbId;
  cardinality: DrawdbCardinality | string;
  updateConstraint: string;
  deleteConstraint: string;
}

export interface DrawdbDiagram {
  tables: DrawdbTable[];
  relationships: DrawdbRelationship[];
  notes: unknown[];
  subjectAreas: unknown[];
  title?: string;
  database?: string;
  types?: unknown[];
  enums?: unknown[];
  views?: unknown[];
}
