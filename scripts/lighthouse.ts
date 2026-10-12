/**
 * Lighthouse (mobile preset) against a running production server.
 *
 *   pnpm build && pnpm start --port 3300 &
 *   pnpm lighthouse            # or BASE_URL=https://… pnpm lighthouse
 *
 * Seeds a sample profile in localStorage first so /horizon and /weeks can be
 * audited too. Reports go to lighthouse-reports/ (gitignored).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3300";
// Personal pages are noindex on purpose, so the SEO target only applies to public ones.
const PAGES = [
  { path: "/", indexable: true },
  { path: "/about", indexable: true },
  { path: "/horizon", indexable: false },
  { path: "/weeks", indexable: false },
];
const PORT = 9333;
const TARGETS = {
  performance: 90,
  accessibility: 95,
  "best-practices": 90,
  seo: 95,
};

const sampleProfile = {
  state: {
    profile: {
      birth: { date: "1996-03-14", timeZone: "UTC" },
      country: "MAR",
      sex: "female",
    },
    settings: {
      unit: "calendar",
      hideCountdown: false,
      sound: false,
      motion: "system",
    },
    birthdayBonusSeenAge: 30,
  },
  version: 1,
};

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromium.executablePath(),
    headless: true,
    args: [`--remote-debugging-port=${PORT}`],
  });
  const page = await browser.newPage();
  await page.goto(`${BASE}/about`);
  await page.evaluate(
    (d) => localStorage.setItem("life-blackhole", d),
    JSON.stringify(sampleProfile),
  );
  await page.close();

  mkdirSync("lighthouse-reports", { recursive: true });
  const rows: string[] = [];
  let failed = false;
  for (const { path, indexable } of PAGES) {
    const result = await lighthouse(`${BASE}${path}`, {
      port: PORT,
      output: "html",
      logLevel: "error",
      disableStorageReset: true,
    });
    if (!result) throw new Error(`No result for ${path}`);
    const name = path === "/" ? "landing" : path.slice(1);
    writeFileSync(`lighthouse-reports/${name}.html`, String(result.report));
    const scores = Object.fromEntries(
      Object.entries(result.lhr.categories).map(([k, c]) => [
        k,
        Math.round((c.score ?? 0) * 100),
      ]),
    ) as Record<keyof typeof TARGETS, number>;
    const misses = (Object.keys(TARGETS) as (keyof typeof TARGETS)[]).filter(
      (k) => (k !== "seo" || indexable) && scores[k] < TARGETS[k],
    );
    if (misses.length) failed = true;
    const lcp = result.lhr.audits["largest-contentful-paint"]?.displayValue;
    const tbt = result.lhr.audits["total-blocking-time"]?.displayValue;
    const cls = result.lhr.audits["cumulative-layout-shift"]?.displayValue;
    rows.push(
      `${path.padEnd(9)} perf ${scores.performance}  a11y ${scores.accessibility}  bp ${scores["best-practices"]}  seo ${scores.seo}  | LCP ${lcp}  TBT ${tbt}  CLS ${cls}${misses.length ? "  ✗ " + misses.join(",") : ""}`,
    );
  }
  await browser.close();
  console.log(rows.join("\n"));
  if (failed) process.exitCode = 1;
}

await main();
