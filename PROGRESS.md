# Progress

Build spec: [PROMPT.md](PROMPT.md). Conventions: [CLAUDE.md](CLAUDE.md).

## Status

| Phase | Status |
|---|---|
| 1 — Setup & plan | In progress: plan approved 2026-10-12; git, docs done; scaffold blocked on Node toolchain |
| 2 — Life math & data | Not started |
| 3 — Core flow | Not started |
| 4 — The black hole | Not started |
| 5 — Life in weeks + polish | Not started |
| 6 — Share | Not started |
| 7 — Launch prep | Not started |
| 8 — Deploy | Not started |

## Done

- 2026-10-12 — Phase 1 plan approved. `git init`, `.gitignore`, `CLAUDE.md`, `PROGRESS.md`.

## Next

- Install Node 24 LTS + pnpm (no Node on this machine yet).
- Scaffold Next.js 16 + TS 6 + Tailwind v4 + shadcn, ESLint/Prettier, Vitest, Playwright, design tokens, base layout, next-intl wiring.

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
