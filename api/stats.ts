import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { sql, gt } from "drizzle-orm";
import { trackedUsers, userSessions } from "../shared/schema.js";

// Initialize database connection
function getDb() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL or POSTGRES_URL must be set");
  }

  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema: { trackedUsers, userSessions } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = getDb();

    // Get total unique users
    const uniqueUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(trackedUsers);
    const uniqueUsers = Number(uniqueUsersResult[0]?.count) || 0;

    // Calculate active users based on active sessions (sessions with activity within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeConnectionsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${userSessions.userId})`,
      })
      .from(userSessions)
      .where(gt(userSessions.lastActivity, fiveMinutesAgo));

    // Count distinct users with active sessions
    const activeConnections = Number(activeConnectionsResult[0]?.count) || 0;

    return res.status(200).json({
      uniqueUsers,
      activeConnections,
    });
  } catch (error) {
    console.error("Failed to get stats:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return res.status(500).json({
      error: "Failed to retrieve stats",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
