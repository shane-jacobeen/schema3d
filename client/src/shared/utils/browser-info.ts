/**
 * Collects browser and device information for user tracking
 */
export interface BrowserInfo {
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  timezone: string;
  referrer: string;
  sessionId: string;
}

/**
 * Detects browser name and version from user agent
 */
function detectBrowser(userAgent: string): { name: string; version: string } {
  const ua = userAgent.toLowerCase();

  if (ua.includes("edg")) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return { name: "Edge", version: match ? match[1] : "unknown" };
  }
  if (ua.includes("chrome") && !ua.includes("edg")) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return { name: "Chrome", version: match ? match[1] : "unknown" };
  }
  if (ua.includes("firefox")) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return { name: "Firefox", version: match ? match[1] : "unknown" };
  }
  if (ua.includes("safari") && !ua.includes("chrome")) {
    const match = userAgent.match(/Version\/(\d+)/);
    return { name: "Safari", version: match ? match[1] : "unknown" };
  }
  if (ua.includes("opera") || ua.includes("opr")) {
    const match = userAgent.match(/(?:Opera|OPR)\/(\d+)/);
    return { name: "Opera", version: match ? match[1] : "unknown" };
  }

  return { name: "Unknown", version: "unknown" };
}

/**
 * Detects OS from user agent
 */
function detectOS(userAgent: string): { name: string; version: string } {
  const ua = userAgent.toLowerCase();

  if (ua.includes("windows")) {
    if (ua.includes("windows nt 10"))
      return { name: "Windows", version: "10/11" };
    if (ua.includes("windows nt 6.3"))
      return { name: "Windows", version: "8.1" };
    if (ua.includes("windows nt 6.2")) return { name: "Windows", version: "8" };
    if (ua.includes("windows nt 6.1")) return { name: "Windows", version: "7" };
    return { name: "Windows", version: "unknown" };
  }
  if (ua.includes("mac os x") || ua.includes("macintosh")) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    return {
      name: "macOS",
      version: match ? match[1].replace("_", ".") : "unknown",
    };
  }
  if (ua.includes("linux")) {
    return { name: "Linux", version: "unknown" };
  }
  if (ua.includes("android")) {
    const match = userAgent.match(/Android (\d+(?:\.\d+)?)/);
    return { name: "Android", version: match ? match[1] : "unknown" };
  }
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    const match = userAgent.match(/OS (\d+[._]\d+)/);
    return {
      name: "iOS",
      version: match ? match[1].replace("_", ".") : "unknown",
    };
  }

  return { name: "Unknown", version: "unknown" };
}

/**
 * Detects device type from user agent and screen size
 */
function detectDevice(userAgent: string, screenWidth: number): string {
  const ua = userAgent.toLowerCase();

  if (
    ua.includes("mobile") ||
    ua.includes("iphone") ||
    ua.includes("android")
  ) {
    return "mobile";
  }
  if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet";
  }
  if (screenWidth < 768) {
    return "mobile";
  }
  if (screenWidth < 1024) {
    return "tablet";
  }
  return "desktop";
}

/**
 * Gets stored session ID from client storage
 * Returns null if not found - server will generate/manage sessionId
 * Client should use the sessionId returned by the server and store it
 */
function getStoredSessionId(): string | null {
  try {
    // Try sessionStorage first (cleared when tab closes)
    const sessionId = sessionStorage.getItem("schema3d_sessionId");
    if (sessionId) {
      return sessionId;
    }

    // Fallback to localStorage if sessionStorage is not available or cleared
    const localSessionId = localStorage.getItem("schema3d_sessionId");
    if (localSessionId) {
      // Also store in sessionStorage for this session
      try {
        sessionStorage.setItem("schema3d_sessionId", localSessionId);
      } catch (_e) {
        // sessionStorage might not be available (e.g., incognito mode)
        // Continue with localStorage only
      }
      return localSessionId;
    }

    return null;
  } catch (error) {
    // If storage fails, return null - server will handle sessionId generation
    console.warn("Failed to get sessionId from storage:", error);
    return null;
  }
}

/**
 * Collects all browser and device information
 * Note: sessionId is managed by the server - client only sends stored value (if any)
 * Server will return the authoritative sessionId which should be stored by the client
 */
export function collectBrowserInfo(): BrowserInfo {
  const userAgent = navigator.userAgent;
  const browser = detectBrowser(userAgent);
  const os = detectOS(userAgent);
  const device = detectDevice(userAgent, window.screen.width);

  // Get stored sessionId (may be null - server will handle generation/management)
  const storedSessionId = getStoredSessionId();

  return {
    userAgent,
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    device,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language || "unknown",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
    referrer: document.referrer || "direct",
    sessionId: storedSessionId || "", // Send empty string if not found - server will generate
  };
}
