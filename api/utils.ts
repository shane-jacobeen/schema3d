import type { VercelRequest, VercelResponse } from "@vercel/node";

export function setCorsHeaders(
  req: VercelRequest,
  res: VercelResponse,
  allowedMethods: string
) {
  const origin = req.headers.origin;

  // 1. Echo the exact origin if it exists (required for credentials)
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    // Fallback for non-browser/same-origin requests where Origin isn't sent
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  // 2. Set the allowed methods for this specific route
  res.setHeader("Access-Control-Allow-Methods", allowedMethods);

  // 3. Allow standard headers
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
