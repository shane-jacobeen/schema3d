import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { and, eq, gt, desc, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  trackedUsers,
  userSessions,
  type UserSession,
} from "../shared/schema.js";
import { botPatterns } from "./constants.js";
import { setCorsHeaders } from "./utils.js";

/**
 * Check if the request is from a bot, crawler, or automated system
 */
function isBotOrAutomated(userAgent: string, req: VercelRequest): boolean {
  if (!userAgent) {
    // No user agent - likely automated
    return true;
  }

  const ua = userAgent.toLowerCase();

  // Check against bot patterns
  for (const pattern of botPatterns) {
    if (pattern.test(ua)) {
      return true;
    }
  }

  // Check for suspiciously short or empty user agents
  if (ua.length < 10) {
    return true;
  }

  // Check for common health check paths or headers
  const requestPath = req.url || "";
  if (
    requestPath.includes("/health") ||
    requestPath.includes("/ping") ||
    requestPath.includes("/status")
  ) {
    return true;
  }

  // Check for common monitoring headers
  const monitoringHeaders = [
    req.headers["x-vercel-monitoring"],
    req.headers["x-vercel-debug"],
    req.headers["x-health-check"],
    // Note: x-vercel-id, x-vercel-ip, x-vercel-deployment-url are injected by Vercel
    // on ALL real user requests through the edge network — NOT monitoring indicators.
    req.headers["x-vercel-signature"],
  ];

  if (monitoringHeaders.some((h) => h !== undefined)) {
    return true;
  }

  // Check for Vercel internal IPs (common ranges)
  const forwardedFor = req.headers["x-forwarded-for"] || "";
  const realIp = req.headers["x-real-ip"] || "";
  const forwardedForStr = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor;
  const realIpStr = Array.isArray(realIp) ? realIp[0] : realIp;
  const ip: string =
    (typeof forwardedForStr === "string"
      ? forwardedForStr.split(",")[0]
      : "") || (typeof realIpStr === "string" ? realIpStr : "");

  // Vercel internal IPs often start with specific patterns
  // Also check if IP is localhost or internal
  if (
    ip &&
    (ip.startsWith("127.") ||
      ip.startsWith("::1") ||
      ip === "localhost" ||
      ip.startsWith("10.") ||
      ip.startsWith("172.16.") ||
      ip.startsWith("192.168."))
  ) {
    // Check if this is likely Vercel's internal check
    // Vercel status checks often come from internal IPs without proper User-Agent
    if (!userAgent || userAgent.length < 20) {
      return true;
    }
  }

  // Check for requests that look like health checks (no referer, specific paths)
  const referer = req.headers["referer"] || req.headers["referrer"] || "";

  // Check for missing browser headers (real browsers send these)
  // But note: fetch() requests from JavaScript may not include all headers
  const accept = Array.isArray(req.headers["accept"])
    ? req.headers["accept"][0]
    : req.headers["accept"] || "";
  const acceptLanguage = Array.isArray(req.headers["accept-language"])
    ? req.headers["accept-language"][0]
    : req.headers["accept-language"] || "";
  const _acceptEncoding = Array.isArray(req.headers["accept-encoding"])
    ? req.headers["accept-encoding"][0]
    : req.headers["accept-encoding"] || "";

  // Only flag as bot if BOTH conditions are true:
  // 1. Missing typical browser headers AND
  // 2. No User-Agent or suspiciously short User-Agent AND
  // 3. No Content-Type header (fetch requests include this)
  const contentType = req.headers["content-type"] || "";
  const hasJsonContent = contentType.includes("application/json");

  // If missing typical browser headers and no User-Agent or suspicious User-Agent
  // BUT allow if it has JSON content (likely a legitimate fetch request)
  if (
    (!accept || !acceptLanguage) &&
    (!userAgent || userAgent.length < 20) &&
    !hasJsonContent
  ) {
    return true;
  }

  // Don't block API requests just because they lack a referer
  // Fetch requests often don't include referer headers
  // Only block if it's clearly suspicious (no User-Agent AND no Content-Type)
  if (!referer && requestPath.startsWith("/api/")) {
    if (!userAgent && !contentType) {
      return true;
    }
  }

  // Additional check: Vercel status checks often have specific patterns
  // Check if request has Vercel-specific characteristics but no browser-like User-Agent
  const hasVercelHeaders = monitoringHeaders.some((h) => h !== undefined);
  if (hasVercelHeaders && (!userAgent || userAgent.length < 20)) {
    return true;
  }

  return false;
}

// Initialize database connection
function getDb() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    const error = "DATABASE_URL or POSTGRES_URL must be set";
    console.error(error);
    throw new Error(error);
  }

  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema: { trackedUsers, userSessions } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  setCorsHeaders(req, res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check if this is an automated request (bot, crawler, health check, etc.)
  const userAgent = req.headers["user-agent"] || "";
  const contentType = req.headers["content-type"] || "";
  const hasJsonContent = contentType.includes("application/json");

  // Allow requests with JSON content (legitimate fetch requests) to bypass some checks
  // Fetch requests from JavaScript may not have all browser headers but will have Content-Type
  const isAutomatedRequest = hasJsonContent
    ? false
    : isBotOrAutomated(userAgent, req);

  if (isAutomatedRequest) {
    console.warn("Ignoring automated request:", {
      userAgent: userAgent || "(empty)",
      url: req.url,
      method: req.method,
      contentType: contentType || "(empty)",
      headers: {
        "x-vercel-monitoring": req.headers["x-vercel-monitoring"],
        "x-vercel-debug": req.headers["x-vercel-debug"],
        "x-vercel-id": req.headers["x-vercel-id"],
        "x-forwarded-for": req.headers["x-forwarded-for"],
        referer: req.headers["referer"],
      },
    });
    return res.status(200).json({
      userId: null,
      stats: {
        uniqueUsers: 0,
        activeConnections: 0,
      },
      ignored: true,
    });
  }

  try {
    // Parse request body if it's a string
    let body = req.body;
    if (typeof body === "string" && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error("Failed to parse body as JSON:", e);
      }
    }

    // Parse cookies manually if req.cookies is not available
    let cookieUserId: string | null = null;
    if (req.cookies?.userId) {
      cookieUserId = req.cookies.userId;
    } else if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(";");
      const userIdCookie = cookies.find((c) => c.trim().startsWith("userId="));
      if (userIdCookie) {
        cookieUserId = userIdCookie.split("=")[1].trim();
      }
    }

    // Extract browser info and initialize database
    const browserInfo = body?.browserInfo || {};
    const userAgent = req.headers["user-agent"] || browserInfo.userAgent || "";
    const db = getDb();

    // Determine userId: cookie (authoritative) > body userId > generate new
    // Cookie takes precedence to prevent desync between client and server
    let id = cookieUserId || body?.userId || null;

    // If no userId, check for recent sessions to prevent duplicate users from concurrent requests.
    // Use a 30-second window (vs old 5s) and order by most recent — this handles parallel
    // serverless invocations that all arrive before any prior response has been committed.
    if (!id) {
      try {
        const thirtySecondsAgo = new Date(Date.now() - 30000);

        const recentCandidates = await db
          .select({ userId: userSessions.userId })
          .from(userSessions)
          .where(
            and(
              gt(userSessions.sessionStart, thirtySecondsAgo),
              eq(userSessions.userAgent, userAgent)
            )
          )
          .orderBy(desc(userSessions.sessionStart))
          .limit(1);

        id = recentCandidates[0]?.userId || randomUUID();
      } catch {
        id = randomUUID();
      }
    }

    // Upsert user - atomically insert or update to prevent race conditions
    await db
      .insert(trackedUsers)
      .values({
        userId: id,
        firstSeen: new Date(),
        lastSeen: new Date(),
      })
      .onConflictDoUpdate({
        target: trackedUsers.userId,
        set: { lastSeen: new Date() },
      });

    // Helper function to generate new sessionId
    const generateSessionId = () =>
      `${id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Server-side sessionId management
    const now = new Date();
    const clientSessionId = browserInfo.sessionId?.trim() || null;
    let sessionId: string;
    let existingSession: UserSession[] = [];

    if (clientSessionId) {
      // Try to find active session with exact match
      existingSession = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.userId, id),
            eq(userSessions.sessionId, clientSessionId),
            isNull(userSessions.sessionEnd)
          )
        )
        .limit(1);

      // If not found and old-format (no userId prefix), try to migrate
      if (
        existingSession.length === 0 &&
        !clientSessionId.startsWith(`${id}-`)
      ) {
        const oldSession = await db
          .select()
          .from(userSessions)
          .where(
            and(
              eq(userSessions.sessionId, clientSessionId),
              isNull(userSessions.sessionEnd)
            )
          )
          .limit(1);

        if (oldSession.length > 0) {
          // Migrate old-format sessionId to new format
          sessionId = `${id}-${clientSessionId}`;
          await db
            .update(userSessions)
            .set({ sessionId, userId: id })
            .where(eq(userSessions.id, oldSession[0].id));
          existingSession = [{ ...oldSession[0], sessionId, userId: id }];
        } else {
          // Old-format sessionId not found - generate new one
          sessionId = generateSessionId();
        }
      } else if (existingSession.length === 0) {
        // SessionId not found - generate new one
        sessionId = generateSessionId();
      } else {
        sessionId = clientSessionId;
      }
    } else {
      // No client sessionId - find most recent active session or generate new
      const recent = await db
        .select()
        .from(userSessions)
        .where(
          and(eq(userSessions.userId, id), isNull(userSessions.sessionEnd))
        )
        .orderBy(desc(userSessions.lastActivity))
        .limit(1);

      if (recent.length > 0) {
        sessionId = recent[0].sessionId;
        existingSession = [recent[0]];
      } else {
        sessionId = generateSessionId();
      }
    }

    // Prepare session data
    const entryUrl =
      req.headers.referer ||
      req.headers.origin ||
      browserInfo.referrer ||
      "direct";
    const sessionData = {
      userId: id,
      sessionId,
      lastActivity: now,
      referrer: browserInfo.referrer || null,
      entryUrl,
      userAgent: userAgent || null,
      browser: browserInfo.browser || null,
      browserVersion: browserInfo.browserVersion || null,
      os: browserInfo.os || null,
      osVersion: browserInfo.osVersion || null,
      device: browserInfo.device || null,
      screenWidth: browserInfo.screenWidth || null,
      screenHeight: browserInfo.screenHeight || null,
      language: browserInfo.language || null,
      timezone: browserInfo.timezone || null,
      country:
        req.headers["x-vercel-ip-country"] ||
        req.headers["cf-ipcountry"] ||
        browserInfo.country ||
        null,
      region:
        req.headers["x-vercel-ip-country-region"] || browserInfo.region || null,
      city: req.headers["x-vercel-ip-city"] || browserInfo.city || null,
    };

    if (existingSession.length === 0) {
      // New session - create session record.
      // ON CONFLICT on session_id: if a concurrent request already inserted this session
      // (race condition within milliseconds), treat it as an update instead of a duplicate.
      await db
        .insert(userSessions)
        .values({
          ...sessionData,
          sessionStart: now,
        })
        .onConflictDoUpdate({
          target: userSessions.sessionId,
          set: { lastActivity: now },
        });
    } else {
      // Check if existing session is stale (inactive for 5+ minutes)
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const lastActivity = new Date(existingSession[0].lastActivity);

      if (lastActivity < fiveMinutesAgo) {
        // Session is stale - end it and create a new one
        const durationSeconds = Math.floor(
          (lastActivity.getTime() -
            new Date(existingSession[0].sessionStart).getTime()) /
            1000
        );

        // End the stale session
        await db
          .update(userSessions)
          .set({
            sessionEnd: lastActivity,
            durationSeconds: durationSeconds,
          })
          .where(
            and(
              eq(userSessions.userId, id),
              eq(userSessions.sessionId, sessionId)
            )
          );

        // Create a new session (stale session was closed above).
        // ON CONFLICT on session_id: same concurrent-request guard as above.
        sessionId = generateSessionId();
        await db
          .insert(userSessions)
          .values({
            ...sessionData,
            sessionId,
            sessionStart: now,
          })
          .onConflictDoUpdate({
            target: userSessions.sessionId,
            set: { lastActivity: now },
          });
      } else {
        // Session is still active - update last activity (resets the 5-minute timer)
        await db
          .update(userSessions)
          .set({
            ...sessionData,
          })
          .where(
            and(
              eq(userSessions.userId, id),
              eq(userSessions.sessionId, sessionId)
            )
          );
      }
    }

    // Always set/update cookie with the final userId being used
    // This ensures client and server stay in sync
    // (non-HttpOnly so client can read it)
    res.setHeader(
      "Set-Cookie",
      `userId=${id}; Path=/; Max-Age=${
        365 * 24 * 60 * 60
      }; SameSite=Lax; Secure`
    );

    return res.status(200).json({
      userId: id,
      sessionId: sessionId, // Return the sessionId (may be new if previous was ended)
    });
  } catch (error) {
    console.error("Failed to track interaction:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return res.status(500).json({
      error: "Failed to track interaction",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
