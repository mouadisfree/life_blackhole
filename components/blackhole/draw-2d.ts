/**
 * Canvas-2D black hole renderer, shared by the live fallback and the share
 * cards. Pure drawing: no React, no timers.
 */
import { blackHoleParams } from "@/lib/blackhole-params";

/** Vertical squash of the disk ellipse (viewing angle). */
const TILT = 0.2;
const PARTICLES = 180;
export const STILL_TIME = 14;

export type Particle = { phase: number; angle: number; speed: number };

export function makeParticles(): Particle[] {
  let s = 7;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: PARTICLES }, () => ({
    phase: rand(),
    angle: rand() * Math.PI * 2,
    speed: 0.4 + rand() * 0.8,
  }));
}

let arcCache: { key: string; canvas: HTMLCanvasElement } | null = null;

/**
 * The two lensed arcs, with ends that fade out (conic-gradient mask) instead
 * of stopping abruptly. Cached: they only change with size and % lived.
 */
function lensedArcs(
  w: number,
  h: number,
  rh: number,
  matter: number,
  scale: number,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const key = [w, h, rh.toFixed(2), matter.toFixed(3), scale].join("|");
  if (arcCache?.key === key) return arcCache.canvas;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const c = canvas.getContext("2d");
  if (!c) return null;
  c.scale(scale, scale);
  const cx = w / 2;
  const cy = h / 2;
  const g = c.createRadialGradient(cx, cy, rh * 1.1, cx, cy, rh * 1.6);
  g.addColorStop(0, `rgba(255,244,224,${0.9 * matter})`);
  g.addColorStop(0.35, `rgba(255,179,71,${0.7 * matter})`);
  g.addColorStop(1, "rgba(255,107,26,0)");
  c.strokeStyle = g;
  c.globalAlpha = 0.9;
  c.lineWidth = rh * 0.32;
  c.beginPath();
  c.arc(cx, cy, rh * 1.25, Math.PI, Math.PI * 2);
  c.stroke();
  c.globalAlpha = 0.55;
  c.lineWidth = rh * 0.16;
  c.beginPath();
  c.arc(cx, cy, rh * 1.18, 0, Math.PI);
  c.stroke();

  // Fade both arcs toward the disk plane (left and right of the horizon).
  if ("createConicGradient" in c) {
    const mask = c.createConicGradient(0, cx, cy);
    mask.addColorStop(0, "rgba(0,0,0,0)");
    mask.addColorStop(0.25, "rgba(0,0,0,1)");
    mask.addColorStop(0.5, "rgba(0,0,0,0)");
    mask.addColorStop(0.75, "rgba(0,0,0,1)");
    mask.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = 1;
    c.globalCompositeOperation = "destination-in";
    c.fillStyle = mask;
    c.fillRect(0, 0, w, h);
  }
  arcCache = { key, canvas };
  return canvas;
}

const DISK_LAYERS = 8;
const BANDS_PER_LAYER = 4;
let layerCache: {
  key: string;
  layers: HTMLCanvasElement[];
  radii: number[];
} | null = null;

/**
 * The live renderer's disk: streaks pre-rendered (unrotated, unsquashed) into
 * a few layers, then rotated per frame — ~16 image draws instead of ~2,500
 * arc fills. Cached at 1× resolution: it's a soft glow, and that keeps memory
 * around 0.5 MB per layer on phones.
 */
function diskLayers(inner: number, outer: number, matter: number) {
  if (typeof document === "undefined") return null;
  const key = [inner.toFixed(1), outer.toFixed(1), matter.toFixed(3)].join("|");
  if (layerCache?.key === key) return layerCache;
  const size = Math.ceil(outer * 2) + 2;
  const total = DISK_LAYERS * BANDS_PER_LAYER;
  const segs = 96;
  const layers: HTMLCanvasElement[] = [];
  const radii: number[] = [];
  for (let l = 0; l < DISK_LAYERS; l++) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const c = canvas.getContext("2d");
    if (!c) return null;
    c.translate(size / 2, size / 2);
    const g = c.createRadialGradient(0, 0, inner, 0, 0, outer);
    g.addColorStop(0, `rgba(255,244,224,${0.9 * matter})`);
    g.addColorStop(0.35, `rgba(255,179,71,${0.7 * matter})`);
    g.addColorStop(1, "rgba(255,107,26,0)");
    c.fillStyle = g;
    for (let j = 0; j < BANDS_PER_LAYER; j++) {
      const b = l * BANDS_PER_LAYER + j;
      const r0 = inner + ((outer - inner) * b) / total;
      const r1 = inner + ((outer - inner) * (b + 1)) / total;
      const k = 2 + (b % 4);
      const phase = b * 2.399;
      const fade = Math.pow(1 - b / total, 1.3);
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        c.globalAlpha =
          (0.55 + 0.45 * Math.sin(k * ((a0 + a1) / 2) + phase)) * fade * 0.8;
        c.beginPath();
        c.arc(0, 0, r1, a0, a1);
        c.arc(0, 0, r0, a1, a0, true);
        c.closePath();
        c.fill();
      }
    }
    layers.push(canvas);
    radii.push(inner + ((outer - inner) * (l + 0.5)) / DISK_LAYERS);
  }
  layerCache = { key, layers, radii };
  return layerCache;
}

export function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  percentLived: number,
  particles: Particle[],
  options: {
    /** >1 crops into the centre (share cards); the disk may run off the edges. */
    zoom?: number;
    /**
     * Soften the disk with one blur pass per half (share cards only — too
     * costly to run every frame on the low-end devices that use this live).
     */
    soft?: boolean;
  } = {},
) {
  const { zoom = 1, soft = false } = options;
  // Not laid out yet (0×0 canvas): nothing to draw, and caches would be empty.
  if (w < 1 || h < 1) return;
  const p = blackHoleParams(percentLived);
  const cx = w / 2;
  const cy = h / 2;
  // Scene units → px so the disk fills the box with a little margin.
  const unit =
    Math.min(w / (p.diskOuter * 2.2), h / (p.diskOuter * 1.25)) * zoom;
  const rh = p.horizonRadius * unit;
  const inner = p.diskInner * unit;
  const outer = p.diskOuter * unit;

  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";

  // Ambient glow.
  // Fade out inside the canvas so no rectangular edge shows.
  const glow = ctx.createRadialGradient(cx, cy, rh, cx, cy, Math.min(w, h) / 2);
  glow.addColorStop(0, `rgba(255,107,26,${0.32 * p.matter})`);
  glow.addColorStop(1, "rgba(255,107,26,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const ring = (x: number, y: number, r0: number, r1: number) => {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    g.addColorStop(0, `rgba(255,244,224,${0.9 * p.matter})`);
    g.addColorStop(0.35, `rgba(255,179,71,${0.7 * p.matter})`);
    g.addColorStop(1, "rgba(255,107,26,0)");
    return g;
  };

  // Disk as thin concentric streaks; brightness varies smoothly around each
  // ring (no per-segment jumps, which read as tiles at high resolution).
  const streaks = (c: CanvasRenderingContext2D, front: boolean) => {
    const ctx = c;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, TILT);
    // Context is translated to the centre here, so the gradient is at (0, 0).
    ctx.fillStyle = ring(0, 0, inner, outer);
    const bands = 26;
    const segs = 96;
    for (let b = 0; b < bands; b++) {
      const r0 = inner + ((outer - inner) * b) / bands;
      const r1 = inner + ((outer - inner) * (b + 1)) / bands;
      const rMid = (r0 + r1) / 2 / unit;
      const spin = t * (1.4 / Math.pow(rMid, 1.5));
      const k = 2 + (b % 4); // clumps per ring
      const phase = b * 2.399; // golden angle: rings don't line up
      const fade = Math.pow(1 - b / bands, 1.3);
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        const mid = (a0 + a1) / 2;
        // Keep only the half we're drawing (back = upper half on screen).
        if (Math.sin(mid) > 0 !== front) continue;
        const clump = 0.55 + 0.45 * Math.sin(k * (mid - spin) + phase);
        ctx.globalAlpha = clump * fade * 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, r1, a0, a1);
        ctx.arc(0, 0, r0, a1, a0, true);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  };

  const diskHalf = (front: boolean) => {
    if (!soft) {
      const cache = diskLayers(inner, outer, p.matter);
      if (cache) {
        ctx.save();
        ctx.translate(cx, cy);
        // Back half = upper half on screen, front half = lower half.
        ctx.beginPath();
        ctx.rect(-w, front ? 0 : -h, w * 2, h);
        ctx.clip();
        ctx.scale(1, TILT);
        cache.layers.forEach((layer, i) => {
          const spin =
            t * (1.4 / Math.pow((cache.radii[i] ?? outer) / unit, 1.5));
          ctx.save();
          ctx.rotate(spin);
          ctx.drawImage(layer, -layer.width / 2, -layer.height / 2);
          ctx.restore();
        });
        ctx.restore();
        return;
      }
    }
    const canBlur = soft && "filter" in ctx && typeof document !== "undefined";
    if (!canBlur) {
      streaks(ctx, front);
      return;
    }
    // Draw unblurred offscreen, then composite once with a blur.
    const off = document.createElement("canvas");
    off.width = ctx.canvas.width;
    off.height = ctx.canvas.height;
    const octx = off.getContext("2d");
    if (!octx) {
      streaks(ctx, front);
      return;
    }
    octx.setTransform(ctx.getTransform());
    octx.globalCompositeOperation = "lighter";
    streaks(octx, front);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = `blur(${Math.max(1, unit * 0.03)}px)`;
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  };

  diskHalf(false);

  // Lensed far side arching over the top and under the bottom of the horizon.
  // Static, so it's rendered once per size and reused every frame.
  const scale = ctx.getTransform().a || 1;
  const arcs = lensedArcs(w, h, rh, p.matter, scale);
  if (arcs) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(arcs, 0, 0);
    ctx.restore();
  }

  // Event horizon (opaque) + photon ring.
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx, cy, rh, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(255,244,224,0.95)";
  ctx.lineWidth = Math.max(1, rh * 0.035);
  ctx.shadowColor = "rgba(255,179,71,0.9)";
  ctx.shadowBlur = rh * 0.25;
  ctx.beginPath();
  ctx.arc(cx, cy, rh * 1.06, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  diskHalf(true);

  // Infalling particles.
  const visible = Math.round(particles.length * p.particleShare);
  for (let i = 0; i < visible; i++) {
    const q = particles[i];
    if (!q) continue;
    const life = (q.phase + t * q.speed * 0.04) % 1;
    const r =
      p.diskOuter * 1.05 +
      (p.horizonRadius * 0.95 - p.diskOuter * 1.05) * Math.pow(life, 0.8);
    const ang = q.angle + (t * 1.1) / Math.pow(r, 1.5) + life * 9;
    const x = cx + Math.cos(ang) * r * unit;
    const y = cy + Math.sin(ang) * r * unit * TILT;
    const behind = Math.sin(ang) < 0 && Math.hypot(x - cx, y - cy) < rh;
    if (behind) continue;
    const alpha =
      Math.min(life / 0.1, 1) * (1 - Math.max(0, (life - 0.88) / 0.12));
    ctx.fillStyle = `rgba(255,${Math.round(150 + 90 * life)},${Math.round(60 + 160 * life)},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.4 + q.speed * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}
