import type { Cardinality } from "@/shared/types/cardinality";

/**
 * Parse a Mermaid cardinality segment (e.g. "||--o{", "}o--||")
 * into a textual cardinality representation like "1:N", "0..1:1..N", "0..N:1".
 *
 * Mermaid ER syntax uses these symbols:
 * - "|"  : exactly one
 * - "o"  : zero or one
 * - "{"  : zero or many
 * - "}"  : one or many
 *
 * We map them into our shared CardinalitySymbol set:
 * - "1"     : exactly one
 * - "0..1"  : zero or one
 * - "0..N"  : zero or many
 * - "1..N"  : one or many
 */
export function parseMermaidCardinality(segment: string): Cardinality {
  const [left, right] = segment.split("--");

  const mapSide = (side: string | undefined): string => {
    if (!side) return "0..N";

    // Check for "many" symbols first (they take precedence)
    const hasOpenBrace = side.includes("{");
    const hasCloseBrace = side.includes("}");
    const hasOptional = side.includes("o");
    const hasOne = side.includes("|");

    // Handle "many" cases
    if (hasOpenBrace || hasCloseBrace) {
      // If it has both | and {/}, it means "one or many" (1..N)
      // If it has o and {, it means "zero or many" (0..N)
      // If it has just }, it means "one or many" (1..N)
      // If it has just {, it means "zero or many" (0..N)
      if (hasCloseBrace) {
        return "1..N"; // } always means one-or-many
      } else if (hasOpenBrace) {
        // { can be zero-or-many (0..N) or one-or-many (1..N) depending on context
        // If there's a | before it, it's one-or-many (1..N)
        // Otherwise it's zero-or-many (0..N)
        return hasOne ? "1..N" : "0..N";
      }
    }

    // Handle "one" cases (no many symbols)
    if (hasOptional && hasOne) {
      // Both o and | - this is ambiguous, but typically means zero-or-one
      return "0..1";
    } else if (hasOptional) {
      // Just o - zero or one
      return "0..1";
    } else if (hasOne) {
      // Just | - exactly one
      return "1";
    }

    // Fallback to many if we can't interpret the token
    return "0..N";
  };

  const leftSymbol = mapSide(left);
  const rightSymbol = mapSide(right);

  return `${leftSymbol}:${rightSymbol}` as Cardinality;
}
