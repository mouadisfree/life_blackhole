/**
 * Decides how the black hole is drawn on this device. Pure functions with the
 * browser environment passed in, so the rules are testable.
 */

export type DeviceTier = "none" | "low" | "high";
export type RenderMode = "webgl" | "canvas";
export type SceneVariant = "idle" | "horizon";

export type DeviceEnv = {
  webgl: boolean;
  /** UNMASKED_RENDERER_WEBGL when available. */
  gpuRenderer?: string;
  hardwareConcurrency?: number;
  /** navigator.deviceMemory (GB), Chromium only. */
  deviceMemory?: number;
  saveData?: boolean;
};

/** Software renderers and old mobile GPUs that can't hold 60fps with the shader. */
const LOW_END_GPU =
  /swiftshader|llvmpipe|softpipe|software|microsoft basic render|mali-[2-4]\d{2}|mali-t[0-7]|adreno \(tm\) [1-4]\d{2}|powervr sgx|intel\(r\) hd graphics [2-4]\d{3}/i;

export function getDeviceTier(env: DeviceEnv): DeviceTier {
  if (!env.webgl) return "none";
  if (env.saveData) return "low";
  if (env.gpuRenderer && LOW_END_GPU.test(env.gpuRenderer)) return "low";
  if (env.deviceMemory !== undefined && env.deviceMemory <= 2) return "low";
  if (env.hardwareConcurrency !== undefined && env.hardwareConcurrency <= 2)
    return "low";
  return "high";
}

export type RenderPlan = { mode: RenderMode; animate: boolean };

/**
 * - Landing ("idle") always uses the light canvas version (PROGRESS.md D8).
 * - The horizon uses WebGL only on capable devices.
 * - Reduced motion keeps the chosen renderer but draws a still frame.
 */
export function planRender(params: {
  tier: DeviceTier;
  reducedMotion: boolean;
  variant: SceneVariant;
}): RenderPlan {
  const { tier, reducedMotion, variant } = params;
  const mode: RenderMode =
    variant === "horizon" && tier === "high" ? "webgl" : "canvas";
  return { mode, animate: !reducedMotion };
}

/** Reads the real browser environment. Client only. */
export function readDeviceEnv(): DeviceEnv {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  let webgl = false;
  let gpuRenderer: string | undefined;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (gl) {
      webgl = true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        gpuRenderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    webgl = false;
  }
  return {
    webgl,
    gpuRenderer,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
  };
}
