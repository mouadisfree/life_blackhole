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

const COLORS = {
  void: "#05050a",
  starlight: "#eeebf3",
  dust: "#9d99ad",
  gold: "#ffb347",
  ember: "#ff6b1a",
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

/** Deterministic background stars. */
function stars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  let s = 42;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 220; i++) {
    ctx.globalAlpha = 0.15 + rand() * 0.55;
    ctx.fillStyle = COLORS.starlight;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, rand() * 1.6 + 0.3, 0, Math.PI * 2);
    ctx.fill();
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
  ctx.fillStyle = COLORS.void;
  ctx.fillRect(0, 0, W, H);
  stars(ctx, W, H);

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

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Brand
  ctx.fillStyle = COLORS.dust;
  ctx.font = `500 ${story ? 34 : 28}px ${sans}`;
  setSpacing(ctx, story ? 12 : 10);
  ctx.fillText(content.brand, W / 2, story ? 170 : 72);
  setSpacing(ctx, 0);

  let y = holeTop + holeH + (story ? 90 : 40);

  if (content.percent) {
    ctx.fillStyle = COLORS.starlight;
    ctx.font = `500 ${story ? 150 : 104}px ${mono}`;
    ctx.fillText(content.percent.value, W / 2, y + (story ? 110 : 76));
    y += story ? 150 : 100;
    // Progress bar
    const barW = story ? 640 : 560;
    const barX = (W - barW) / 2;
    ctx.fillStyle = "#1c1b2b";
    ctx.fillRect(barX, y, barW, 8);
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, "#fff4e0");
    grad.addColorStop(0.5, COLORS.gold);
    grad.addColorStop(1, COLORS.ember);
    ctx.fillStyle = grad;
    ctx.fillRect(
      barX,
      y,
      (barW * Math.min(100, Math.max(0, percentLived))) / 100,
      8,
    );
    y += story ? 70 : 54;
    ctx.fillStyle = COLORS.dust;
    ctx.font = `400 ${story ? 38 : 30}px ${sans}`;
    ctx.fillText(content.percent.caption, W / 2, y);
    y += story ? 110 : 70;
  }

  ctx.font = `500 ${story ? 48 : 36}px ${sans}`;
  for (const line of content.lines) {
    ctx.fillStyle = COLORS.starlight;
    ctx.fillText(line, W / 2, y);
    y += story ? 76 : 54;
  }

  // Footer
  ctx.fillStyle = COLORS.dust;
  ctx.font = `400 ${story ? 36 : 28}px ${sans}`;
  const taglineLines = wrap(ctx, content.tagline, W - 200);
  let fy =
    H - (story ? 170 : 92) - (taglineLines.length - 1) * (story ? 48 : 38);
  for (const l of taglineLines) {
    ctx.fillText(l, W / 2, fy);
    fy += story ? 48 : 38;
  }
  ctx.fillStyle = COLORS.gold;
  ctx.font = `500 ${story ? 36 : 28}px ${mono}`;
  ctx.fillText(content.host, W / 2, H - (story ? 96 : 44));

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    ),
  );
}
