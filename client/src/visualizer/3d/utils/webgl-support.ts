export type WebGLSupport =
  | { supported: true; version: 1 | 2 }
  | { supported: false; reason: "no-context" | "no-instancing" };

/**
 * Context attributes the 3D scene requests.
 *
 * `schema-scene.tsx` mounts `<Canvas gl={WEBGL_CONTEXT_ATTRIBUTES}>`. The
 * pre-flight probe must ask for a context with these same attributes. A browser
 * that grants a bare context but refuses the attributed one would otherwise
 * pass the probe and then throw when the real canvas renders.
 */
export const WEBGL_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  preserveDrawingBuffer: true,
};

/**
 * Report whether the browser can run the 3D scene.
 *
 * The scene draws relationship lines with drei's `Line`, which needs the
 * `ANGLE_instanced_arrays` extension on a WebGL1 context. WebGL2 provides
 * instancing as a core feature, so it needs no extension. Browsers that hide
 * WebGL extensions (for example Brave with shields up) pass context creation
 * but fail on the extension, so this check tests the extension too.
 */
export function detectWebGLSupport(): WebGLSupport {
  const canvas = document.createElement("canvas");

  const gl2 = canvas.getContext("webgl2", WEBGL_CONTEXT_ATTRIBUTES);
  if (gl2) {
    releaseContext(gl2);
    return { supported: true, version: 2 };
  }

  const gl1 = (canvas.getContext("webgl", WEBGL_CONTEXT_ATTRIBUTES) ||
    canvas.getContext(
      "experimental-webgl",
      WEBGL_CONTEXT_ATTRIBUTES
    )) as WebGLRenderingContext | null;
  if (!gl1) {
    return { supported: false, reason: "no-context" };
  }

  const hasInstancing = !!gl1.getExtension("ANGLE_instanced_arrays");
  releaseContext(gl1);
  if (!hasInstancing) {
    return { supported: false, reason: "no-instancing" };
  }

  return { supported: true, version: 1 };
}

/**
 * Drop a probe context so it does not hold a live WebGL slot. Firefox and
 * Safari cap the number of live contexts, so a probe that keeps its context can
 * starve the real canvas.
 */
function releaseContext(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  gl.getExtension("WEBGL_lose_context")?.loseContext();
}

/** Report whether the current browser is Brave. */
export async function isBraveBrowser(): Promise<boolean> {
  const brave = (
    navigator as Navigator & { brave?: { isBrave: () => Promise<boolean> } }
  ).brave;
  if (!brave?.isBrave) {
    return false;
  }
  return brave.isBrave();
}
