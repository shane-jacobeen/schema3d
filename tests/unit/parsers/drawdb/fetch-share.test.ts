import { describe, it, expect, vi, afterEach } from "vitest";
import {
  parseDrawdbShareId,
  isDrawdbShareUrl,
  fetchDrawdbShareJson,
  DrawdbShareError,
} from "@/schemas/parsers/drawdb";

describe("parseDrawdbShareId", () => {
  it("parses drawdb.app and www share URLs", () => {
    expect(
      parseDrawdbShareId(
        "https://drawdb.app/editor?shareId=abc123def456abc123def456abc123de"
      )
    ).toBe("abc123def456abc123def456abc123de");

    expect(
      parseDrawdbShareId(
        "https://www.drawdb.app/editor?theme=dark&shareId=abcdef0123456789abcdef0123456789&hideHeader=true"
      )
    ).toBe("abcdef0123456789abcdef0123456789");
  });

  it("accepts bare gist-like ids", () => {
    expect(parseDrawdbShareId("abcdef0123456789abcdef0123456789")).toBe(
      "abcdef0123456789abcdef0123456789"
    );
  });

  it("rejects unrelated URLs", () => {
    expect(parseDrawdbShareId("https://schema3d.com/#sql:abc")).toBeNull();
    expect(parseDrawdbShareId("not a url")).toBeNull();
  });
});

describe("isDrawdbShareUrl", () => {
  it("is true only for drawdb.app URLs", () => {
    expect(
      isDrawdbShareUrl(
        "https://drawdb.app/editor?shareId=abcdef0123456789abcdef0123456789"
      )
    ).toBe(true);
    expect(isDrawdbShareUrl("abcdef0123456789abcdef0123456789")).toBe(false);
  });
});

describe("fetchDrawdbShareJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns share.json content on success", async () => {
    const content = JSON.stringify({
      tables: [],
      relationships: [],
      notes: [],
      subjectAreas: [],
    });
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        files: {
          "share.json": { content },
        },
      }),
    });

    const result = await fetchDrawdbShareJson(
      "https://drawdb.app/editor?shareId=abcdef0123456789abcdef0123456789",
      fetchImpl as unknown as typeof fetch
    );
    expect(result).toBe(content);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/gists/abcdef0123456789abcdef0123456789",
      expect.any(Object)
    );
  });

  it("throws DrawdbShareError on HTTP failure", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(
      fetchDrawdbShareJson(
        "abcdef0123456789abcdef0123456789",
        fetchImpl as unknown as typeof fetch
      )
    ).rejects.toBeInstanceOf(DrawdbShareError);
  });

  it("throws a rate-limit message on 403/429", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    await expect(
      fetchDrawdbShareJson(
        "abcdef0123456789abcdef0123456789",
        fetchImpl as unknown as typeof fetch
      )
    ).rejects.toThrow(/rate limit/i);
  });

  it("throws when share.json is missing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ files: {} }),
    });

    await expect(
      fetchDrawdbShareJson(
        "abcdef0123456789abcdef0123456789",
        fetchImpl as unknown as typeof fetch
      )
    ).rejects.toThrow(/share\.json/i);
  });

  it("fetches raw_url when gist file is truncated", async () => {
    const fullContent = JSON.stringify({
      tables: [{ id: 0, name: "posts", fields: [] }],
      relationships: [],
      notes: [],
      subjectAreas: [],
    });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: {
            "share.json": {
              content: "{truncated…",
              truncated: true,
              raw_url:
                "https://gist.githubusercontent.com/u/abcdef0123456789abcdef0123456789/raw/share.json",
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => fullContent,
      });

    const result = await fetchDrawdbShareJson(
      "abcdef0123456789abcdef0123456789",
      fetchImpl as unknown as typeof fetch
    );
    expect(result).toBe(fullContent);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("throws when truncated without raw_url", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        files: {
          "share.json": {
            content: "{truncated…",
            truncated: true,
          },
        },
      }),
    });

    await expect(
      fetchDrawdbShareJson(
        "abcdef0123456789abcdef0123456789",
        fetchImpl as unknown as typeof fetch
      )
    ).rejects.toThrow(/truncated/i);
  });

  it("throws DrawdbShareError for unparseable share input", async () => {
    await expect(
      fetchDrawdbShareJson("not-a-share-url")
    ).rejects.toBeInstanceOf(DrawdbShareError);
  });

  it("throws when network fetch rejects", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      fetchDrawdbShareJson(
        "abcdef0123456789abcdef0123456789",
        fetchImpl as unknown as typeof fetch
      )
    ).rejects.toThrow(/GitHub Gists|Export JSON/i);
  });

  it("falls back to first JSON-looking gist file when share.json is absent", async () => {
    const content = JSON.stringify({
      tables: [{ id: 0, name: "t", fields: [] }],
      relationships: [],
      notes: [],
      subjectAreas: [],
    });
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        files: {
          "diagram.json": { content },
        },
      }),
    });

    const result = await fetchDrawdbShareJson(
      "abcdef0123456789abcdef0123456789",
      fetchImpl as unknown as typeof fetch
    );
    expect(result).toBe(content);
  });
});
