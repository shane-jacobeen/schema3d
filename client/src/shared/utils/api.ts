import type { BrowserInfo } from "./browser-info";

/**
 * Get userId and sessionId from cookies/storage
 */
function getUserIdAndSessionId(): {
  userId: string | null;
  sessionId: string | null;
} {
  let userId: string | null = null;
  let sessionId: string | null = null;

  // Get userId from cookie or localStorage
  const cookies = document.cookie.split(";");
  const userIdCookie = cookies.find((c) => c.trim().startsWith("userId="));
  if (userIdCookie) {
    userId = userIdCookie.split("=")[1].trim();
  } else {
    userId = localStorage.getItem("schema3d_userId");
  }

  // Get sessionId from sessionStorage or localStorage
  sessionId =
    sessionStorage.getItem("schema3d_sessionId") ||
    localStorage.getItem("schema3d_sessionId");

  return { userId, sessionId };
}

interface TrackInteractionResponse {
  userId?: string;
  sessionId?: string;
}

const cachedIds = {
  userId: null as string | null,
  sessionId: null as string | null,
};

/**
 * Track user interaction
 * Gets userId and sessionId internally from cookies/storage
 */
export async function trackInteraction(
  browserInfo: BrowserInfo,
  hasInteraction: boolean = true
): Promise<TrackInteractionResponse | null> {
  try {
    // Priority: in-memory cache (most reliable within a tab) → cookie → localStorage
    // Memory cache is set after first successful server response and survives cookie-read
    // failures that can occur in privacy-focused browsers mid-session.
    const { userId: currentUserId } = getUserIdAndSessionId();
    const effectiveUserId = cachedIds.userId || currentUserId;

    const response = await fetch("/api/track-interaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies
      body: JSON.stringify({
        userId: effectiveUserId,
        browserInfo,
        hasInteraction,
      }),
    });

    if (response.ok) {
      const data = await response.json();

      // Update localStorage with server response
      if (data.userId) {
        cachedIds.userId = data.userId; // App-level storage
        localStorage.setItem("schema3d_userId", data.userId);
      }

      // Update sessionId from server response (server validates it's active)
      if (data.sessionId) {
        cachedIds.sessionId = data.sessionId; // App-level storage
        try {
          sessionStorage.setItem("schema3d_sessionId", data.sessionId);
          localStorage.setItem("schema3d_sessionId", data.sessionId);
        } catch (_e) {
          // Ignore storage errors
        }
      }

      return data;
    }
    return null;
  } catch (error) {
    console.error("Failed to track interaction:", error);
    return null;
  }
}

interface StatsResponse {
  uniqueUsers: number;
  activeConnections: number;
}

/**
 * Fetch usage statistics
 */
export async function fetchStats(): Promise<StatsResponse | null> {
  try {
    const response = await fetch("/api/stats", {
      credentials: "include", // Include cookies
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return null;
  }
}

/**
 * End user session
 * Uses sendBeacon when available for better reliability during page unload
 */
export function endSession(userId: string, sessionId: string): void {
  const params = new URLSearchParams();
  params.append("userId", userId);
  params.append("sessionId", sessionId);

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon("/api/end-session", params);
    if (!sent) {
      // Fallback to fetch if sendBeacon returns false
      fetch("/api/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        keepalive: true,
      }).catch(() => {
        // Silently fail - session end is best effort
      });
    }
  } else {
    // Fallback to fetch if sendBeacon is not available
    fetch("/api/end-session", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      keepalive: true,
    }).catch(() => {
      // Silently fail - session end is best effort
    });
  }
}

interface LogSchemaActionResponse {
  message: string;
  action: "schema_change" | "schema_upload";
  schemaChanges: number;
  schemaUploads: number;
}

/**
 * Log schema action (change or upload)
 */
export async function logSchemaAction(
  action: "schema_change" | "schema_upload"
): Promise<LogSchemaActionResponse | null> {
  const { userId, sessionId } = getUserIdAndSessionId();

  if (!userId || !sessionId) {
    // Silently fail if we don't have userId/sessionId
    return null;
  }

  try {
    const response = await fetch("/api/log-schema-action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        userId,
        sessionId,
        action,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    // Silently fail - logging is not critical
    console.warn("Failed to log schema action:", error);
    return null;
  }
}
