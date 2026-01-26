/**
 * URL Encoding/Decoding utilities for schema sharing.
 * Uses pako for gzip compression and base64url encoding for URL safety.
 * Compatible with mermaid.live encoding format.
 */

import pako from "pako";
import type { SharedViewState } from "@/shared/types/schema";

/**
 * Convert base64 string to base64url (URL-safe variant)
 * Replaces + with -, / with _, and removes padding =
 */
function toBase64url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Convert base64url back to standard base64
 * Replaces - with +, _ with /, and restores padding
 */
function fromBase64url(base64url: string): string {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  while (base64.length % 4) {
    base64 += "=";
  }
  return base64;
}

/**
 * Encode schema text to URL-safe compressed string.
 * Uses gzip compression followed by base64url encoding.
 *
 * @param schemaText - The raw schema text (SQL or Mermaid)
 * @returns URL-safe encoded string
 *
 * @example
 * ```typescript
 * const encoded = encodeSchemaToUrl("CREATE TABLE users (id INT);");
 * // Returns: "eNpVjc1ugzAQhF..."
 * ```
 */
export function encodeSchemaToUrl(schemaText: string): string {
  try {
    // Convert string to Uint8Array
    const utf8 = new TextEncoder().encode(schemaText);

    // Compress with gzip
    const compressed = pako.deflate(utf8, { level: 9 });

    // Convert to base64
    const base64 = btoa(
      String.fromCharCode.apply(null, Array.from(compressed))
    );

    // Convert to base64url (URL-safe)
    return toBase64url(base64);
  } catch (error) {
    console.error("Failed to encode schema:", error);
    throw new Error("Failed to encode schema for URL");
  }
}

/**
 * Decode URL-safe compressed string back to schema text.
 * Handles both base64url and standard base64 encoding.
 *
 * @param encoded - The URL-encoded string
 * @returns Decoded schema text, or null if decoding fails
 *
 * @example
 * ```typescript
 * const schema = decodeSchemaFromUrl("eNpVjc1ugzAQhF...");
 * // Returns: "CREATE TABLE users (id INT);" or null
 * ```
 */
export function decodeSchemaFromUrl(encoded: string): string | null {
  // Handle empty string
  if (!encoded || encoded.trim() === "") {
    return null;
  }

  try {
    // Convert from base64url to standard base64 if needed
    const base64 = fromBase64url(encoded);

    // Decode base64 to binary
    const binaryString = atob(base64);

    // Convert binary string to Uint8Array
    const compressed = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      compressed[i] = binaryString.charCodeAt(i);
    }

    // Decompress with gzip
    const decompressed = pako.inflate(compressed);

    // Convert Uint8Array back to string
    const schemaText = new TextDecoder().decode(decompressed);

    return schemaText;
  } catch (error) {
    console.error("Failed to decode schema from URL:", error);
    return null;
  }
}

/**
 * Estimate the compressed size of a schema text.
 * Useful for warning users about large schemas.
 *
 * @param schemaText - The schema text to measure
 * @returns Approximate compressed size in bytes
 */
export function estimateEncodedSize(schemaText: string): number {
  try {
    const utf8 = new TextEncoder().encode(schemaText);
    const compressed = pako.deflate(utf8, { level: 9 });
    return compressed.length;
  } catch {
    return 0;
  }
}

/**
 * Check if an encoded string is likely valid (basic validation).
 *
 * @param encoded - The encoded string to validate
 * @returns true if the string looks like valid base64url
 */
export function isValidEncodedString(encoded: string): boolean {
  // Base64url should only contain A-Z, a-z, 0-9, -, _
  return /^[A-Za-z0-9\-_]+$/.test(encoded);
}

/**
 * Encode view state to URL-safe string.
 * Uses JSON stringify followed by base64url encoding (no compression for small data).
 *
 * @param viewState - The view state object to encode
 * @returns URL-safe encoded string
 *
 * @example
 * ```typescript
 * const encoded = encodeViewState({
 *   selectedCategories: ["Core", "Auth"],
 *   layoutAlgorithm: "force",
 *   viewMode: "3D"
 * });
 * // Returns: "eyJzZWxlY3RlZENhdGVnb3JpZXMi..."
 * ```
 */
export function encodeViewState(viewState: SharedViewState): string {
  try {
    // Serialize to JSON
    const json = JSON.stringify(viewState);

    // Convert to base64url (no compression - view state is small)
    const base64 = btoa(json);
    return toBase64url(base64);
  } catch (error) {
    console.error("Failed to encode view state:", error);
    throw new Error("Failed to encode view state for URL");
  }
}

/**
 * Decode view state from URL-safe string.
 *
 * @param encoded - The URL-encoded view state string
 * @returns Decoded view state object, or null if decoding fails
 *
 * @example
 * ```typescript
 * const viewState = decodeViewState("eyJzZWxlY3RlZENhdGVnb3JpZXMi...");
 * // Returns: { selectedCategories: ["Core", "Auth"], ... } or null
 * ```
 */
export function decodeViewState(encoded: string): SharedViewState | null {
  // Handle empty string
  if (!encoded || encoded.trim() === "") {
    return null;
  }

  try {
    // Convert from base64url to standard base64
    const base64 = fromBase64url(encoded);

    // Decode base64 to JSON string
    const json = atob(base64);

    // Parse JSON
    const viewState = JSON.parse(json) as SharedViewState;

    return viewState;
  } catch (error) {
    console.error("Failed to decode view state from URL:", error);
    return null;
  }
}
