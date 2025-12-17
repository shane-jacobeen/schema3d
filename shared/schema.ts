import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

// User tracking table for persistent storage
// Note: Browser-specific data is tracked in user_sessions table, not here
// This table only tracks user-level data (userId, firstSeen, lastSeen)
export const trackedUsers = pgTable("tracked_users", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  firstSeen: timestamp("first_seen").notNull().defaultNow(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
});

export type TrackedUser = typeof trackedUsers.$inferSelect;
export type InsertTrackedUser = typeof trackedUsers.$inferInsert;

// User sessions table for tracking individual sessions
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // References trackedUsers.userId
  sessionId: text("session_id").notNull(),
  sessionStart: timestamp("session_start").notNull().defaultNow(),
  sessionEnd: timestamp("session_end"),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  // Session metadata
  referrer: text("referrer"),
  entryUrl: text("entry_url"),
  // Browser and device info for this session
  userAgent: text("user_agent"),
  browser: text("browser"),
  browserVersion: text("browser_version"),
  os: text("os"),
  osVersion: text("os_version"),
  device: text("device"),
  screenWidth: integer("screen_width"),
  screenHeight: integer("screen_height"),
  language: text("language"),
  timezone: text("timezone"),
  country: text("country"),
  region: text("region"),
  city: text("city"),
  // Session metrics
  durationSeconds: integer("duration_seconds"), // Calculated when session ends
  schemaChanges: integer("schema_changes").default(0), // Number of times user changed schema
  schemaUploads: integer("schema_uploads").default(0), // Number of times user uploaded SQL file
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;
