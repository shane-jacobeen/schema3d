import { describe, it, expect, beforeEach } from "vitest";
import {
  setPendingViewState,
  getPendingViewState,
  consumePendingViewState,
  hasPendingViewState,
} from "@/visualizer/state/utils/view-state-store";
import type { SharedViewState } from "@/shared/types/schema";

describe("View State Store", () => {
  beforeEach(() => {
    // Clear any pending state before each test
    consumePendingViewState();
  });

  describe("setPendingViewState and getPendingViewState", () => {
    it("should store and retrieve pending view state", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true },
          { name: "Sales", color: "#10b981", selected: false },
        ],
        layoutAlgorithm: "hierarchical",
        viewMode: "2D",
      };

      setPendingViewState(viewState);

      const retrieved = getPendingViewState();
      expect(retrieved).toEqual(viewState);
    });

    it("should return null when no state is set", () => {
      const result = getPendingViewState();
      expect(result).toBeNull();
    });

    it("should allow multiple reads with getPendingViewState", () => {
      const viewState: SharedViewState = {
        categories: [],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      setPendingViewState(viewState);

      // Multiple reads should return the same state
      const read1 = getPendingViewState();
      const read2 = getPendingViewState();
      const read3 = getPendingViewState();

      expect(read1).toEqual(viewState);
      expect(read2).toEqual(viewState);
      expect(read3).toEqual(viewState);
    });
  });

  describe("consumePendingViewState", () => {
    it("should return and clear pending view state", () => {
      const viewState: SharedViewState = {
        categories: [{ name: "Test", color: "#ff0000", selected: true }],
        layoutAlgorithm: "circular",
        viewMode: "3D",
      };

      setPendingViewState(viewState);

      const consumed = consumePendingViewState();
      expect(consumed).toEqual(viewState);

      // After consuming, should be cleared
      const afterConsume = getPendingViewState();
      expect(afterConsume).toBeNull();
    });

    it("should return null when consuming empty state", () => {
      const result = consumePendingViewState();
      expect(result).toBeNull();
    });
  });

  describe("hasPendingViewState", () => {
    it("should return true when state is pending", () => {
      const viewState: SharedViewState = {
        categories: [],
        layoutAlgorithm: "force",
        viewMode: "2D",
      };

      setPendingViewState(viewState);

      expect(hasPendingViewState()).toBe(true);
    });

    it("should return false when no state is pending", () => {
      expect(hasPendingViewState()).toBe(false);
    });

    it("should return false after consuming state", () => {
      const viewState: SharedViewState = {
        categories: [],
        layoutAlgorithm: "hierarchical",
        viewMode: "3D",
      };

      setPendingViewState(viewState);
      expect(hasPendingViewState()).toBe(true);

      consumePendingViewState();
      expect(hasPendingViewState()).toBe(false);
    });
  });

  describe("Multi-hook consumption pattern", () => {
    it("should allow multiple hooks to read state before consumption", () => {
      const viewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true },
          { name: "Sales", color: "#10b981", selected: true },
        ],
        layoutAlgorithm: "force",
        viewMode: "3D",
      };

      setPendingViewState(viewState);

      // Simulate multiple hooks reading during initialization
      // (like useFilterState and useLayoutManagement)
      const filterStateRead = getPendingViewState();
      const layoutManagementRead = getPendingViewState();
      const anotherRead = getPendingViewState();

      // All should get the same state
      expect(filterStateRead).toEqual(viewState);
      expect(layoutManagementRead).toEqual(viewState);
      expect(anotherRead).toEqual(viewState);

      // State should still be pending
      expect(hasPendingViewState()).toBe(true);

      // Finally consume to clear it (simulating useSchemaState cleanup)
      const consumed = consumePendingViewState();
      expect(consumed).toEqual(viewState);
      expect(hasPendingViewState()).toBe(false);
    });

    it("should handle null view state correctly", () => {
      setPendingViewState(null);

      const read1 = getPendingViewState();
      expect(read1).toBeNull();

      const consumed = consumePendingViewState();
      expect(consumed).toBeNull();

      expect(hasPendingViewState()).toBe(false);
    });
  });

  describe("Integration scenario: URL load with view state", () => {
    it("should support the complete URL-to-hooks initialization flow", () => {
      // 1. URL is decoded and view state is set (in getInitialSchema)
      const urlViewState: SharedViewState = {
        categories: [
          { name: "Core", color: "#3b82f6", selected: true },
          { name: "Analytics", color: "#8b5cf6", selected: false },
        ],
        layoutAlgorithm: "hierarchical",
        viewMode: "2D",
      };

      setPendingViewState(urlViewState);

      // 2. useFilterState reads categories during initialization
      const filterState = getPendingViewState();
      expect(filterState?.categories).toEqual(urlViewState.categories);

      // 3. useLayoutManagement reads layout and viewMode during initialization
      const layoutState = getPendingViewState();
      expect(layoutState?.layoutAlgorithm).toBe("hierarchical");
      expect(layoutState?.viewMode).toBe("2D");

      // 4. State is still pending for other potential consumers
      expect(hasPendingViewState()).toBe(true);

      // 5. useSchemaState cleanup effect consumes and clears the state
      const cleanup = consumePendingViewState();
      expect(cleanup).toEqual(urlViewState);

      // 6. State is now cleared and no longer pending
      expect(hasPendingViewState()).toBe(false);
      expect(getPendingViewState()).toBeNull();
    });
  });
});
