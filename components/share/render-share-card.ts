/**
 * Draws a share card on an offscreen canvas and returns a PNG blob.
 * Runs entirely in the browser — nothing is uploaded (PROGRESS.md D1).
 */
import {
  drawBlackHole,
  makeParticles,
  STILL_TIME,
} from "@/components/blackhole/draw-2d";
import {
  SHARE_SIZES,
  type ShareCardContent,
  type ShareFormat,
} from "@/lib/share-card";
import { PALETTE } from "@/lib/palette";
import { drawClouds } from "@/components/sky/clouds";

const COLORS = {
  ink: PALETTE.ink,
  haze: PALETTE.haze,
  mist: PALETTE.mist,
  track: "rgba(255,255,255,0.25)",
};

function fontFamilies() {
  const css = getComputedStyle(document.documentElement);
  const sans =
    css.getPropertyValue("--font-geist-sans").trim() || "system-ui, sans-serif";
  const mono =
    css.getPropertyValue("--font-geist-mono").trim() ||
    "ui-monospace, monospace";
  return { sans, mono };
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  // letterSpacing: Chrome 99+, Safari 17+. Older browsers just draw tighter.
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

/** Wraps `text` to `maxWidth`, returning the lines. */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Sky gradient with soft clouds — the same sky as the app. */
function sky(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, PALETTE.skyTop);
  g.addColorStop(0.45, PALETTE.sky);
  g.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Small tiles scaled up = soft cloud edges.
  for (const layer of [
    { seed: 11, scale: 40, coverage: 0.42, alpha: 0.35 },
    { seed: 29, scale: 70, coverage: 0.36, alpha: 0.5 },
  ]) {
    const tile = document.createElement("canvas");
    tile.width = 240;
    tile.height = Math.round((240 * h) / w);
    const tctx = tile.getContext("2d");
    if (!tctx) continue;
    drawClouds(tctx, { width: tile.width, height: tile.height, ...layer });
    ctx.globalAlpha = layer.alpha;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(tile, 0, 0, w, h);
  }
  ctx.globalAlpha = 1;
}

export async function renderShareCard(params: {
  format: ShareFormat;
  percentLived: number;
  content: ShareCardContent;
}): Promise<Blob> {
  const { format, percentLived, content } = params;
  const { width: W, height: H } = SHARE_SIZES[format];
  const story = format === "story";
  const { sans, mono } = fontFamilies();
  await Promise.all([
    document.fonts.load(`600 64px ${sans}`),
    document.fonts.load(`500 64px ${mono}`),
  ]).catch(() => undefined);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");

  // Background
  sky(ctx, W, H);

  // Black hole (rendered separately, then composited)
  const holeTop = story ? 240 : 80;
  const holeH = story ? 860 : 400;
  const hole = document.createElement("canvas");
  hole.width = W;
  hole.height = holeH;
  const hctx = hole.getContext("2d");
  if (hctx) {
    drawBlackHole(hctx, W, holeH, STILL_TIME, percentLived, makeParticles(), {
      zoom: story ? 1.55 : 1.2,
      soft: true,
    });
    ctx.drawImage(hole, 0, holeTop);
  }

  // Legibility over clouds, as in the app.
  ctx.shadowColor = "rgba(4,32,61,0.35)";
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 6;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Brand
  ctx.fillStyle = COLORS.haze;
  ctx.font = `500 ${story ? 34 : 28}px ${sans}`;
  setSpacing(ctx, story ? 12 : 10);
  ctx.fillText(content.brand, W / 2, story ? 170 : 72);
  setSpacing(ctx, 0);

  let y = holeTop + holeH + (story ? 90 : 40);

  if (content.percent) {
    ctx.fillStyle = COLORS.ink;
    ctx.font = `500 ${story ? 150 : 104}px ${mono}`;
    ctx.fillText(content.percent.value, W / 2, y + (story ? 110 : 76));
    y += story ? 150 : 100;
    // Progress bar
    const barW = story ? 640 : 560;
    const barX = (W - barW) / 2;
    ctx.fillStyle = COLORS.track;
    ctx.fillRect(barX, y, barW, 8);
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, PALETTE.halo);
    grad.addColorStop(0.5, PALETTE.cloud);
    grad.addColorStop(1, PALETTE.cyan);
    ctx.fillStyle = grad;
    ctx.fillRect(
      barX,
      y,
      (barW * Math.min(100, Math.max(0, percentLived))) / 100,
      8,
    );
    y += story ? 70 : 54;
    ctx.fillStyle = COLORS.haze;
    ctx.font = `400 ${story ? 38 : 30}px ${sans}`;
    ctx.fillText(content.percent.caption, W / 2, y);
    y += story ? 110 : 70;
  }

  ctx.font = `500 ${story ? 48 : 36}px ${sans}`;
  for (const line of content.lines) {
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(line, W / 2, y);
    y += story ? 76 : 54;
  }

  // Footer
  ctx.fillStyle = COLORS.haze;
  ctx.font = `400 ${story ? 36 : 28}px ${sans}`;
  const taglineLines = wrap(ctx, content.tagline, W - 200);
  let fy =
    H - (story ? 170 : 92) - (taglineLines.length - 1) * (story ? 48 : 38);
  for (const l of taglineLines) {
    ctx.fillText(l, W / 2, fy);
    fy += story ? 48 : 38;
  }
  ctx.fillStyle = COLORS.mist;
  ctx.font = `500 ${story ? 36 : 28}px ${mono}`;
  ctx.fillText(content.host, W / 2, H - (story ? 96 : 44));

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    ),
  );
}
