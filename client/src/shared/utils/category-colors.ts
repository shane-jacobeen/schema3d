import { COLOR_PALETTE } from "@/shared/constants/colors";

/**
 * Find the first unused color from the palette, or cycle through if all are used.
 */
export function findUnusedColor(usedColors: Set<string>): string {
  return (
    COLOR_PALETTE.find((color) => !usedColors.has(color)) ||
    COLOR_PALETTE[usedColors.size % COLOR_PALETTE.length]!
  );
}
