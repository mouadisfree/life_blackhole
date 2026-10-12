import { describe, expect, it } from "vitest";
import { blackHoleParams } from "./blackhole-params";
import { getDeviceTier, planRender } from "./render-mode";

describe("getDeviceTier", () => {
  it("is 'none' without WebGL", () => {
    expect(getDeviceTier({ webgl: false })).toBe("none");
  });

  it("is 'high' on a capable device", () => {
    expect(
      getDeviceTier({
        webgl: true,
        gpuRenderer: "Apple GPU",
        hardwareConcurrency: 8,
        deviceMemory: 8,
      }),
    ).toBe("high");
  });

  it.each([
    "Google SwiftShader",
    "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)",
    "llvmpipe (LLVM 15.0.7, 256 bits)",
    "Mali-400 MP",
    "Mali-T720",
    "Adreno (TM) 308",
    "PowerVR SGX 544MP",
  ])("is 'low' for software or old GPUs: %s", (gpuRenderer) => {
    expect(getDeviceTier({ webgl: true, gpuRenderer })).toBe("low");
  });

  it("keeps modern mobile GPUs on 'high'", () => {
    expect(getDeviceTier({ webgl: true, gpuRenderer: "Adreno (TM) 740" })).toBe(
      "high",
    );
    expect(getDeviceTier({ webgl: true, gpuRenderer: "Mali-G710" })).toBe(
      "high",
    );
  });

  it("is 'low' with little memory, few cores or Save-Data", () => {
    expect(getDeviceTier({ webgl: true, deviceMemory: 2 })).toBe("low");
    expect(getDeviceTier({ webgl: true, hardwareConcurrency: 2 })).toBe("low");
    expect(getDeviceTier({ webgl: true, saveData: true })).toBe("low");
  });
});

describe("planRender", () => {
  it("uses WebGL only on the horizon screen of capable devices", () => {
    expect(
      planRender({ tier: "high", reducedMotion: false, variant: "horizon" }),
    ).toEqual({ mode: "webgl", animate: true });
    expect(
      planRender({ tier: "low", reducedMotion: false, variant: "horizon" }),
    ).toEqual({ mode: "canvas", animate: true });
    expect(
      planRender({ tier: "none", reducedMotion: false, variant: "horizon" }),
    ).toEqual({ mode: "canvas", animate: true });
  });

  it("keeps the landing page on the lightweight canvas", () => {
    expect(
      planRender({ tier: "high", reducedMotion: false, variant: "idle" }).mode,
    ).toBe("canvas");
  });

  it("draws a still frame when motion is reduced", () => {
    expect(
      planRender({ tier: "high", reducedMotion: true, variant: "horizon" }),
    ).toEqual({ mode: "webgl", animate: false });
  });
});

describe("blackHoleParams", () => {
  it("grows the horizon and drains the matter as life is lived", () => {
    const young = blackHoleParams(5);
    const old = blackHoleParams(90);
    expect(old.horizonRadius).toBeGreaterThan(young.horizonRadius);
    expect(old.matter).toBeLessThan(young.matter);
    expect(old.particleShare).toBeLessThan(young.particleShare);
  });

  it("clamps out-of-range input and keeps the disk outside the horizon", () => {
    expect(blackHoleParams(-10)).toEqual(blackHoleParams(0));
    expect(blackHoleParams(150)).toEqual(blackHoleParams(100));
    const full = blackHoleParams(100);
    expect(full.diskInner).toBeGreaterThan(full.horizonRadius);
    expect(full.diskOuter).toBeGreaterThan(full.diskInner);
    expect(full.matter).toBeGreaterThan(0);
  });
});
