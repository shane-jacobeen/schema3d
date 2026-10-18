import { describe, it, expect } from "vitest";
import {
  LONG_PRESS_REPOSITION_SECONDS,
  easeInOutCubic,
  longPressRepositionAlpha,
} from "@/visualizer/3d/utils/camera-utils";

describe("long-press camera reposition", () => {
  it("finishes in a short fixed time instead of easing forever", () => {
    expect(LONG_PRESS_REPOSITION_SECONDS).toBeLessThanOrEqual(0.35);
    expect(longPressRepositionAlpha(0)).toBe(0);
    expect(longPressRepositionAlpha(LONG_PRESS_REPOSITION_SECONDS)).toBe(1);
    expect(longPressRepositionAlpha(LONG_PRESS_REPOSITION_SECONDS + 1)).toBe(1);
  });

  it("starts slow, moves fastest through the middle, and decelerates at the end", () => {
    const at = (fraction: number) =>
      longPressRepositionAlpha(LONG_PRESS_REPOSITION_SECONDS * fraction);

    expect(at(0.5)).toBeCloseTo(0.5, 5);

    const startSpan = at(0.25) - at(0);
    const middleSpan = at(0.75) - at(0.25);
    const endSpan = at(1) - at(0.75);

    // Gentler than cubic ease-in-out, which covers ~6% in the first quarter.
    expect(startSpan).toBeLessThan(easeInOutCubic(0.25));
    expect(endSpan).toBeCloseTo(startSpan, 5);
    expect(at(0.125)).toBeLessThan(0.01);
    expect(middleSpan).toBeGreaterThan(startSpan * 3);
    expect(middleSpan).toBeGreaterThan(endSpan * 3);
  });
});
