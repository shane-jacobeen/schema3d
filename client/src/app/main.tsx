import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { PostHogProvider } from "posthog-js/react";
import App from "./App";
import "../index.css";

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
// Production sends events same-origin through the /ingest reverse proxy (see
// vercel.json). A same-origin path stops PostHog's remote assets from being
// cross-origin, so a failure in them arrives with a real stack instead of an
// opaque "Script error.", and capture keeps working behind ad blockers. The dev
// server has no proxy, so it talks to PostHog directly.
const posthogApiHost = import.meta.env.PROD
  ? "/ingest"
  : (import.meta.env.VITE_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com");

const app = (
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

createRoot(document.getElementById("root")!).render(
  posthogKey ? (
    <PostHogProvider
      apiKey={posthogKey}
      options={{
        api_host: posthogApiHost,
        ui_host: "https://us.posthog.com",
        defaults: "2025-05-24",
        capture_exceptions: true,
        debug: import.meta.env.MODE === "development",
      }}
    >
      {app}
    </PostHogProvider>
  ) : (
    app
  )
);
