import { describe, it, expect, vi, afterEach } from "vitest";
import { tryLoadDrawdbShareFromQuery } from "@/visualizer/state/initial-state";
import blogPlatformDrawdb from "@/schemas/sample-schemas/blog-platform.drawdb.json";

describe("tryLoadDrawdbShareFromQuery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns null when no drawdb query param is present", async () => {
    expect(await tryLoadDrawdbShareFromQuery("")).toBeNull();
    expect(await tryLoadDrawdbShareFromQuery("?foo=bar")).toBeNull();
  });

  it("loads and parses schema from drawdbShareId with mocked gist fetch", async () => {
    const content = JSON.stringify(blogPlatformDrawdb);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          files: { "share.json": { content } },
        }),
      })
    );

    const schema = await tryLoadDrawdbShareFromQuery(
      "?drawdbShareId=abcdef0123456789abcdef0123456789"
    );

    expect(schema).not.toBeNull();
    expect(schema!.format).toBe("drawdb");
    expect(schema!.tables.length).toBe(12);
    expect(schema!.tables[0].position).toBeDefined();
  });

  it("accepts ?drawdb= bare gist id", async () => {
    const content = JSON.stringify(blogPlatformDrawdb);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          files: { "share.json": { content } },
        }),
      })
    );

    const schema = await tryLoadDrawdbShareFromQuery(
      "?drawdb=abcdef0123456789abcdef0123456789"
    );
    expect(schema).not.toBeNull();
    expect(schema!.tables.length).toBe(12);
  });

  it("returns null when gist fetch fails", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })
    );

    const schema = await tryLoadDrawdbShareFromQuery(
      "?drawdbShareId=abcdef0123456789abcdef0123456789"
    );
    expect(schema).toBeNull();
    expect(err).toHaveBeenCalled();
  });

  it("returns null when gist JSON is not a valid DrawDB diagram", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          files: {
            "share.json": { content: JSON.stringify({ foo: "bar" }) },
          },
        }),
      })
    );

    const schema = await tryLoadDrawdbShareFromQuery(
      "?drawdbShareId=abcdef0123456789abcdef0123456789"
    );
    expect(schema).toBeNull();
  });
});
