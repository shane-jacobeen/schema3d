import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  const server = await registerRoutes(app);

  app.use(
    (
      err: Error & { status?: number; statusCode?: number },
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    }
  );

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on port 3000 (or PORT env var)
  // this serves both the API and the client
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
