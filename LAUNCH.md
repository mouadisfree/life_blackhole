# Launch guide

Everything is verified locally: a fresh clone installs from the lockfile and builds, all tests pass, and Lighthouse mobile scores are in `PROGRESS.md`. What's left needs your accounts.

## 1. Put the code on GitHub

Create an empty repository on github.com (no README, no .gitignore — the repo already has them). Private or public both work with Vercel. Then, in this folder:

```bash
git remote add origin https://github.com/<you>/life-blackhole.git
git push -u origin main
```

What gets pushed: source, `data/life-tables.json` + `public/data/` (the cleaned UN data, ~100 KB each), icons. **Not** pushed (gitignored): `node_modules`, `.next`, `.tools` (local Node), `data/raw` (the 149 MB UN download), `.env*`, test and Lighthouse output.

## 2. Create the Vercel project

1. vercel.com → **Add New… → Project** → import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Leave build command, output directory and install command at their defaults.
3. **Environment variables** — add to _Production_ and _Preview_:

   | Name                           | Value                                                                        | Why                                                    |
   | ------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------ |
   | `NEXT_PUBLIC_SITE_URL`         | `https://<your-domain>` (use the `*.vercel.app` URL until you have a domain) | Metadata, sitemap, robots, host printed on share cards |
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1`                                                                          | Use the exact pnpm from `package.json` (12.11.2)       |

4. **Deploy.** In the build log, check: pnpm 12.x, Node 24.x, `✓ Compiled successfully`, and the route list showing `/`, `/about`, `/horizon`, `/weeks`, `/settings`, `/api/og`.

No database, storage, secrets or paid add-ons are required.

## 3. Custom domain

1. Project → **Settings → Domains → Add** → `yourdomain.com` (Vercel offers to add `www` too and redirect one to the other).
2. At your registrar, add the DNS records Vercel shows — typically an `A` record for the apex to Vercel's IP and a `CNAME` for `www` to `cname.vercel-dns.com`. HTTPS is issued automatically once DNS resolves.
3. Update `NEXT_PUBLIC_SITE_URL` to the final domain and **redeploy** (the value is baked in at build time).

## 4. Analytics (optional — only if you approve)

Vercel Web Analytics is cookie-less and doesn't collect personal data, but it is a third-party request on every page view, so it needs a line in the About page's privacy section. If approved: `pnpm add @vercel/analytics`, render `<Analytics />` in `app/layout.tsx`, enable it in the Vercel dashboard (Analytics tab), update the privacy copy. Free tier limits apply; check current pricing before relying on it.

## 5. Launch checklist

### Before announcing

- [ ] Production deploy succeeds; build log shows pnpm 12 / Node 24.
- [ ] `NEXT_PUBLIC_SITE_URL` is the final domain; redeployed after changing it.
- [ ] `https://<domain>/robots.txt` lists the sitemap and disallows `/horizon`, `/weeks`, `/settings`.
- [ ] `https://<domain>/sitemap.xml` has only `/` and `/about` with the right domain.
- [ ] `https://<domain>/manifest.webmanifest` loads; icons show in the tab and on "Add to Home Screen".
- [ ] Paste the URL into a link-preview tester (opengraph.xyz, or a WhatsApp/iMessage/Slack message to yourself): the generic black-hole card appears.
- [ ] `/debug` returns 404 in production.

### On a real iPhone (Safari) and Android phone (Chrome)

- [ ] Landing → birth date → Horizon in under 10 seconds on mobile data.
- [ ] Black hole renders (3D on recent phones; 2D on older ones) and animates smoothly; scrolling stays smooth.
- [ ] iOS: Settings → Accessibility → Motion → Reduce Motion on → black hole is still; page transitions are minimal.
- [ ] Counters tick every second; leave the tab and come back — numbers are correct.
- [ ] **Share my horizon** → native share sheet opens with the image → post to Instagram Story / WhatsApp works; 9:16 fills a story; 1:1 fits a post.
- [ ] Birth date is not on the card unless switched on.
- [ ] Life in weeks fits the screen width; current week pulses.
- [ ] Settings → Delete all my data → back to an empty landing page.
- [ ] Add to Home Screen → opens full-screen with the right icon and dark status bar.

### Desktop

- [ ] Chrome, Safari, Firefox: landing, horizon, share (download fallback on browsers without file sharing).

### After launch

- [ ] Run `BASE_URL=https://<domain> pnpm lighthouse` against production.
- [ ] Watch Vercel's deployment and function logs for errors in the first days.
- [ ] Each January (or when WPP 2026 is published): bump `TABLE_YEAR`, `pnpm data:download && pnpm data:build`, update the year in `lib/life-expectancy.ts` (`LIFE_TABLES_URL`), page preloads and the About copy, run tests, deploy.
