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
    // Parse request body
    let body = req.body;
    if (typeof body === "string" && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error("Failed to parse body as JSON:", e);
      }
    }

    const { userId, sessionId, action } = body || {};

    if (!userId || !sessionId || !action) {
      return res.status(400).json({
        error: "userId, sessionId, and action are required",
      });
    }

    if (action !== "schema_change" && action !== "schema_upload") {
      return res.status(400).json({
        error: "action must be 'schema_change' or 'schema_upload'",
      });
    }

    const db = getDb();
    const now = new Date();

    // Find the active session
    const activeSession = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.sessionId, sessionId),
          isNull(userSessions.sessionEnd)
        )
      )
      .limit(1);

    if (activeSession.length === 0) {
      return res.status(404).json({ error: "Active session not found" });
    }

    const session = activeSession[0];
    const currentSchemaChanges = session.schemaChanges || 0;
    const currentSchemaUploads = session.schemaUploads || 0;

    // Update the appropriate counter and lastActivity
    const updateData: {
      lastActivity: Date;
      schemaChanges?: number;
      schemaUploads?: number;
    } = {
      lastActivity: now,
    };

    if (action === "schema_change") {
      updateData.schemaChanges = currentSchemaChanges + 1;
    } else if (action === "schema_upload") {
      updateData.schemaUploads = currentSchemaUploads + 1;
    }

    await db
      .update(userSessions)
      .set(updateData)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.sessionId, sessionId)
        )
      );

    return res.status(200).json({
      message: "Schema action logged successfully",
      action,
      schemaChanges:
        action === "schema_change"
          ? currentSchemaChanges + 1
          : currentSchemaChanges,
      schemaUploads:
        action === "schema_upload"
          ? currentSchemaUploads + 1
          : currentSchemaUploads,
    });
  } catch (error) {
    console.error("Failed to log schema action:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return res.status(500).json({
      error: "Failed to log schema action",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
