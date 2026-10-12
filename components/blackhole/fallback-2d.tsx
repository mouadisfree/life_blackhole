"use client";

import { useEffect, useRef } from "react";
import { drawBlackHole as draw, makeParticles, STILL_TIME } from "./draw-2d";

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
