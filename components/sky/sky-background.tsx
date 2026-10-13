"use client";

import { useEffect, useRef, useState } from "react";
import { cloudJob } from "./clouds";

const LAYERS = [
  // Far: smaller, fainter, slower.
  {
    seed: 11,
    scale: 31,
    coverage: 0.42,
    opacity: 0.3,
    animate: "motion-safe:animate-drift-slow",
  },
  // Near: bigger, brighter, faster.
  {
    seed: 29,
    scale: 53,
    coverage: 0.36,
    opacity: 0.42,
    animate: "motion-safe:animate-drift-fast",
  },
] as const;

/** Tile width in texture pixels (upscaled → soft edges); height follows the screen. */
const TILE_W = 160;

/**
 * Fixed sky behind every page: the blue gradient plus two drifting cloud
 * layers. Clouds are generated in idle-time slices (never a long task), so
 * they don't compete with the first paint; the gradient shows immediately.
 */
export function SkyBackground() {
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Each tile covers one screen width, so match the screen's shape —
    // otherwise round clouds get stretched into streaks on tall phones.
    const aspect = window.innerHeight / Math.max(1, window.innerWidth);
    const tileH = Math.round(TILE_W * Math.min(2.4, Math.max(0.4, aspect)));
    const jobs = LAYERS.map((layer) =>
      cloudJob({ width: TILE_W, height: tileH, ...layer }),
    );
    let current = 0;
    let handle = 0;
    let cancelled = false;
    const hasIdle = typeof window.requestIdleCallback === "function";

    const finishLayer = (i: number) => {
      const canvas = canvases.current[i];
      const ctx = canvas?.getContext("2d");
      const job = jobs[i];
      if (!canvas || !ctx || !job) return;
      // Two copies side by side; the layer slides by one tile and loops.
      canvas.width = TILE_W * 2;
      canvas.height = tileH;
      ctx.putImageData(job.image, 0, 0);
      ctx.putImageData(job.image, TILE_W, 0);
    };

    const schedule = () => {
      if (hasIdle) {
        handle = window.requestIdleCallback(
          (deadline) => work(() => deadline.timeRemaining()),
          { timeout: 4000 },
        );
      } else {
        // Safari < 18: short timed slices.
        handle = window.setTimeout(() => {
          const end = performance.now() + 8;
          work(() => end - performance.now());
        }, 50);
      }
    };

    // Each slice stops before the idle budget runs out.
    const work = (timeLeft: () => number) => {
      if (cancelled) return;
      while (current < jobs.length) {
        const job = jobs[current];
        if (!job || !job.step(timeLeft)) break;
        finishLayer(current);
        current++;
      }
      if (current >= jobs.length) setReady(true);
      else schedule();
    };

    schedule();
    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-linear-to-b from-sky-top via-sky to-sky-bottom"
    >
      {LAYERS.map((layer, i) => (
        <div
          key={layer.seed}
          className={`absolute inset-y-0 start-0 w-[200%] transition-opacity duration-[2000ms] ${layer.animate}`}
          style={{ opacity: ready ? layer.opacity : 0 }}
        >
          <canvas
            ref={(el) => {
              canvases.current[i] = el;
            }}
            className="size-full"
          />
        </div>
      ))}
    </div>
  );
}
