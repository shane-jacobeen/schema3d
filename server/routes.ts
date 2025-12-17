import type { Express } from "express";
import { createServer, type Server } from "http";
import { userTracker } from "./tracking";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Tracking API endpoints
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await userTracker.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get stats:", error);
      res.status(500).json({ error: "Failed to retrieve stats" });
    }
  });

  // Register user interaction endpoint
  app.post("/api/track-interaction", async (req, res) => {
    try {
      const userId = req.body.userId || (req.cookies && req.cookies.userId);
      const newUserId = await userTracker.registerUser(userId);

      // Set cookie if not present
      if (!userId) {
        res.cookie("userId", newUserId, {
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
          httpOnly: false, // Allow client-side access
          sameSite: "lax",
        });
      }

      const stats = await userTracker.getStats();
      res.json({ userId: newUserId, stats });
    } catch (error) {
      console.error("Failed to track interaction:", error);
      res.status(500).json({ error: "Failed to track interaction" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
