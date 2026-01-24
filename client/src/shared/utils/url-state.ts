/**
 * URL state management utilities for reading and writing schema data in URL hash.
 * Supports multiple URL formats for compatibility with different tools.
 */

import { decodeSchemaFromUrl, decodeViewState } from "./url-encoding";
import type { SchemaFormat } from "@/schemas/parsers";
import type { SharedViewState } from "@/shared/types/schema";

export interface SchemaFromUrl {
  schemaText: string;
  format: SchemaFormat | "auto";
  prefix: string; // The prefix used (pako, schema, sql, mermaid)
  viewState?: SharedViewState | null; // Optional view state from URL
}

/**
 * Supported URL hash prefixes and their meanings
 */
const URL_PREFIXES = {
  PAKO: "pako", // Mermaid.live compatible format
  SCHEMA: "schema", // Generic schema (auto-detect format)
  SQL: "sql", // Explicit SQL format
  MERMAID: "mermaid", // Explicit Mermaid format
} as const;

/**
 * Get schema data from the URL hash.
 * Supports multiple formats:
 * - #pako:ENCODED (mermaid.live compatible)
 * - #schema:ENCODED (auto-detect format)
 * - #sql:ENCODED (explicit SQL)
 * - #mermaid:ENCODED (explicit Mermaid)
 *
 * @returns Schema data with format info, or null if no valid schema in URL
 *
 * @example
 * ```typescript
 * // URL: https://schema3d.com/#pako:eNpVjc...
 * const data = getSchemaFromHash();
 * // { schemaText: "erDiagram...", format: "auto", prefix: "pako" }
 * ```
 */
export function getSchemaFromHash(): SchemaFromUrl | null {
  try {
    // Get hash without the leading #
    const hash = window.location.hash.slice(1);

    if (!hash) {
      return null;
    }

    // Parse prefix and encoded data
    const colonIndex = hash.indexOf(":");
    if (colonIndex === -1) {
      return null;
    }

    const prefix = hash.slice(0, colonIndex).toLowerCase();
    const afterPrefix = hash.slice(colonIndex + 1);

    // Validate prefix
    const validPrefixes = Object.values(URL_PREFIXES);
    if (
      !validPrefixes.includes(
        prefix as (typeof URL_PREFIXES)[keyof typeof URL_PREFIXES]
      )
    ) {
      console.warn(`Unknown URL prefix: ${prefix}`);
      return null;
    }

    // Split schema and optional view state (format: SCHEMA:VIEW)
    const parts = afterPrefix.split(":");
    const encodedSchema = parts[0];
    const encodedViewState = parts[1]; // May be undefined

    // Decode the schema text
    const schemaText = decodeSchemaFromUrl(encodedSchema);
    if (!schemaText) {
      console.error("Failed to decode schema from URL");
      return null;
    }

    // Decode view state if present
    let viewState: SharedViewState | null = null;
    if (encodedViewState) {
      viewState = decodeViewState(encodedViewState);
      // If decoding fails, continue anyway (graceful degradation)
    }

    // Determine format based on prefix
    let format: SchemaFormat | "auto" = "auto";
    if (prefix === URL_PREFIXES.SQL) {
      format = "sql";
    } else if (prefix === URL_PREFIXES.MERMAID) {
      format = "mermaid";
    } else if (prefix === URL_PREFIXES.PAKO) {
      // mermaid.live uses pako prefix for Mermaid ERDs
      format = "mermaid";
    }
    // URL_PREFIXES.SCHEMA remains "auto"

    return {
      schemaText,
      format,
      prefix,
      viewState,
    };
  } catch (error) {
    console.error("Error parsing schema from URL:", error);
    return null;
  }
}

/**
 * Remove the schema hash from the URL without reloading the page.
 * This prevents conflicts between URL state and app state.
 *
 * @example
 * ```typescript
 * // URL: https://schema3d.com/#pako:eNpVjc...
 * removeSchemaFromUrl();
 * // URL: https://schema3d.com/
 * ```
 */
export function removeSchemaFromUrl(): void {
  try {
    // Use replaceState to update URL without triggering navigation
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState({}, "", url.toString());
  } catch (error) {
    console.error("Failed to clean URL:", error);
  }
}

/**
 * Check if the current URL has a schema hash.
 *
 * @returns true if URL contains a schema hash
 */
export function hasSchemaInUrl(): boolean {
  const hash = window.location.hash.slice(1);
  if (!hash || !hash.includes(":")) {
    return false;
  }

  const prefix = hash.slice(0, hash.indexOf(":")).toLowerCase();
  const validPrefixes = Object.values(URL_PREFIXES);
  return validPrefixes.includes(
    prefix as (typeof URL_PREFIXES)[keyof typeof URL_PREFIXES]
  );
}

/**
 * Generate a shareable URL with encoded schema and optional view state.
 *
 * @param encodedSchema - The encoded schema string
 * @param format - The schema format (determines prefix)
 * @param encodedViewState - Optional encoded view state string
 * @returns Full URL with schema hash (and view state if provided)
 *
 * @example
 * ```typescript
 * const url = createShareableUrl(encoded, "sql");
 * // Returns: "https://schema3d.com/#sql:eNpVjc..."
 *
 * const urlWithView = createShareableUrl(encoded, "sql", viewEncoded);
 * // Returns: "https://schema3d.com/#sql:eNpVjc...:eyJzZWxl..."
 * ```
 */
export function createShareableUrl(
  encodedSchema: string,
  format: SchemaFormat,
  encodedViewState?: string
): string {
  const prefix = format === "sql" ? URL_PREFIXES.SQL : URL_PREFIXES.MERMAID;
  const baseUrl = window.location.origin + window.location.pathname;

  // Append view state as second colon segment if provided
  const hash = encodedViewState
    ? `${prefix}:${encodedSchema}:${encodedViewState}`
    : `${prefix}:${encodedSchema}`;

  return `${baseUrl}#${hash}`;
}
