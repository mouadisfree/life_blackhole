"use client";

import { useEffect, useRef } from "react";
import { blackHoleParams } from "@/lib/blackhole-params";

/** Vertical squash of the disk ellipse (viewing angle). */
const TILT = 0.2;
const PARTICLES = 180;
const STILL_TIME = 14;

type Particle = { phase: number; angle: number; speed: number };

function makeParticles(): Particle[] {
  let s = 7;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: PARTICLES }, () => ({
    phase: rand(),
    angle: rand() * Math.PI * 2,
    speed: 0.4 + rand() * 0.8,
  }));
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  percentLived: number,
  particles: Particle[],
) {
  const p = blackHoleParams(percentLived);
  const cx = w / 2;
  const cy = h / 2;
  // Scene units → px so the disk fills the box with a little margin.
  const unit = Math.min(w / (p.diskOuter * 2.2), h / (p.diskOuter * 1.25));
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

  // Disk as clumpy arcs rotating at Keplerian-ish speed, split into back/front halves.
  const diskHalf = (front: boolean) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, TILT);
    // Context is translated to the centre here, so the gradient is at (0, 0).
    ctx.fillStyle = ring(0, 0, inner, outer);
    const bands = 10;
    for (let b = 0; b < bands; b++) {
      const r0 = inner + ((outer - inner) * b) / bands;
      const r1 = inner + ((outer - inner) * (b + 1)) / bands;
      const rMid = (r0 + r1) / 2 / unit;
      const spin = t * (1.4 / Math.pow(rMid, 1.5));
      const segs = 40;
      for (let i = 0; i < segs; i++) {
        let a0 = (i / segs) * Math.PI * 2 + spin;
        let a1 = a0 + (Math.PI * 2) / segs;
        // Keep only the half we're drawing (back = upper half on screen).
        const mid = ((a0 + a1) / 2) % (Math.PI * 2);
        const isFront = Math.sin(mid) > 0;
        if (isFront !== front) continue;
        a0 -= 0.01;
        a1 += 0.01;
        const clump = 0.55 + 0.45 * Math.sin(i * 2.3 + b * 1.7);
        ctx.globalAlpha = clump * (1 - b / (bands + 1));
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

  diskHalf(false);

  // Lensed far side arching over the top and under the bottom of the horizon.
  ctx.save();
  ctx.strokeStyle = ring(cx, cy, rh * 1.1, rh * 1.6);
  ctx.lineWidth = rh * 0.32;
  ctx.globalAlpha = 0.85 * p.matter;
  ctx.beginPath();
  ctx.arc(cx, cy, rh * 1.25, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  ctx.lineWidth = rh * 0.16;
  ctx.globalAlpha = 0.5 * p.matter;
  ctx.beginPath();
  ctx.arc(cx, cy, rh * 1.18, Math.PI * 0.08, Math.PI * 0.92);
  ctx.stroke();
  ctx.restore();

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

export function Fallback2D({
  percentLived,
  animate,
}: {
  percentLived: number;
  animate: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const percent = useRef(percentLived);
  useEffect(() => {
    percent.current = percentLived;
  }, [percentLived]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const particles = makeParticles();
    let raf = 0;
    let visible = true;
    let time = STILL_TIME;
    let last = performance.now();
    let size = { w: 0, h: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = el.getBoundingClientRect();
      size = { w: rect.width, h: rect.height };
      el.width = Math.round(rect.width * dpr);
      el.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, size.w, size.h, time, percent.current, particles);
    };

    const frame = (now: number) => {
      time += Math.min((now - last) / 1000, 0.1) * 0.6;
      last = now;
      draw(ctx, size.w, size.h, time, percent.current, particles);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!animate || !visible || raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) start();
      else stop();
    });
    io.observe(el);
    resize();
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, [animate]);

  // Redraw a still frame when the data changes without animation.
  useEffect(() => {
    if (animate) return;
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const rect = el.getBoundingClientRect();
    draw(
      ctx,
      rect.width,
      rect.height,
      STILL_TIME,
      percentLived,
      makeParticles(),
    );
  }, [animate, percentLived]);

  return <canvas ref={canvas} className="absolute inset-0 size-full" />;
}
