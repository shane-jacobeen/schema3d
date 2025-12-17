import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { trackedUsers } from "@shared/schema";

export interface TrackingStats {
  uniqueUsers: number;
  activeConnections: number;
}

class UserTracker {
  private uniqueUsersCount: number = 0;
  private initialized: boolean = false;

  /**
   * Initialize tracker by loading user count from database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const db = getDb();
      const result = await db
        .select({ count: trackedUsers.id })
        .from(trackedUsers);
      this.uniqueUsersCount = result.length;
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize user tracker:", error);
      // Continue with in-memory tracking if DB fails
      this.initialized = true;
    }
  }

  /**
   * Register a new user interaction
   * Returns a user ID (from cookie or generates new one)
   */
  async registerUser(userId?: string): Promise<string> {
    await this.initialize();

    const id = userId || randomUUID();

    try {
      const db = getDb();
      const existing = await db
        .select()
        .from(trackedUsers)
        .where(eq(trackedUsers.userId, id))
        .limit(1);

      if (existing.length === 0) {
        // New user - insert into database
        await db.insert(trackedUsers).values({
          userId: id,
          firstSeen: new Date(),
          lastSeen: new Date(),
        });
        this.uniqueUsersCount++;
      } else {
        // Existing user - update lastSeen
        await db
          .update(trackedUsers)
          .set({ lastSeen: new Date() })
          .where(eq(trackedUsers.userId, id));
      }
    } catch (error) {
      console.error("Failed to register user in database:", error);
      // Continue tracking in memory if DB fails
    }

    return id;
  }

  /**
   * Get current statistics
   */
  async getStats(): Promise<TrackingStats> {
    await this.initialize();

    // Refresh count from database periodically (every call for accuracy)
    try {
      const db = getDb();
      const result = await db
        .select({ count: trackedUsers.id })
        .from(trackedUsers);
      this.uniqueUsersCount = result.length;
    } catch (error) {
      // Use cached count if DB query fails
      console.error("Failed to refresh user count:", error);
    }

    // Note: activeConnections is calculated from database in production (api/stats.ts)
    // For dev server, return 0 as it's not tracked here
    return {
      uniqueUsers: this.uniqueUsersCount,
      activeConnections: 0,
    };
  }
}

export const userTracker = new UserTracker();
