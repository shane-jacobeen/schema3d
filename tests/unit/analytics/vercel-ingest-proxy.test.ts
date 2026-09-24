import { describe, it, expect } from "vitest";
import { convertRewrites } from "@vercel/routing-utils";
import vercelConfig from "../../../vercel.json";

// Uses Vercel's own source matcher so the test sees the same strict
// trailing-slash rules as production.
const routes = convertRewrites(vercelConfig.rewrites);

function resolveRewrite(path: string): string | undefined {
  for (const route of routes) {
    const match = route.src ? new RegExp(route.src).exec(path) : null;
    if (match && route.dest) {
      return route.dest.replace(/\$(\d+)/g, (_, i) => match[Number(i)] ?? "");
    }
  }
  return undefined;
}

describe("vercel /ingest proxy", () => {
  it.each([
    ["/ingest/e/", "https://us.i.posthog.com/e/"],
    ["/ingest/i/v0/e/", "https://us.i.posthog.com/i/v0/e/"],
    ["/ingest/s/", "https://us.i.posthog.com/s/"],
    ["/ingest/flags/", "https://us.i.posthog.com/flags/"],
    [
      "/ingest/array/phc_token/config.js",
      "https://us.i.posthog.com/array/phc_token/config.js",
    ],
    [
      "/ingest/static/array.js",
      "https://us-assets.i.posthog.com/static/array.js",
    ],
  ])("forwards %s to PostHog", (path, destination) => {
    expect(resolveRewrite(path)).toBe(destination);
  });

  it("keeps the SPA fallback for app routes", () => {
    expect(resolveRewrite("/about")).toBe("/index.html");
  });
});
