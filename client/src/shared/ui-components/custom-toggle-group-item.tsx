"use client";

import * as React from "react";
import { ToggleGroupItem } from "./toggle-group";
import { toggleGroupItemStyles } from "@/shared/utils/button-styles";
import { cn } from "@/shared/utils/utils";

export interface CustomToggleGroupItemProps extends Omit<
  React.ComponentPropsWithoutRef<typeof ToggleGroupItem>,
  "size"
> {
  size?: "default" | "sm" | "lg";
}

/**
 * Reusable ToggleGroupItem component with consistent custom styling
 * Used for format selectors, view mode toggles, etc.
 */
export const CustomToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupItem>,
  CustomToggleGroupItemProps
>(({ className, size = "sm", children, ...props }, ref) => {
  const sizeClasses =
    size === "sm"
      ? "gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-9"
      : "gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-9";

  return (
    <ToggleGroupItem
      ref={ref}
      variant="outline"
      className={cn(
        toggleGroupItemStyles,
        sizeClasses,
        "flex-1 justify-center border-slate-700 !border-slate-700",
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupItem>
  );
});

CustomToggleGroupItem.displayName = "CustomToggleGroupItem";
