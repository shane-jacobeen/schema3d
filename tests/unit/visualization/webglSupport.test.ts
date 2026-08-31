import { describe, it, expect, vi, afterEach } from "vitest";
import {
  detectWebGLSupport,
  WEBGL_CONTEXT_ATTRIBUTES,
} from "@/visualizer/3d/utils/webgl-support";

interface MockCall {
  id: string;
  attributes: unknown;
}

function mockContext(
  contexts: Record<string, unknown>,
  extensions: Record<string, unknown> = {}
) {
  const calls: MockCall[] = [];
  const loseContext = vi.fn();
  for (const context of Object.values(contexts)) {
    if (context && typeof context === "object") {
      (context as Record<string, unknown>).getExtension = (name: string) =>
        name === "WEBGL_lose_context"
          ? { loseContext }
          : (extensions[name] ?? null);
    }
  }
  const canvas = {
    getContext: (id: string, attributes?: unknown) => {
      calls.push({ id, attributes });
      return contexts[id] ?? null;
    },
  };
  vi.spyOn(document, "createElement").mockReturnValue(
    canvas as unknown as HTMLElement
  );
  return { calls, loseContext };
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

  it("probes with the attributes the canvas requests", () => {
    const { calls } = mockContext({ webgl2: {} });
    detectWebGLSupport();
    expect(calls[0]).toEqual({
      id: "webgl2",
      attributes: WEBGL_CONTEXT_ATTRIBUTES,
    });
  });

  it("releases the probe context so it frees the slot", () => {
    const { loseContext } = mockContext({ webgl2: {} });
    detectWebGLSupport();
    expect(loseContext).toHaveBeenCalledOnce();
  });
});
