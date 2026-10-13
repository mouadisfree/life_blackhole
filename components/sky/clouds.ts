/**
 * Procedural cumulus clouds on a canvas: fractal value noise, thresholded
 * into puffy shapes, lit from above (bright tops, faintly blue undersides).
 * The texture tiles seamlessly in x so it can drift forever.
 * Rendered small and scaled up by the browser: soft edges for free.
 */

export type CloudOptions = {
  width: number;
  height: number;
  seed: number;
  /** Base feature size in pixels (bigger → larger clouds). */
  scale: number;
  /** 0..1: how much of the sky is covered. */
  coverage: number;
};

function hash(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Value noise, periodic in x with period `px` lattice cells. */
function noise(x: number, y: number, px: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const wrap = (i: number) => ((i % px) + px) % px;
  const a = hash(wrap(x0), y0, seed);
  const b = hash(wrap(x0 + 1), y0, seed);
  const c = hash(wrap(x0), y0 + 1, seed);
  const d = hash(wrap(x0 + 1), y0 + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export type CloudJob = {
  /** Work until `timeLeft()` drops below ~1 ms; returns true when finished. */
  step: (timeLeft: () => number) => boolean;
  image: ImageData;
};

/**
 * Incremental cloud tile: rows are computed in slices so the work can run in
 * idle time without ever blocking the main thread (Lighthouse TBT).
 */
export function cloudJob(o: CloudOptions): CloudJob {
  const { width: w, height: h, seed, scale, coverage } = o;
  const cells = Math.max(2, Math.round(w / scale));
  const octaves = 5;
  const density = new Float32Array(w * h);
  const image = new ImageData(w, h);
  const threshold = 0.62 - coverage * 0.3;
  let y = 0;

  const row = (yy: number) => {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let amp = 0.55;
      let freq = 1;
      for (let i = 0; i < octaves; i++) {
        const period = cells * freq;
        sum +=
          amp *
          noise((x / w) * period, (yy / w) * period, period, seed + i * 17);
        amp *= 0.5;
        freq *= 2;
      }
      density[yy * w + x] = sum;
    }
    // Shade this row (only needs rows above it, which are done).
    // Fewer clouds near the very top and bottom of the tile.
    const band = Math.sin((Math.PI * (yy + 0.5)) / h) ** 0.6;
    for (let x = 0; x < w; x++) {
      const d = density[yy * w + x] ?? 0;
      const t = Math.min(1, Math.max(0, (d * band - threshold) / 0.2));
      const alpha = t * t * (3 - 2 * t);
      if (alpha <= 0) continue;
      // Light from above: denser below than above → underside → slightly blue.
      const above = density[Math.max(0, yy - 3) * w + x] ?? d;
      const under = Math.min(1, Math.max(0, (d - above) * 6));
      const i = (yy * w + x) * 4;
      image.data[i] = Math.round(255 - 40 * under);
      image.data[i + 1] = Math.round(255 - 22 * under);
      image.data[i + 2] = 255;
      image.data[i + 3] = Math.round(255 * alpha);
    }
  };

  return {
    image,
    step(timeLeft) {
      while (y < h && timeLeft() > 1) row(y++);
      return y >= h;
    },
  };
}

/** Fills `ctx` (width × height) with one seamless cloud tile, synchronously. */
export function drawClouds(
  ctx: CanvasRenderingContext2D,
  o: CloudOptions,
): void {
  const job = cloudJob(o);
  job.step(() => Infinity);
  ctx.putImageData(job.image, 0, 0);
}
