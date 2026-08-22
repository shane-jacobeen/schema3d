export type WebGLSupport =
  | { supported: true; version: 1 | 2 }
  | { supported: false; reason: "no-context" | "no-instancing" };

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

  const gl2 = canvas.getContext("webgl2");
  if (gl2) {
    return { supported: true, version: 2 };
  }

  const gl1 = (canvas.getContext("webgl") ||
    canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
  if (!gl1) {
    return { supported: false, reason: "no-context" };
  }

  if (!gl1.getExtension("ANGLE_instanced_arrays")) {
    return { supported: false, reason: "no-instancing" };
  }

  return { supported: true, version: 1 };
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
