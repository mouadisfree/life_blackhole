# Progress

Build spec: [PROMPT.md](PROMPT.md). Conventions: [CLAUDE.md](CLAUDE.md).

## Status

| Phase                      | Status                              |
| -------------------------- | ----------------------------------- |
| 1 — Setup & plan           | Done 2026-10-12 (approved)          |
| 2 — Life math & data       | Done 2026-10-12 — awaiting approval |
| 3 — Core flow              | Not started                         |
| 4 — The black hole         | Not started                         |
| 5 — Life in weeks + polish | Not started                         |
| 6 — Share                  | Not started                         |
| 7 — Launch prep            | Not started                         |
| 8 — Deploy                 | Not started                         |

## Done

### Phase 1 — Setup (2026-10-12)

- Project-local toolchain: Node 24.21.0 in `.tools/node` (checksum-verified, gitignored), pnpm 12.11.2 via corepack.
- Next.js 16.4 (App Router, Turbopack, Cache Components) · React 19.3 · TS 6.0.3 strict (+ `noUncheckedIndexedAccess`).
- Tailwind v4 brand tokens in `app/globals.css` (void / ember / gold / flare / violet / nebula / starlight / dust), mapped onto shadcn semantic tokens. Dark-only. `counter` utility (mono + tabular nums). Reduced-motion base rule.
- shadcn/ui (radix-nova preset, RTL enabled) with `Button`.
- next-intl wired without locale routing; typed messages via `global.d.ts`; `dir` derived from locale.
- ESLint 10 (next core-web-vitals + TS + prettier) · Prettier + Tailwind plugin.
- Vitest 5 + jsdom + Testing Library (smoke test) · Playwright on iPhone 15 + Pixel 7 profiles (smoke test).
- Placeholder landing proving tokens, fonts and i18n. Production build: all routes static.

### Phase 2 — Life math & data (2026-10-12)

- `scripts/build-life-tables.ts` (Node built-in TS): streams the UN WPP 2024 abridged life table CSV, keeps 2026 / medium variant / 237 countries + World / both·female·male / ages 0,1,5…100+, validates, writes `data/life-tables.json` (107 KB, 40 KB gzip). `pnpm data:download`, `pnpm data:build`. Source, year, URL, citation and licence note in `data/README.md` and in the JSON itself.
- `lib/life-math.ts`: birth validation (local date/time + IANA zone → instant; invalid / future / too-old), consistent birthdays & whole-year age (Feb 29 → Feb 28), DST-aware breakdowns and totals, floored % lived, snapshot with no negatives.
- `lib/life-expectancy.ts`: table resolution (country+sex → World fallback), linear interpolation of e(x), `getExpectedLifespan` (D2 yearly step), `getBirthdayBonus` (for Phase 5), lazy `loadLifeTables()`.
- `lib/perspective-stats.ts`: config-driven stats (weekends, summers, full moons, sunrises, books left; heartbeats, breaths, sleep so far) with assumptions in one place; copy in `messages/en.json` → `Stats`.
- 55 Vitest tests, also run with host TZ = Pacific/Chatham and America/St_Johns (`pnpm test:tz`, part of `pnpm check`) to prove results don't depend on the machine's zone.
- `/debug` (dev only, 404 in production) prints all numbers live.

## Next

- Phase 3: landing → birth date (+ optional country/sex) → Horizon page with live counters, % lived, perspective stats; Zustand persistence; settings + delete data. Country names via `Intl.DisplayNames` from ISO2.

## Decisions

### D1 — Share cards are generated client-side (2026-10-12)

Personal 9:16 / 1:1 share cards are rendered in the browser and shared via the Web Share API or downloaded. `/api/og` (or `app/opengraph-image.tsx`) exists only for the generic, non-personal link-preview image.
**Why:** a server route would need % lived / remaining time in the URL, which leaks approximate age and breaks "no personal data leaves the device".

### D2 — Expected death date is recalculated once a year, on the birthday (2026-10-12)

Remaining life expectancy is looked up for the user's age in whole years and held constant until their next birthday, when it is recomputed and the horizon moves back by a few weeks.
**Why:** continuous recomputation makes the countdown tick at ~0.8 s per real second and visibly stall; a yearly step keeps the counter honest and monotonic within each year.
**Follow-up:** a small "birthday bonus" moment showing how far the horizon moved back — **build in Phase 5**, not before.

### D3 — TypeScript 6.0.x, not 7.x (2026-10-12)

typescript-eslint 8.71 supports `typescript <6.1`. Revisit when it supports TS 7.

### D4 — React pinned to 19.3.x (2026-10-12)

@react-three/fiber 9.8 requires `react <19.4`.

### D5 — `motion` package instead of `framer-motion` (2026-10-12)

Same library under its current name; import from `motion/react`.

### D6 — Life tables from UN World Population Prospects (2026-10-12)

WPP abridged life tables give remaining life expectancy e(x) by age, country and sex; WHO GHO only offers e(0) and e(60). Exact edition confirmed in Phase 2.

### D7 — next-intl without locale URL prefix until a second locale ships (2026-10-12)

All copy in `messages/en.json`; logical CSS properties (`ms-`/`me-`, `start`/`end`) for future RTL.

### D8 — WebGL only where it earns its weight (2026-10-12)

Landing uses a lightweight CSS/canvas black hole; the three.js scene is lazy-loaded after first paint, primarily on `/horizon`. Low-end devices → 2D fallback; reduced motion → near-still scene.

### D9 — Optional birth time; "prefer not to say" for sex (2026-10-12)

Birth time defaults to 00:00 local. "Prefer not to say" uses the both-sexes table.

### D10 — ESLint 10 despite plugin peer warnings (2026-10-12)

ESLint 9 is end-of-life. eslint-config-next 16.4 accepts `eslint >=9`, but its bundled react/import/jsx-a11y plugins still declare peers up to ESLint 9. Lint runs cleanly on 10; revisit if a rule breaks.

### D11 — Respect pnpm's minimum-release-age policy (2026-10-12)

pnpm 12 rejects packages published less than ~1 day ago. vitest 5.0.4 (published the same day) was rejected, so we pin 5.0.3. Keep the policy on as supply-chain protection.

### D12 — `cn` package instead of clsx + tailwind-merge (2026-10-12)

shadcn 4.21 generates components that import `cn` from the `cn` package (shadcn-ui/cn, maintained by shadcn, zero deps, no install scripts). clsx and tailwind-merge were removed as redundant.

### D13 — Build scripts denied for sharp, unrs-resolver, @parcel/watcher, @swc/core (2026-10-12)

All ship prebuilt binaries; `pnpm-workspace.yaml` `allowBuilds` keeps their install scripts off.

### D14 — WPP 2024, year 2026, medium variant (2026-10-12)

WPP 2024 is the latest edition (no WPP 2026 files exist yet). It gives estimates through 2023 and projections afterwards; we use the current year's (2026) medium-variant period table since the app is about _today_. Rebuild yearly by changing `TABLE_YEAR`.
**Licence:** the 2024 pages don't state one that we could find; earlier editions are CC BY 3.0 IGO. We attribute with UN DESA's recommended citation.

### D15 — Abridged (5-year) tables + linear interpolation (2026-10-12)

e(x) is smooth, so interpolating between 5-year ages is accurate to well under a month, at ~⅓ the size of single-age tables. Ages ≥ 100 use the open 100+ value.

### D16 — "Outlived the average" means past e(0) (2026-10-12)

Remaining life expectancy at your age is always positive (it's conditional on having survived), so you can never "pass" it. The bonus-time state from PROMPT.md §4.2 triggers when the user has lived longer than **life expectancy at birth** for their table; the remaining estimate stays positive and the UI reframes it. Remaining time is also clamped to 0 as a guard.

### D17 — Birthdays and calendar math in the user's IANA zone (2026-10-12)

Birth is stored as local date + optional time + IANA zone and converted to an instant with `@date-fns/tz`. Feb 29 birthdays fall on Feb 28 in non-leap years, applied consistently to age and anniversaries.

### D18 — Perspective-stat choices (2026-10-12)

Summers = whole remaining years (hemisphere-neutral). Weekends = Saturdays from today until the expected date. Heart rate 70 bpm (spec), breathing 15/min (adult resting range 12–20), sleep ⅓ of life, synodic month 29.53 days, 1 book/month. All labelled as rough estimates.
