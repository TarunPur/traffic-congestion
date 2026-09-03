# Clearline — Build Log

Chronological record of the real build (per IMPLEMENTATION-PLAN.md). One entry per task.
Bound by ERD.md + the frozen docs. `../design/journey1-timetable/16screensjourney1-working/` is the port source.

## Pre-build gates (2026-09-04, cleared by Tarun)
- ERD.md + IMPLEMENTATION-PLAN.md approved as-is.
- All 6 ERD §12 defaults accepted as written.
- Phone OTP → Supabase **test phone numbers** (no SMS spend; real SMS = switch-on-ready later).
- Supabase project → Tarun to create (P0.4/P0.5 wait on it).
- Repo lives at `The last case study/clearline-app/`.
- Mappls → stub only (P4.1); no P4.2 until Tarun's key + free-tier confirm.
- Autonomy → continue building unattended after rate-limit reset; testing must be rock-solid.

## Phase 0 — Foundations & rails

### P0.1 — Repo + Next.js scaffold ✅ (2026-09-04)
- New git repo `clearline-app` (main branch); Next.js 15.1.6 App Router + React 19 + TypeScript `strict`
  (+ `noUncheckedIndexedAccess`, `noImplicitOverride`). `@/*` path alias. pnpm 9.15.9 (installed globally via npm; corepack absent on Homebrew Node 26).
- Core ERD stack installed once up front (Tailwind 3.4, Vitest 3 + RTL + jsdom, ESLint + @typescript-eslint) to avoid repeated install gates; wired per-task.
- Minimal themed ground in `app/globals.css` (`--paper`/`--ink` only; full token set = P0.2).
- **Verify:** `pnpm dev` → HTTP 200, themed page served; `tsc --noEmit` clean. No high-stakes path → no security-review needed.

### P0.2 — Tailwind + tokens ✅ (2026-09-04)
- `lib/tokens.ts` = single source of truth: `TOKENS` (ERD §2 authoritative set incl. `--accent`, `--press`), `LINECOL` (§1a, 8 lines), `FEEDBACK_TONES` (§1c 1→5), `lineColour()` fallback, `cssVarBlock()`.
- Full `:root` token set in `app/globals.css` + global `font-variant-numeric: tabular-nums lining-nums`, ink selection/focus (`1.5px ink` offset 3). `tailwind.config.ts` mirrors tokens as utilities referencing the CSS vars (one source). PostCSS wired. ESLint `no-explicit-any: error` active.
- **TDD:** `tests/tokens.test.ts` — 8 tests. Ground-truth assertions (CI-safe) + a **drift guard** that re-parses the real frozen prototype (clearline.css / 09 / 15) when the sibling folder is present, so tokens can never silently diverge.
- Dev verify surface `app/dev/tokens/page.tsx` (swatches). **Verify:** tsc + lint + 8 tests green; live render at `/dev/tokens` correct (paper/ink/oxblood + muted metro palette), console clean; screenshot sent to Tarun (visual confirm async). No high-stakes path.

### P0.3 — Fonts via next/font ✅ (2026-09-04)
- `lib/fonts.ts` — `next/font/google` self-hosts Source Serif 4 (400/500/600 + italic), Archivo (400/500/600), Space Grotesk (wordmark only), each as a CSS variable; fetched + inlined at **build time**.
- Layout applies `fontVariables` to `<html>`; globals feed `--font-serif`/`--font-grot` into `--serif`/`--grot` (prototype family names kept as fallbacks) + adds `--wordmark`.
- **Verify:** served page has **0** `fonts.googleapis.com` runtime refs; fonts self-hosted as woff2 under `/_next/static/media/`; Source Serif 4 + Archivo + `--press` render correctly at 390px (screenshot sent). tsc clean. No high-stakes path.

### P0.6 — App shell + PWA base ✅ (2026-09-04)
- `components/app-shell.tsx` — real mobile shell (no 412×812 device frame): 100dvh flex column, content centred at `max-w-[480px]` on `--paper`, scroll region with the one 20px side margin, optional sticky `foot` (safe-area-inset padding) for the CTA/tab bar, + the design §5c paper-grain feTurbulence ground behind all content.
- PWA: `public/manifest.webmanifest` (standalone, paper theme), `public/icon.svg` (brand "clear line" rail mark), `public/sw.js` (shell + font cache; **never** caches `/api/*` or transit times — honest offline is layered in P11.4), `components/service-worker-register.tsx` (prod-only registration). Manifest linked via layout metadata.
- **TDD:** `tests/app-shell.test.tsx` (6) — children render, foot slot pinned outside scroll region, foot omitted when absent, centred max-width; manifest validity + icons.
- **Verify:** 14/14 tests, tsc + lint clean; live at `/` — content stays centred at 480 on a 1456px viewport (no desktop stretch), grain + foot CTA correct, console clean. **Parked:** on-device install check → Tarun's phone (PARKED.md).

### P0.4 — Supabase clients 🔒 ✅ (2026-09-04)
- `@supabase/ssr` + `@supabase/supabase-js`. `lib/env.ts` (publicEnv browser-safe + `serverEnv()` that throws in-browser + `hasSupabaseCredentials()`), `lib/supabase/client.ts` (browser anon), `lib/supabase/server.ts` (cookie-bound SSR anon + server-only `createServiceRoleClient` RLS-bypass, documented), `lib/supabase/types.ts` (minimal `places` Database placeholder → full generated types in P2), `app/api/health/route.ts` (public `places` smoke read, honest `connected:false` while keys parked). `.env.example` (names only) + `.env.local` (gitignored, URL in, keys = REPLACE_WITH_* placeholders).
- **TDD:** `tests/env.test.ts` (4) — serverEnv throws in browser, returns on server, publicEnv has no secret fields, credentials-parked detection.
- **🔒 security-review:** zero high-severity — service-role key absent from `.next/static` (build grep), `.env.local` untracked, anon-in-client safe by design; low-sev health-route error text flagged for P11.5. Pass recorded via security-gate hook.
- **Verify:** 18/18 tests, tsc + lint clean, `pnpm build` clean. **Parked:** real anon/service keys + live DB read → arrives with Tarun's keys (PARKED.md).
