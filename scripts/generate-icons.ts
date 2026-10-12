/**
 * Renders the app icon (one SVG source) to every size the site needs:
 *   app/icon.svg, app/favicon.ico (16+32), app/apple-icon.png (180),
 *   public/icons/icon-192.png, icon-512.png, maskable-512.png
 *
 * Usage: pnpm icons   (uses Playwright's Chromium to rasterise)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

/** `pad` shrinks the artwork into the maskable safe zone (inner 80%). */
function iconSvg({ pad = 0, rounded = true } = {}): string {
  const s = 512;
  const inner = s * (1 - pad * 2);
  const k = inner / 512;
  const o = s * pad;
  const t = (v: number) => o + v * k;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="30%" stop-color="#ff6b1a" stop-opacity="0.75"/>
      <stop offset="62%" stop-color="#ff6b1a" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#05050a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="disk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff6b1a" stop-opacity="0"/>
      <stop offset="25%" stop-color="#ffb347"/>
      <stop offset="50%" stop-color="#fff4e0"/>
      <stop offset="75%" stop-color="#ffb347"/>
      <stop offset="100%" stop-color="#ff6b1a" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" rx="${rounded ? 112 : 0}" fill="#05050a"/>
  <circle cx="${t(256)}" cy="${t(256)}" r="${236 * k}" fill="url(#glow)"/>
  <ellipse cx="${t(256)}" cy="${t(268)}" rx="${222 * k}" ry="${40 * k}" fill="none" stroke="url(#disk)" stroke-width="${22 * k}"/>
  <circle cx="${t(256)}" cy="${t(256)}" r="${112 * k}" fill="#000"/>
  <circle cx="${t(256)}" cy="${t(256)}" r="${118 * k}" fill="none" stroke="#fff4e0" stroke-width="${10 * k}"/>
  <path d="M ${t(34)} ${t(268)} A ${222 * k} ${40 * k} 0 0 0 ${t(478)} ${t(268)}" fill="none" stroke="url(#disk)" stroke-width="${22 * k}"/>
</svg>`;
}

/** ICO container holding PNG images (supported by every current browser). */
function ico(pngs: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt8(0, e + 2);
    header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const render = async (svg: string, size: number) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`,
    );
    return page.screenshot({
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size },
    });
  };

  mkdirSync("public/icons", { recursive: true });
  const svg = iconSvg();
  writeFileSync("app/icon.svg", svg + "\n");
  writeFileSync(
    "app/apple-icon.png",
    await render(iconSvg({ rounded: false }), 180),
  );
  writeFileSync("public/icons/icon-192.png", await render(svg, 192));
  writeFileSync("public/icons/icon-512.png", await render(svg, 512));
  writeFileSync(
    "public/icons/maskable-512.png",
    await render(iconSvg({ pad: 0.1, rounded: false }), 512),
  );
  writeFileSync(
    "app/favicon.ico",
    ico([
      { size: 16, data: await render(svg, 16) },
      { size: 32, data: await render(svg, 32) },
    ]),
  );
  await browser.close();
  console.log("Icons written.");
}

await main();
