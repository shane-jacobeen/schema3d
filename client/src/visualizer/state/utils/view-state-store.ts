import type { SharedViewState } from "@/shared/types/schema";

/**
 * Store for view state loaded from URL.
 * This allows the view state to be accessed by different hooks during initialization.
 */
let pendingViewState: SharedViewState | null = null;

/**
 * Set the pending view state from URL.
 * Should be called when loading a schema from URL.
 */
export function setPendingViewState(viewState: SharedViewState | null): void {
  pendingViewState = viewState;
}

/**
 * Get and clear the pending view state.
 * Should be called by hooks that need to apply view state during initialization.
 */
export function consumePendingViewState(): SharedViewState | null {
  const state = pendingViewState;
  pendingViewState = null;
  return state;
}

/**
 * Check if there is pending view state waiting to be applied.
 */
export function hasPendingViewState(): boolean {
  return pendingViewState !== null;
}

/**
 * Get the pending view state without consuming it.
 * Useful for checking what view state will be applied.
 */
export function getPendingViewState(): SharedViewState | null {
  return pendingViewState;
}
