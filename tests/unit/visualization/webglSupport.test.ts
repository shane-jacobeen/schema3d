import { describe, it, expect, vi, afterEach } from "vitest";
import { detectWebGLSupport } from "@/visualizer/3d/utils/webgl-support";

function mockContext(
  contexts: Record<string, unknown>,
  extensions: Record<string, unknown> = {}
) {
  const canvas = {
    getContext: (id: string) => contexts[id] ?? null,
  };
  if (contexts.webgl && typeof contexts.webgl === "object") {
    (contexts.webgl as Record<string, unknown>).getExtension = (name: string) =>
      extensions[name] ?? null;
  }
  vi.spyOn(document, "createElement").mockReturnValue(
    canvas as unknown as HTMLElement
  );
}

describe("detectWebGLSupport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports WebGL2 when a webgl2 context exists", () => {
    mockContext({ webgl2: {} });
    expect(detectWebGLSupport()).toEqual({ supported: true, version: 2 });
  });

  it("reports WebGL1 when instancing is available", () => {
    mockContext({ webgl: {} }, { ANGLE_instanced_arrays: {} });
    expect(detectWebGLSupport()).toEqual({ supported: true, version: 1 });
  });

  it("fails when no context can be created", () => {
    mockContext({});
    expect(detectWebGLSupport()).toEqual({
      supported: false,
      reason: "no-context",
    });
  });

  it("fails when WebGL1 hides the instancing extension", () => {
    mockContext({ webgl: {} });
    expect(detectWebGLSupport()).toEqual({
      supported: false,
      reason: "no-instancing",
    });
  });
});
