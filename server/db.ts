import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Node.js environment
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

let db: ReturnType<typeof drizzle> | null = null;
let dbWarningShown = false;

export function getDb(): ReturnType<typeof drizzle> | null {
  if (!db) {
    // Support both Vercel Postgres (POSTGRES_URL) and custom DATABASE_URL
    const connectionString =
      process.env.POSTGRES_URL || process.env.DATABASE_URL;

    if (!connectionString) {
      if (!dbWarningShown) {
        console.warn(
          "Database connection string not found. User tracking disabled. Set POSTGRES_URL or DATABASE_URL to enable."
        );
        dbWarningShown = true;
      }
      return null;
    }

    const pool = new Pool({ connectionString });
    db = drizzle(pool, { schema });
  }

  return db;
}
