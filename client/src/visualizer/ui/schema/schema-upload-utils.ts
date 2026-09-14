/**
 * Pure helpers for schema file upload validation.
 */

const ACCEPTED_EXTENSIONS = [
  ".sql",
  ".mmd",
  ".mermaid",
  ".json",
  ".ddb",
] as const;

/**
 * Returns true if the filename has an accepted schema upload extension.
 */
export function isAcceptedSchemaUploadFilename(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export const SCHEMA_UPLOAD_ACCEPT =
  ".sql,.mmd,.mermaid,.json,.ddb,.txt,text/plain,application/sql,application/json";
