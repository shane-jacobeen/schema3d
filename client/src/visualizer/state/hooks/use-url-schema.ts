/**
 * Hook for loading schema from URL on component mount.
 * Handles decoding, parsing, and cleaning up the URL.
 */

import { useEffect, useRef } from "react";
import type { DatabaseSchema } from "@/shared/types/schema";
import { parseSchema } from "@/schemas/parsers";
import {
  getSchemaFromHash,
  removeSchemaFromUrl,
  hasSchemaInUrl,
} from "@/shared/utils/url-state";

interface UseUrlSchemaOptions {
  /**
   * Callback when schema is successfully loaded from URL
   */
  onSchemaLoaded?: (schema: DatabaseSchema) => void;

  /**
   * Callback when schema loading fails
   */
  onLoadError?: (error: string) => void;

  /**
   * Whether to automatically clean URL after loading
   * @default true
   */
  cleanUrlAfterLoad?: boolean;
}

/**
 * Custom hook to load schema from URL hash on mount.
 * Decodes, parses, and optionally removes the hash from URL.
 *
 * @param options - Configuration options
 * @returns Object containing loading state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useUrlSchema({
 *     onSchemaLoaded: (schema) => setCurrentSchema(schema),
 *     onLoadError: (error) => toast.error(error)
 *   });
 * }
 * ```
 */
export function useUrlSchema(options: UseUrlSchemaOptions = {}) {
  const { onSchemaLoaded, onLoadError, cleanUrlAfterLoad = true } = options;

  // Use ref to ensure this only runs once on mount
  const hasAttemptedLoad = useRef(false);

  useEffect(() => {
    // Only attempt to load once
    if (hasAttemptedLoad.current) {
      return;
    }

    // Check if there's a schema in the URL
    if (!hasSchemaInUrl()) {
      return;
    }

    hasAttemptedLoad.current = true;

    try {
      // Get schema data from URL
      const urlData = getSchemaFromHash();

      if (!urlData) {
        onLoadError?.("Failed to decode schema from URL");
        // Clean up invalid URL
        if (cleanUrlAfterLoad) {
          removeSchemaFromUrl();
        }
        return;
      }

      const { schemaText, format } = urlData;

      // Parse the schema text
      const parsedSchema = parseSchema(
        schemaText,
        format === "auto" ? undefined : format
      );

      if (!parsedSchema) {
        onLoadError?.(
          "Failed to parse schema. The URL may contain invalid schema data."
        );
        // Clean up invalid URL
        if (cleanUrlAfterLoad) {
          removeSchemaFromUrl();
        }
        return;
      }

      // Successfully loaded schema
      onSchemaLoaded?.(parsedSchema);

      // Clean up URL to prevent conflicts with app state
      if (cleanUrlAfterLoad) {
        removeSchemaFromUrl();
      }
    } catch (error) {
      console.error("Error loading schema from URL:", error);
      onLoadError?.("An unexpected error occurred while loading the schema");

      // Clean up on error
      if (cleanUrlAfterLoad) {
        removeSchemaFromUrl();
      }
    }
  }, [onSchemaLoaded, onLoadError, cleanUrlAfterLoad]);
}
