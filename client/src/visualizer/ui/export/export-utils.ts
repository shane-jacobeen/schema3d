/**
 * Escapes a value for CSV format
 */
export function escapeCSV(
  value: string | number | boolean | undefined
): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Creates and triggers a file download
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string = "text/plain"
) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generates a timestamp string for filenames
 */
export function generateTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
}
