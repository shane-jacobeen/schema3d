import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { PostHogProvider } from "posthog-js/react";
import App from "./App";
import "../index.css";

createRoot(document.getElementById("root")!).render(
  <PostHogProvider
    apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
    options={{
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
      defaults: "2025-05-24",
      capture_exceptions: true,
      debug: import.meta.env.MODE === "development",
    }}
  >
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </PostHogProvider>
);
