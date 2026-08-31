import { Component, type ErrorInfo, type ReactNode } from "react";
import posthog from "posthog-js";
import { ChunkLoadFallback } from "./chunk-load-fallback";

interface ChunkLoadErrorBoundaryProps {
  children: ReactNode;
}

interface ChunkLoadErrorBoundaryState {
  error: Error | null;
}

const RELOAD_KEY = "schema3d:chunk-reload-at";
const RELOAD_WINDOW_MS = 10_000;

/**
 * Match the errors a browser throws when a lazy route chunk fails to load. A
 * stale client asks for a hashed chunk that a newer deploy removed. The missing
 * chunk 404s, and if the server answers with HTML the `nosniff` header rejects
 * it as an invalid module MIME type. Both cases fail here.
 */
function isChunkLoadError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("dynamically imported module") ||
    message.includes("valid javascript mime type") ||
    message.includes("importing a module script failed")
  );
}

/** True when this session already reloaded for a chunk error just now. */
function recentlyReloaded(): boolean {
  try {
    const at = Number(sessionStorage.getItem(RELOAD_KEY));
    return at > 0 && Date.now() - at < RELOAD_WINDOW_MS;
  } catch {
    return false;
  }
}

/** Record a reload attempt. Returns false when storage is blocked. */
function markReloaded(): boolean {
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

/**
 * Catch the failure of a lazy route chunk and reload once so the stale client
 * fetches the current index.html and its chunk hashes. Without this boundary the
 * throw escapes to the app root and the user sees a blank dark page. Non-chunk
 * errors are re-thrown so they reach another boundary.
 */
export class ChunkLoadErrorBoundary extends Component<
  ChunkLoadErrorBoundaryProps,
  ChunkLoadErrorBoundaryState
> {
  state: ChunkLoadErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ChunkLoadErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (!isChunkLoadError(error)) {
      return;
    }

    posthog.captureException(error, {
      source: "chunk-load-error-boundary",
      componentStack: info.componentStack,
    });

    // Reload once. The timestamp stops an infinite reload if the chunk stays
    // broken, but expires so a later deploy can reload again.
    if (!recentlyReloaded() && markReloaded()) {
      window.location.reload();
    }
  }

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }
    if (!isChunkLoadError(error)) {
      throw error;
    }
    return <ChunkLoadFallback detail={error.message} />;
  }
}
