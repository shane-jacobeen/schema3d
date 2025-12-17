import { useState, useEffect, useRef } from "react";
import { Users, Activity } from "lucide-react";
import { collectBrowserInfo } from "@/shared/utils/browser-info";
import {
  trackInteraction as trackInteractionApi,
  fetchStats,
  endSession as endSessionApi,
} from "@/shared/utils/api";

interface StatsDisplayProps {
  className?: string;
}

interface Stats {
  uniqueUsers: number;
  activeConnections: number;
}

export function StatsDisplay({ className = "" }: StatsDisplayProps) {
  const [stats, setStats] = useState<Stats>({
    uniqueUsers: 0,
    activeConnections: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const sessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const trackInteractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTrackedOnceRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize sessionIdRef from storage on mount (if available)
    // This allows us to check if we've tracked before
    try {
      const storedSessionId =
        sessionStorage.getItem("schema3d_sessionId") ||
        localStorage.getItem("schema3d_sessionId");
      if (storedSessionId) {
        sessionIdRef.current = storedSessionId;
        hasTrackedOnceRef.current = true;
      }
    } catch (_e) {
      // Storage not available
    }

    // Track user interaction - fires 10 seconds after last interaction (debounced)
    // Always tracks - server will handle session lifecycle (ending stale sessions, starting new ones)
    const trackInteraction = async () => {
      try {
        // Collect browser information (sessionId management is handled by server)
        const browserInfo = collectBrowserInfo();

        const data = await trackInteractionApi(browserInfo, true);

        if (data) {
          if (data.userId) {
            userIdRef.current = data.userId;
          }
          if (data.sessionId) {
            sessionIdRef.current = data.sessionId;
            hasTrackedOnceRef.current = true;
          }
        }
      } catch (error) {
        console.error("Failed to track interaction:", error);
      }
    };

    // Schedule tracking 10 seconds after last interaction (debounced)
    const scheduleTrackInteraction = () => {
      // Clear any existing timeout
      if (trackInteractionTimeoutRef.current) {
        clearTimeout(trackInteractionTimeoutRef.current);
      }

      // Schedule tracking 10 seconds from now
      trackInteractionTimeoutRef.current = setTimeout(() => {
        trackInteraction();
        trackInteractionTimeoutRef.current = null;
      }, 10000);
    };

    // Track user interaction events - only intentional interactions
    const handleUserInteraction = () => {
      // If this is the first interaction (never tracked before), track it immediately
      if (!hasTrackedOnceRef.current) {
        hasTrackedOnceRef.current = true; // Set flag immediately to prevent multiple calls
        trackInteraction().then(() => {
          // Also fetch stats on initial interaction
          fetchStatsData();
        });
      } else {
        // For subsequent interactions, schedule tracking 10 seconds from now (debounced)
        // Each interaction resets the timer
        scheduleTrackInteraction();
      }
    };

    // Track scroll events but only if significant scroll AND user-initiated
    let lastScrollTime = 0;
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const now = Date.now();
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);

      if (
        now - lastScrollTime > 2000 &&
        scrollDelta > 100 &&
        sessionIdRef.current
      ) {
        lastScrollTime = now;
        lastScrollY = currentScrollY;
        handleUserInteraction();
      }
    };

    // Track wheel events but only if significant movement AND user-initiated
    let lastWheelTime = 0;
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (
        Math.abs(e.deltaY) > 20 &&
        now - lastWheelTime > 2000 &&
        sessionIdRef.current
      ) {
        lastWheelTime = now;
        handleUserInteraction();
      }
    };

    // Only track intentional user interactions
    // Removed: scroll, mousemove, wheel (can fire automatically)
    // Kept: click, keydown, keypress, touchstart (require intentional user action)
    const interactionEvents = ["click", "keydown", "keypress", "touchstart"];

    // Add listeners for intentional interactions
    interactionEvents.forEach((event) => {
      document.addEventListener(event, handleUserInteraction, {
        passive: true,
      });
    });

    // Add scroll and wheel listeners with throttling and thresholds
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });

    // Fetch stats via HTTP (WebSocket not supported in Vercel serverless)
    const fetchStatsData = async () => {
      try {
        const data = await fetchStats();
        if (data) {
          setStats(data);
          setIsLoading(false); // Mark as loaded after first successful fetch
        } else {
          setIsLoading(false); // Mark as loaded even on error to stop showing loading state
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setIsLoading(false); // Mark as loaded even on error to stop showing loading state
      }
    };

    // Initial fetch
    fetchStatsData();

    // Poll for stats updates every 10 seconds
    // Pause polling when page is hidden to reduce unnecessary API calls
    let statsInterval: NodeJS.Timeout | null = null;

    const startStatsPolling = () => {
      if (statsInterval) return; // Already polling
      statsInterval = setInterval(fetchStatsData, 10000);
    };

    const stopStatsPolling = () => {
      if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
      }
    };

    // Start polling initially
    startStatsPolling();

    // Pause polling when page is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopStatsPolling();
      } else {
        // Resume polling and fetch immediately when page becomes visible
        fetchStatsData();
        startStatsPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Function to end the current session
    const endSession = (clearSessionId = false) => {
      const userId = userIdRef.current;
      let sessionId = sessionIdRef.current;

      if (!sessionId) {
        try {
          sessionId =
            sessionStorage.getItem("schema3d_sessionId") ||
            localStorage.getItem("schema3d_sessionId");
        } catch (_e) {
          // Storage not available
        }
      }
      if (!sessionId) {
        try {
          sessionId =
            sessionStorage.getItem("schema3d_sessionId") ||
            localStorage.getItem("schema3d_sessionId");
        } catch (_e) {
          // Storage not available
        }
      }

      if (!userId || !sessionId) {
        return; // No session to end
      }

      // Use sendBeacon for reliable delivery even if page is closing
      // Use URLSearchParams for better compatibility with Vercel serverless functions
      endSessionApi(userId, sessionId);

      // If clearing sessionId (e.g., on tab close), remove it from storage
      // This prevents reusing ended sessionIds - server will generate a new one on next interaction
      if (clearSessionId) {
        try {
          sessionStorage.removeItem("schema3d_sessionId");
          localStorage.removeItem("schema3d_sessionId");
          sessionIdRef.current = null;
        } catch (_e) {
          // Ignore storage errors
        }
      }
    };

    // Track when page is about to unload (user closes tab/window, navigates away)
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        endSession(true); // Clear sessionId from storage
      }
    };

    // Track when page is hidden/unloaded (more reliable than beforeunload on mobile)
    const handlePageHide = (event: PageTransitionEvent) => {
      if (sessionIdRef.current && !event.persisted) {
        endSession(true); // Clear sessionId from storage
      }
    };

    // Add event listeners for session end detection
    // Use pagehide as primary (most reliable), beforeunload as backup
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      // Clear tracking timeout
      if (trackInteractionTimeoutRef.current) {
        clearTimeout(trackInteractionTimeoutRef.current);
      }
      stopStatsPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // End session on component unmount (e.g., route change)
      if (sessionIdRef.current) {
        endSession();
      }

      // Remove event listeners
      interactionEvents.forEach((event) => {
        document.removeEventListener(event, handleUserInteraction);
      });
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  // Pulsing ellipsis component for loading state with sequential dot animation
  const PulsingEllipsisContent = (
    <span className="font-medium inline-flex items-center gap-0.5">
      <span
        className="inline-block w-1 h-1 rounded-full bg-current animate-pulse"
        style={{ animationDelay: "0ms", animationDuration: "1.4s" }}
      />
      <span
        className="inline-block w-1 h-1 rounded-full bg-current animate-pulse"
        style={{ animationDelay: "200ms", animationDuration: "1.4s" }}
      />
      <span
        className="inline-block w-1 h-1 rounded-full bg-current animate-pulse"
        style={{ animationDelay: "400ms", animationDuration: "1.4s" }}
      />
    </span>
  );

  return (
    <div
      className={`flex items-center gap-4 text-xs sm:text-sm text-slate-300 ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
        {isLoading ? (
          PulsingEllipsisContent
        ) : (
          <span className="font-medium">
            {stats.uniqueUsers.toLocaleString()}
          </span>
        )}
        <span className="text-slate-400 hidden sm:inline">visitors</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" />
        {isLoading ? (
          PulsingEllipsisContent
        ) : (
          <span className="font-medium">
            {stats.activeConnections.toLocaleString()}
          </span>
        )}
        <span className="text-slate-400 hidden sm:inline">active</span>
      </div>
    </div>
  );
}
