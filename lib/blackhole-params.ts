/**
 * How life data drives the black hole (PROMPT.md §5.2): the more of your
 * expected life has been lived, the larger the event horizon and the less
 * glowing matter is left orbiting it. Shared by the WebGL scene and the 2D
 * fallback so both tell the same story.
 */

export type BlackHoleParams = {
  /** Event horizon radius in scene units. */
  horizonRadius: number;
  /** Inner edge of the accretion disk (just outside the photon ring). */
  diskInner: number;
  diskOuter: number;
  /** 0..1 — brightness/density of the remaining matter. */
  matter: number;
  /** 0..1 — share of the particle budget still orbiting. */
  particleShare: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function blackHoleParams(percentLived: number): BlackHoleParams {
  const p = Math.min(1, Math.max(0, percentLived / 100));
  const horizonRadius = lerp(0.6, 1.2, p);
  return {
    horizonRadius,
    diskInner: horizonRadius * 1.6,
    diskOuter: 4.2,
    matter: lerp(1, 0.35, p),
    particleShare: lerp(1, 0.25, p),
  };
}
