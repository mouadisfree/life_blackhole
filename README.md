# Life Blackhole

the link : https://life-blackhole.vercel.app/

> Watch your time fall into the black hole. Then go do something with what's left.

A calm, cinematic memento mori. Enter your birth date and see — live, to the second — how much of an average life you've lived and roughly how much is left, visualised as a black hole slowly pulling your time in.

- **Private by default.** Your birth date stays in your browser (localStorage). No account, no server, no tracking of personal data. Share images are rendered on your device.
- **Honest numbers.** Remaining life expectancy at your age, by country and sex, from the UN [World Population Prospects 2024](https://population.un.org/wpp/) (2026 period life tables). An average, not a prediction — see [`data/README.md`](data/README.md) and the in-app About page.
- **Mobile first.** WebGL black hole with a 2D canvas fallback, reduced-motion support, Lighthouse mobile ≥ 95 on public pages.

## Features

| Screen      | What it does                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/`         | Birth date (+ optional country, sex, birth time). Idle 2D black hole.                                                                 |
| `/horizon`  | Data-driven black hole, live remaining/lived counters (calendar · days · seconds), % lived, perspective stats, birthday bonus, share. |
| `/weeks`    | Your life in weeks: one row per year, ~4,000 dots, this week pulsing.                                                                 |
| `/settings` | Edit details, units, hide countdown, motion, delete all data.                                                                         |
| `/about`    | Method, data source and citation, assumptions, privacy.                                                                               |

## Stack

Next.js 16 (App Router, Turbopack, Cache Components) · React 19.3 · TypeScript 6 (strict) · Tailwind CSS 4 · shadcn/ui · motion · react-three-fiber + drei + GLSL · Zustand · date-fns 4 · next-intl · Vitest · Playwright · pnpm. Decisions and reasons are logged in [`PROGRESS.md`](PROGRESS.md); conventions in [`CLAUDE.md`](CLAUDE.md).

## Getting started

Requires **Node 24** and **pnpm 12** (`.node-version`, `packageManager` in `package.json`).

```bash
pnpm install
cp .env.example .env.local      # optional: set NEXT_PUBLIC_SITE_URL
pnpm dev                        # http://localhost:3000
```

> On the original dev machine Node lives in `.tools/node` (no system Node). There, run `export PATH="$PWD/.tools/node/bin:$PATH"` first.

### Scripts

| Command                                        |                                                                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev` / `pnpm build` / `pnpm start`       | Develop / production build / serve the build                                                                                                                 |
| `pnpm lint` · `pnpm typecheck` · `pnpm format` | ESLint · `next typegen` + `tsc` · Prettier                                                                                                                   |
| `pnpm test` · `pnpm test:tz`                   | Vitest (also run under two unusual host time zones)                                                                                                          |
| `pnpm test:e2e`                                | Playwright on iPhone 15 (WebKit) + Pixel 7 (Chromium), incl. axe accessibility checks. First run: `pnpm exec playwright install chromium webkit`             |
| `pnpm check`                                   | lint + typecheck + format check + unit tests (+ time-zone run)                                                                                               |
| `pnpm lighthouse`                              | Lighthouse mobile on `/`, `/about`, `/horizon`, `/weeks` against a running build (`pnpm build && pnpm start --port 3300`). Reports in `lighthouse-reports/`. |
| `pnpm data:download` · `pnpm data:build`       | Fetch the UN WPP CSV (~149 MB) and rebuild `data/life-tables.json` + `public/data/`                                                                          |
| `pnpm icons`                                   | Regenerate favicon, Apple and PWA icons from the SVG source                                                                                                  |

## Project layout

```
app/             routes: / · (app)/{horizon,weeks,settings} · about · api/og · sitemap · robots · manifest
components/      blackhole/ (scene, shaders, 2D renderer) · counters/ · stats/ · share/ · weeks/ · ui/
lib/             pure, tested logic: life-math, life-expectancy, perspective-stats, weeks, birthday, share-card, store
messages/en.json all copy (next-intl; FR/AR planned)
data/            cleaned life tables + source README
scripts/         data pipeline, icons, Lighthouse
tests/e2e/       Playwright
```

## Deploying to Vercel

1. Push the repo to GitHub.
2. In Vercel: **Add New → Project**, import the repo. Framework preset **Next.js** is detected; leave build/output settings at their defaults. Vercel picks the Node major from `engines` (24). To make Vercel use exactly the pnpm in `packageManager` (12.x), add the environment variable `ENABLE_EXPERIMENTAL_COREPACK=1` — check the build log's first lines show pnpm 12.
3. **Environment variables** (Production + Preview): `NEXT_PUBLIC_SITE_URL` = your public URL, e.g. `https://lifeblackhole.app`. It's used for metadata, the sitemap, robots and the host printed on share cards. No other variables or secrets are needed.
4. Deploy. Then **Settings → Domains → Add** your domain and follow the DNS instructions (an `A` record to Vercel for the apex, `CNAME` for `www`). Update `NEXT_PUBLIC_SITE_URL` if it changed and redeploy.
5. Check `https://<domain>/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` and paste the URL into a link-preview tester to see the Open Graph image.

There is no database, no server-side storage and no analytics by default.

## Data & credits

Life expectancy: United Nations, Department of Economic and Social Affairs, Population Division (2024). _World Population Prospects 2024, Online Edition._ Abridged life tables, medium variant. See [`data/README.md`](data/README.md) for details and the licence note.

If thinking about time feels heavy right now, it's okay to close this and talk to someone you trust.
