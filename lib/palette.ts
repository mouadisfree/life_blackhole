/**
 * Sky palette (PROGRESS.md D32), for code that can't use CSS variables:
 * canvas, WebGL, share cards, OG image, icons. Keep in sync with the tokens
 * in app/globals.css.
 *
 * Contrast: white text ≥ 5.4:1 and `haze` ≥ 4.8:1 anywhere on the sky
 * gradient — the photo-blue (#1C86E0) is lighter but fails AA for white text.
 */
export const PALETTE = {
  /** Sky gradient, top → bottom. */
  skyTop: "#0a5aa8",
  sky: "#0b5fae",
  skyBottom: "#0e6bc2",
  /** Panels, inputs. */
  skyDeep: "#084985",
  /** Tracks, "weeks ahead" dots. */
  skyLine: "#4a8fd3",
  /** Primary accent (buttons, bright glow). */
  cloud: "#ffffff",
  /** Secondary accent (links, clocks): pale cyan. */
  mist: "#d9f3ff",
  /** Brightest highlights: photon ring, current week. */
  halo: "#f2fbff",
  /** Outer glow / disk edge: sky cyan. */
  cyan: "#9ed8ff",
  ink: "#ffffff",
  haze: "#e3f7ff",
  /** The event horizon: a deep-navy hole in the sky. */
  horizon: "#04203d",
} as const;

/** "#rrggbb" → "r,g,b" for building rgba() strings. */
export function rgb(hex: string): string {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(",");
}
