/**
 * Fetch DrawDB shared diagrams via GitHub Gist.
 * DrawDB share URLs: https://drawdb.app/editor?shareId=<gistId>
 * → GET https://api.github.com/gists/{shareId} → files["share.json"].content
 */

const DRAWDB_HOSTS = new Set(["drawdb.app", "www.drawdb.app"]);

export class DrawdbShareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DrawdbShareError";
  }
}

/**
 * Extract shareId from a DrawDB editor URL, or return the input if it looks
 * like a bare gist id. Returns null if not a DrawDB share reference.
 */
export function parseDrawdbShareId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Bare gist-like id (GitHub gist ids are hex, typically 32 chars)
  if (/^[a-f0-9]{20,40}$/i.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (!DRAWDB_HOSTS.has(url.hostname.toLowerCase())) {
      return null;
    }

    const shareId =
      url.searchParams.get("shareId") || url.searchParams.get("shareid");
    if (shareId && shareId.trim()) {
      return shareId.trim();
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * True if the text looks like a DrawDB share URL (not bare JSON / SQL).
 * Bare gist ids are not treated as URLs — use {@link parseDrawdbShareId} for those.
 */
export function isDrawdbShareUrl(text: string): boolean {
  return parseDrawdbShareId(text) !== null && /drawdb\.app/i.test(text.trim());
}

type GistFile = {
  content?: string;
  truncated?: boolean;
  raw_url?: string;
};

/**
 * Fetch DrawDB diagram JSON text from a GitHub gist shareId.
 */
export async function fetchDrawdbShareJson(
  shareIdOrUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const shareId = parseDrawdbShareId(shareIdOrUrl);
  if (!shareId) {
    throw new DrawdbShareError(
      "Could not parse DrawDB share. Paste a drawdb.app link or gist ID."
    );
  }

  let response: Response;
  try {
    response = await fetchImpl(`https://api.github.com/gists/${shareId}`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });
  } catch {
    throw new DrawdbShareError(
      "Failed to reach GitHub Gists. Export JSON from DrawDB and import the file instead."
    );
  }

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new DrawdbShareError(
        "GitHub Gist rate limit reached. Try again later, or export JSON from DrawDB and import the file instead."
      );
    }
    throw new DrawdbShareError(
      `DrawDB share not found (${response.status}). Export JSON from DrawDB and import the file instead.`
    );
  }

  let payload: {
    files?: Record<string, GistFile | undefined>;
  };
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new DrawdbShareError(
      "Invalid gist response. Export JSON from DrawDB and import the file instead."
    );
  }

  const shareFile =
    payload.files?.["share.json"] ||
    payload.files?.["share.JSON"] ||
    Object.values(payload.files || {}).find(
      (f) =>
        (f?.content && f.content.trim().startsWith("{")) ||
        (f?.truncated && f.raw_url)
    );

  if (!shareFile) {
    throw new DrawdbShareError(
      "Gist has no share.json content. Export JSON from DrawDB and import the file instead."
    );
  }

  if (shareFile.truncated) {
    if (!shareFile.raw_url) {
      throw new DrawdbShareError(
        "DrawDB share is too large (gist truncated). Export JSON from DrawDB and import the file instead."
      );
    }

    let rawResponse: Response;
    try {
      rawResponse = await fetchImpl(shareFile.raw_url);
    } catch {
      throw new DrawdbShareError(
        "Failed to download full DrawDB share. Export JSON from DrawDB and import the file instead."
      );
    }

    if (!rawResponse.ok) {
      if (rawResponse.status === 403 || rawResponse.status === 429) {
        throw new DrawdbShareError(
          "GitHub Gist rate limit reached. Try again later, or export JSON from DrawDB and import the file instead."
        );
      }
      throw new DrawdbShareError(
        "DrawDB share is too large (gist truncated). Export JSON from DrawDB and import the file instead."
      );
    }

    const rawContent = await rawResponse.text();
    if (!rawContent.trim()) {
      throw new DrawdbShareError(
        "Gist has no share.json content. Export JSON from DrawDB and import the file instead."
      );
    }
    return rawContent;
  }

  const content = shareFile.content;
  if (!content || !content.trim()) {
    throw new DrawdbShareError(
      "Gist has no share.json content. Export JSON from DrawDB and import the file instead."
    );
  }

  return content;
}
