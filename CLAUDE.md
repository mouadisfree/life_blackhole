# Life Blackhole — conventions

Spec: `PROMPT.md`. Status and decisions: `PROGRESS.md` (update it at the end of every phase; add new decisions under "Decisions" with a **Why**).

## Workflow

- Work phase by phase. End of each phase: run the app, `pnpm lint`, `pnpm typecheck`, `pnpm test`, fix everything, commit, summarise, **stop for approval**.
- Ask before: paid services, a database, analytics, or changing the stack.
- Check the npm registry for current versions before adding a dependency. Pin exact versions.

## Toolchain

Node is project-local (no system Node on this machine). Before any `pnpm` command:

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
```

Scripts: `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` (runs `next typegen` first) · `pnpm test` · `pnpm test:e2e` · `pnpm check` (lint + typecheck + format + unit tests).

## Environment

`NEXT_PUBLIC_SITE_URL` — public site URL (metadata, OG, host on share cards). Copy `.env.example` to `.env.local` for local overrides.

## Stack

Next.js 16 (App Router, Turbopack, Cache Components) · React 19.3 · TypeScript 6.0 strict · Tailwind v4 (tokens in `app/globals.css` `@theme`) · shadcn/ui · `motion` (`motion/react`) · react-three-fiber + drei · Zustand (`persist`) · date-fns v4 · next-intl · Vitest · Playwright · pnpm · Vercel.

## Code rules

- Next 16 differs from older docs: read `node_modules/next/dist/docs/` before using an unfamiliar API (see `AGENTS.md`).
- `cn` comes from the `cn` package (`@/lib/utils` re-exports it).
- No `any`. No non-null assertions without a comment saying why.
- **All date/life math lives in pure functions in `lib/`**, with colocated `*.test.ts`. Components never do date arithmetic.
- Never fake data. Any number derived from a dataset must cite the source in code and on the About page.
- All user-facing copy goes through next-intl (`messages/en.json`). Use logical CSS (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`) — RTL is coming.
- Counters use the mono font with `tabular-nums`. Live counters are `aria-live="off"`; provide a separate readable summary.
- Respect `prefers-reduced-motion` and the in-app reduced-motion setting.

## Privacy (hard rules)

- Birth date and profile live only in localStorage (Zustand persist). Nothing personal goes to a server, URL, query string, or log.
- Personal share cards are generated client-side. The OG route is generic only.
- Share cards never show the birth date unless the user turns it on.

## Layout

`app/` routes · `components/{blackhole,counters,stats,share,ui,providers}` · `lib/` pure logic + tests · `messages/` i18n · `data/` cleaned JSON + README with sources · `scripts/` data pipeline · `tests/e2e/` Playwright.
