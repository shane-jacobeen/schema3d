import type { DrawdbDiagram } from "./types";

/**
 * Returns true if `obj` looks like a DrawDB diagram export (jsonSchema shape).
 */
export function isDrawdbDiagram(obj: unknown): obj is DrawdbDiagram {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return false;
  }

  const diagram = obj as Record<string, unknown>;

  if (!Array.isArray(diagram.tables) || !Array.isArray(diagram.relationships)) {
    return false;
  }

  // notes / subjectAreas are required by DrawDB jsonSchema; accept missing as empty
  if (diagram.notes !== undefined && !Array.isArray(diagram.notes)) {
    return false;
  }
  if (
    diagram.subjectAreas !== undefined &&
    !Array.isArray(diagram.subjectAreas)
  ) {
    return false;
  }

  if (diagram.tables.length === 0) {
    return false;
  }

  const firstTable = diagram.tables[0];
  if (!firstTable || typeof firstTable !== "object") {
    return false;
  }

  const table = firstTable as Record<string, unknown>;
  if (typeof table.name !== "string" || !Array.isArray(table.fields)) {
    return false;
  }

  if (table.fields.length > 0) {
    const field = table.fields[0] as Record<string, unknown>;
    if (
      typeof field.name !== "string" ||
      typeof field.type !== "string" ||
      typeof field.primary !== "boolean"
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Try to parse text as JSON and detect a DrawDB diagram.
 * Returns the diagram or null.
 */
export function tryParseDrawdbJson(text: string): DrawdbDiagram | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (isDrawdbDiagram(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}
