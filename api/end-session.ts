import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { and, eq, isNull } from "drizzle-orm";
import { userSessions } from "../shared/schema.js";
import { setCorsHeaders } from "./utils.js";

// Initialize database connection
function getDb() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL or POSTGRES_URL must be set");
  }

  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema: { userSessions } });
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

  try {
    const db = getDb();

    // Parse request body - handle URLSearchParams (from sendBeacon), JSON, or Buffer
    let body: { userId?: string; sessionId?: string };
    const contentType = req.headers["content-type"] || "";

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      (typeof req.body === "string" && req.body.includes("userId="))
    ) {
      // URL-encoded form data (from sendBeacon)
      const bodyString = Buffer.isBuffer(req.body)
        ? req.body.toString()
        : typeof req.body === "string"
          ? req.body
          : "";
      if (bodyString) {
        const params = new URLSearchParams(bodyString);
        body = {
          userId: params.get("userId") || undefined,
          sessionId: params.get("sessionId") || undefined,
        };
      } else if (
        req.body &&
        typeof req.body === "object" &&
        !Buffer.isBuffer(req.body)
      ) {
        // Vercel already parsed it
        body = req.body as { userId?: string; sessionId?: string };
      } else {
        return res.status(400).json({ error: "Invalid request body format" });
      }
    } else if (Buffer.isBuffer(req.body) || typeof req.body === "string") {
      // JSON body as Buffer or string
      try {
        body = JSON.parse(
          Buffer.isBuffer(req.body) ? req.body.toString() : req.body
        );
      } catch (_e) {
        return res.status(400).json({ error: "Invalid request body format" });
      }
    } else if (req.body && typeof req.body === "object") {
      // Regular JSON body or parsed object
      body = req.body as { userId?: string; sessionId?: string };
    } else {
      return res.status(400).json({ error: "Invalid request body" });
    }

    if (!body.userId || !body.sessionId) {
      return res
        .status(400)
        .json({ error: "userId and sessionId are required" });
    }

    // Find active session (combine queries - check if session exists and is active in one query)
    const activeSession = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, body.userId),
          eq(userSessions.sessionId, body.sessionId),
          isNull(userSessions.sessionEnd)
        )
      )
      .limit(1);

    if (activeSession.length === 0) {
      // Check if session exists but is ended
      const endedSession = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.userId, body.userId),
            eq(userSessions.sessionId, body.sessionId)
          )
        )
        .limit(1);

      if (endedSession.length > 0) {
        return res.status(200).json({
          message: "Session already ended",
          alreadyEnded: true,
          sessionEnd: endedSession[0].sessionEnd,
          durationSeconds: endedSession[0].durationSeconds,
        });
      }
      return res.status(200).json({ message: "Session not found" });
    }

    const session = activeSession[0];
    const now = new Date();
    const durationSeconds = Math.floor(
      (now.getTime() - new Date(session.sessionStart).getTime()) / 1000
    );

    // Update session with end time and duration
    await db
      .update(userSessions)
      .set({
        sessionEnd: now,
        durationSeconds: durationSeconds,
      })
      .where(
        and(
          eq(userSessions.userId, body.userId),
          eq(userSessions.sessionId, body.sessionId)
        )
      );

    return res.status(200).json({
      message: "Session ended successfully",
      durationSeconds,
    });
  } catch (error) {
    console.error("Failed to end session:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to end session",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
