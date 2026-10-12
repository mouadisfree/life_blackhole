# Progress

Build spec: [PROMPT.md](PROMPT.md). Conventions: [CLAUDE.md](CLAUDE.md).

## Status

| Phase                      | Status                              |
| -------------------------- | ----------------------------------- |
| 1 — Setup & plan           | Done 2026-10-12 — awaiting approval |
| 2 — Life math & data       | Not started                         |
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

## Next

- Phase 2: data script + cleaned UN WPP life tables with sources, `life-math.ts`, `life-expectancy.ts`, `perspective-stats.ts`, full Vitest coverage, debug page.

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
