import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { and, eq, isNull, lt } from "drizzle-orm";
import { userSessions } from "../shared/schema.js";

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
  // Check authorization for cron jobs
  // Vercel adds CRON_SECRET to the Authorization header for cron job invocations
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).end("Unauthorized");
  }

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = getDb();

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find all sessions that:
    // 1. Have no session_end (null)
    // 2. Have last_activity older than 24 hours
    const staleSessions = await db
      .select()
      .from(userSessions)
      .where(
        and(
          isNull(userSessions.sessionEnd),
          lt(userSessions.lastActivity, twentyFourHoursAgo)
        )
      );

    if (staleSessions.length === 0) {
      return res.status(200).json({
        message: "No stale sessions found",
        cleaned: 0,
      });
    }

    // Update each stale session to set session_end = last_activity
    // and calculate duration_seconds
    let cleanedCount = 0;
    for (const session of staleSessions) {
      const durationSeconds = Math.floor(
        (new Date(session.lastActivity).getTime() -
          new Date(session.sessionStart).getTime()) /
          1000
      );

      await db
        .update(userSessions)
        .set({
          sessionEnd: session.lastActivity, // Set to last_activity timestamp
          durationSeconds: durationSeconds,
        })
        .where(
          and(
            eq(userSessions.userId, session.userId),
            eq(userSessions.sessionId, session.sessionId)
          )
        );

      cleanedCount++;
    }

    return res.status(200).json({
      message: `Cleaned up ${cleanedCount} stale session(s)`,
      cleaned: cleanedCount,
    });
  } catch (error) {
    console.error("Failed to cleanup stale sessions:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return res.status(500).json({
      error: "Failed to cleanup stale sessions",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
