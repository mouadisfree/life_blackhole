# Life Blackhole — Build Prompt for Claude Code

> Paste this whole file into Claude Code (or save it in the repo root as `PROMPT.md` and tell Claude Code: "Read PROMPT.md and follow it phase by phase").

---

## 0. How I want you to work

- You are the lead engineer and designer on this project. Build it **from empty folder to deployed production app**.
- Work in **phases** (section 9). At the end of each phase: run the app, run lint + typecheck + tests, fix every error, commit with a clear message, then give me a short summary and **stop for my approval** before the next phase.
- Before writing code in Phase 1, show me a plan: folder structure, packages with versions, and anything in this prompt you think is wrong or could be better. Push back if you disagree.
- **Check current versions** of every framework and library before installing (don't rely on memory). Use the latest stable releases.
- Keep a `PROGRESS.md` in the repo: what's done, what's next, decisions made and why.
- Keep a `CLAUDE.md` with project conventions so future sessions stay consistent.
- Never fake data. If a number in the UI depends on a dataset, the dataset must be real and its source cited in the code and in the app's "About" page.
- Ask me before: adding paid services, adding a database, adding analytics, or changing the stack.

---

## 1. The idea

**Life Blackhole** is a web app that shows you, in real time, how much of your life you've lived and roughly how much is left — visualised as a black hole slowly pulling your time in.

- You enter your birth date (and optionally country + sex for a better estimate).
- You see live counters ticking every second: time lived and estimated time remaining.
- The centrepiece is a beautiful, animated black hole. Your remaining time is the glowing matter orbiting it; your lived time is what has already crossed the event horizon.
- The point is **not** to scare people. The point is a "memento mori" wake-up: *time is finite, so use it*. Tone: cinematic, calm, a bit poetic, motivating — never morbid, never medical.

**One-line pitch:** "Watch your time fall into the black hole. Then go do something with what's left."

**Target user:** 16–35, on mobile, coming from TikTok / Instagram / YouTube. They open it, get a "whoa" moment in under 10 seconds, screenshot or share it, and maybe come back.

---

## 2. Core principles

1. **Wow in 10 seconds.** Landing → birth date → black hole animation with live numbers. No sign-up, no friction.
2. **Mobile-first.** Most traffic comes from short-form video. Design for a 390px wide phone first, then scale up.
3. **Shareable.** Every result can become a beautiful share image (9:16 for stories and 1:1 for posts).
4. **Private by default.** Birth date and personal data stay in the user's browser (localStorage). No account needed. No personal data sent to a server in the MVP.
5. **Honest.** Life expectancy is a statistical average, not a prediction. Say so clearly but elegantly.
6. **Fast.** Lighthouse performance ≥ 90 on mobile. The 3D scene must degrade gracefully on weak phones.

---

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router), TypeScript, strict mode** | SEO for landing page, OG image generation, easy Vercel deploy |
| Styling | **Tailwind CSS** + **shadcn/ui** for basic components | Fast, consistent |
| Animation | **Framer Motion** (UI) | Smooth transitions |
| Black hole visual | **react-three-fiber + drei + a custom GLSL shader** | Real "event horizon" look: accretion disk, gravitational lensing feel, particles |
| Fallback visual | **2D canvas** version for low-power devices / `prefers-reduced-motion` | Performance + accessibility |
| State | **Zustand** with `persist` middleware (localStorage) | Simple, no backend needed |
| Dates | **date-fns** | Correct date math, time zones |
| Share images | **next/og (`ImageResponse`)** route + client-side download | Dynamic OG + downloadable story cards |
| i18n | **next-intl** — English first, structure ready for French + Arabic (RTL) | Future reach |
| Testing | **Vitest** (logic) + **Playwright** (main flow on mobile viewport) | Life math must be correct |
| Lint/format | ESLint + Prettier | |
| Analytics | **Vercel Analytics** (privacy-friendly, no cookies) — ask me first | |
| Hosting | **Vercel** | |
| Package manager | **pnpm** | |

No database and no auth in the MVP. Design the code so adding Supabase later (accounts, sync across devices) is easy, but don't add it now.

---

## 4. Data & the life math

### 4.1 Life expectancy data
- Use **real public data**: WHO Global Health Observatory or UN World Population Prospects — life expectancy by **country** and **sex**.
- Better than "life expectancy at birth": use **remaining life expectancy at current age** from period life tables (someone who is 30 today has a higher total expectancy than the at-birth number). If age-specific tables are available for a country, use them; otherwise fall back to at-birth data, and if no country is given, use the global average.
- Download the data once, clean it with a script in `/scripts`, and ship it as a small static JSON in `/data`. Record the source, year, and URL in `/data/README.md` and on the About page.
- Write a pure function: `getExpectedLifespan({ birthDate, country?, sex? }) => { expectedDeathDate, expectedTotalYears, source }`.

### 4.2 Counters (all computed client-side, updated every second via `requestAnimationFrame` or a 1s interval)
- **Lived:** years, months, days, hours, minutes, seconds — plus total days and total seconds.
- **Remaining (estimate):** same units.
- **Percentage of life lived**, to 4 decimals, ticking up live.
- If the user is past their statistical expectancy: don't show negative numbers. Switch to a special state: *"You've outlived the average. Every day now is bonus time."*

### 4.3 "Perspective" stats (fun, shareable)
Based on remaining time, show estimates such as:
- Weekends left, summers left, full moons left
- Approx. heartbeats so far (avg ~70 bpm) and breaths so far
- Hours of sleep so far (~1/3 of life)
- Books you could still read at 1/month, sunrises left
Label all of these as rough estimates. Keep the list in one config file so I can add more.

### 4.4 Tests
Write Vitest tests for: leap years, birthdays on Feb 29, time zones, birth date today, birth date in the future (reject), very old ages, past-expectancy state, rounding of percentages.

---

## 5. Features

### MVP (must have)
1. **Landing page** — dark, space aesthetic, the black hole idle in the background, headline + one input: birth date. Optional "Improve accuracy" expander for country + sex.
2. **Main screen ("The Horizon")**
   - Full-screen black hole scene.
   - Big live counter: time remaining (seconds ticking).
   - Secondary: time lived, % lived, progress ring or bar.
   - Tap/scroll to reveal the perspective stats.
   - The visual reacts to the data: the % lived controls how much matter has already fallen in / how large the event horizon is.
3. **Life in weeks grid** — ~4,000 dots (one per week of an expected life), lived weeks filled, current week pulsing. Scrollable on mobile.
4. **Share**
   - "Share my horizon" button → generates a 9:16 story image and a 1:1 post image with: % lived, remaining time, a mini black hole render, and the app URL.
   - Use the Web Share API on mobile, download fallback on desktop.
   - The user chooses what to show (e.g. hide exact birth date — never print it by default).
5. **Settings** — edit birth date / country / sex, switch between units, **hide the countdown** (some people just want the weeks grid), toggle sound, toggle reduced motion, delete all my data (clears localStorage).
6. **About page** — what the numbers mean, data sources, "this is an average, not your fate", privacy note (nothing leaves your device).
7. **Gentle wellbeing footer** — a small, calm line on the About page and settings: if thinking about mortality feels heavy right now, it's okay to close this and talk to someone you trust. Keep it subtle and kind, not alarming.

### V2 (build later, only after I approve)
- Optional accounts (Supabase) to sync across devices.
- "Intentions": user writes 3 things they want to do with their remaining time; shown orbiting the black hole.
- Daily "time spent" reminder / PWA push notification.
- PWA install (offline support, home-screen icon).
- Lifestyle questions (sleep, smoking, exercise) that adjust the estimate — only with credible cited sources, small capped adjustments, and a clear "rough estimate" label. No medical claims.
- French + Arabic (RTL) + Darija translations.
- Ambient soundtrack.

---

## 6. Design direction

- **Mood:** Interstellar meets Apple. Deep black, cinematic, minimal. Lots of negative space.
- **Colors:** background near-black (#05050A), accretion glow in warm orange → gold → white (#FF6B1A, #FFB347, #FFF4E0), cool accents in deep violet/blue for UI details. Define everything as CSS variables / Tailwind tokens.
- **Typography:** a clean geometric sans for UI (e.g. Inter or Geist) + a **monospace** with tabular numbers for counters so digits don't jump.
- **Motion:** slow, heavy, gravitational. Counters tick smoothly. Page transitions feel like being pulled in. Respect `prefers-reduced-motion`.
- **Black hole scene:** dark sphere (event horizon), bright rotating accretion disk, photon ring, subtle lensing distortion, star field background, particles spiralling inward. Use a GLSL shader for the disk. Cap pixel ratio on mobile; detect low-end GPUs and use the 2D fallback.
- **Copywriting:** short, poetic, confident. Examples:
  - "Every second, a little more of you falls in."
  - "You have about 2,847 weekends left. Make them count."
  - "This is an average. You are not."

---

## 7. Project structure (suggested — improve it if you have a better idea)

```
/app
  /(marketing)/page.tsx        landing
  /horizon/page.tsx            main screen
  /weeks/page.tsx              life in weeks
  /settings/page.tsx
  /about/page.tsx
  /api/og/route.tsx            share image generation
/components
  /blackhole/                  Scene.tsx, AccretionDisk shader, Particles, Fallback2D.tsx
  /counters/                   LiveCounter.tsx, ProgressRing.tsx
  /stats/                      PerspectiveStats.tsx
  /share/                      ShareSheet.tsx, StoryCard.tsx
  /ui/                         shadcn components
/lib
  life-math.ts                 pure functions (tested)
  life-expectancy.ts           data lookup
  perspective-stats.ts         stats config + calculators
  store.ts                     Zustand + persist
/data                          life expectancy JSON + README with sources
/scripts                       data download/cleaning script
/tests                         vitest + playwright
```

---

## 8. Quality bar

- TypeScript strict, no `any`.
- All life math in pure, tested functions in `/lib` — UI never does date math directly.
- Accessibility: keyboard navigable, proper labels, color contrast AA, counters have an `aria-live="off"` main display plus a readable summary (screen readers must not be spammed every second).
- SEO: metadata, Open Graph, Twitter card, sitemap, robots.txt, favicon set, manifest.
- Performance: lazy-load the 3D scene, show the 2D fallback / skeleton while loading, keep JS bundle lean.
- Errors: error boundary around the 3D canvas (WebGL can fail) → fallback to 2D.
- Security: no personal data in URLs or logs. Share images must never include the birth date unless the user turns it on.

---

## 9. Build phases (stop for my approval after each)

**Phase 1 — Setup & plan**
Show me the plan first. Then: init Next.js + TS + Tailwind + shadcn + ESLint/Prettier + Vitest + Playwright, design tokens, base layout, CLAUDE.md, PROGRESS.md, git init.

**Phase 2 — Life math & data**
Data script + cleaned JSON with sources, `life-math.ts`, `life-expectancy.ts`, `perspective-stats.ts`, full Vitest coverage. No UI yet except a debug page that prints the numbers.

**Phase 3 — Core flow (no fancy visuals yet)**
Landing → birth date input (+ optional country/sex) → Horizon page with live counters, % lived, perspective stats. Zustand persistence. Settings + delete data.

**Phase 4 — The black hole**
react-three-fiber scene with shader accretion disk, particles, star field, data-driven horizon. 2D canvas fallback, reduced-motion support, low-end device detection, error boundary. Test on a mobile viewport.

**Phase 5 — Life in weeks + polish**
Weeks grid, animations, copywriting pass, About page, wellbeing note, accessibility pass.

**Phase 6 — Share**
`/api/og` route, 9:16 and 1:1 cards, Web Share API + download fallback, privacy toggles.

**Phase 7 — Launch prep**
SEO, sitemap, OG images, favicon/manifest, Lighthouse audit (fix until ≥ 90 mobile), Playwright end-to-end test of the full flow, README with setup + deploy steps.

**Phase 8 — Deploy**
Walk me through deploying to Vercel (connect GitHub repo, env vars if any, custom domain). Add Vercel Analytics only if I approve. Give me a launch checklist.

---

## 10. Definition of done (launch)

- [ ] A new visitor on a phone gets from landing to animated black hole with live numbers in under 10 seconds.
- [ ] All life math is tested and data sources are cited.
- [ ] Share image works on iPhone Safari and Android Chrome.
- [ ] Works with WebGL off (2D fallback) and with reduced motion.
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.
- [ ] No personal data leaves the device.
- [ ] Deployed on Vercel with a custom domain.

Start with Phase 1: show me your plan and any objections to this prompt before writing code.
