"use client";

import { useEffect, useRef, useState } from "react";
import type { WeeksGrid as Grid } from "@/lib/weeks";
import { PALETTE } from "@/lib/palette";
import { WEEKS_PER_ROW } from "@/lib/weeks";

const GAP = 2;
const LABEL_EVERY = 10;
const LABEL_WIDTH = 28;
/** Room above row 0 so its age label isn't clipped. */
const PAD_TOP = 6;

const COLORS = {
  lived: PALETTE.cloud,
  livedOld: PALETTE.mist,
  ahead: "rgba(255,255,255,0.2)",
  now: PALETTE.cyan,
  label: PALETTE.haze,
};

/**
 * ~4,000 weeks drawn on one canvas (cheap on phones), with a real DOM dot
 * pulsing over the current week. Decorative: the parent provides the text.
 */
export function WeeksGrid({
  grid,
  yearLabel,
  rtl = false,
}: {
  grid: Grid;
  yearLabel: (age: number) => string;
  rtl?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<{ cell: number; width: number } | null>(
    null,
  );

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      const cell = Math.max(
        3,
        Math.floor(
          (width - LABEL_WIDTH - GAP * (WEEKS_PER_ROW - 1)) / WEEKS_PER_ROW,
        ),
      );
      setLayout({ cell, width });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const step = layout ? layout.cell + GAP : 0;
  const height = layout ? PAD_TOP + grid.rows * step - GAP : 0;
  const gridWidth = layout ? WEEKS_PER_ROW * step - GAP : 0;
  // Column x position, mirrored for right-to-left locales.
  const colX = (col: number) =>
    rtl ? gridWidth - (col + 1) * step + GAP : LABEL_WIDTH + col * step;

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || !layout) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fullWidth = gridWidth + LABEL_WIDTH;
    el.width = Math.round(fullWidth * dpr);
    el.height = Math.round(height * dpr);
    el.style.width = `${fullWidth}px`;
    el.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, fullWidth, height);

    const r = layout.cell / 2;
    for (let row = 0; row < grid.rows; row++) {
      const cols = row === grid.rows - 1 ? grid.lastRowWeeks : WEEKS_PER_ROW;
      for (let col = 0; col < cols; col++) {
        const index = row * WEEKS_PER_ROW + col;
        const x = colX(col) + r;
        const y = PAD_TOP + row * step + r;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        if (index < grid.livedWeeks) {
          // Later years shade from cloud white toward mist.
          ctx.fillStyle =
            row / grid.rows < 0.5 ? COLORS.lived : COLORS.livedOld;
          ctx.globalAlpha = 0.9;
        } else if (grid.current && index === grid.current.index) {
          ctx.fillStyle = COLORS.now;
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = COLORS.ahead;
          ctx.globalAlpha = 1;
        }
        ctx.fill();
      }
      if (row % LABEL_EVERY === 0) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = COLORS.label;
        ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textBaseline = "middle";
        ctx.textAlign = rtl ? "right" : "left";
        ctx.fillText(
          String(row),
          rtl ? fullWidth : 0,
          PAD_TOP + row * step + r,
        );
      }
    }
    ctx.globalAlpha = 1;
    // colX only depends on values already in the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, layout, rtl, height, gridWidth, step]);

  return (
    <div ref={wrap} className="relative w-full" aria-hidden="true">
      <canvas ref={canvas} className="block" />
      {layout && grid.current && (
        <span
          className="absolute rounded-full bg-cyan motion-safe:animate-ping"
          title={yearLabel(grid.current.row)}
          style={{
            width: layout.cell,
            height: layout.cell,
            left: colX(grid.current.col),
            top: PAD_TOP + grid.current.row * step,
          }}
        />
      )}
    </div>
  );
}
