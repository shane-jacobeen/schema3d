/**
 * Common button style classes used across the application
 * These styles provide a consistent dark theme appearance with slate backgrounds
 */

/**
 * Base styles for custom-styled buttons (rounded, dark theme)
 * Used for icon buttons, action buttons, etc.
 */
export const customButtonBaseStyles =
  "rounded-full bg-slate-900/95 border-slate-700 text-white hover:bg-slate-800 hover:text-blue-400 backdrop-blur-sm";

/**
 * Styles for toggle group items (used in ToggleGroup)
 * Includes active state styling
 */
export const toggleGroupItemStyles =
  "rounded-full bg-slate-900/95 border-slate-700 text-white hover:bg-slate-800 hover:text-blue-400 backdrop-blur-sm data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 data-[state=on]:border-blue-500";

/**
 * Size variants for buttons
 */
export const buttonSizeVariants = {
  icon: {
    small: "w-7 h-7 sm:w-8 sm:h-8",
    medium: "w-9 h-9 sm:w-10 sm:h-10",
  },
  text: {
    small: "text-xs sm:text-sm h-7 sm:h-9",
    medium: "text-xs sm:text-sm h-8 sm:h-9",
  },
};

/**
 * Utility function to combine button styles
 */
export function cnButton(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
