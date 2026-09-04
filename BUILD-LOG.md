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

### P0.5 — CI ✅ (2026-09-04, Vercel half parked)
- `.github/workflows/ci.yml` — on PR/push to main: pnpm install (frozen), typecheck, lint (no-explicit-any:error), test, build (placeholder public env). Node 22 / pnpm 9.
- **Verify:** the exact CI sequence runs green locally (tsc, lint, 18 tests, `next build` ✓ 6 routes). **Parked:** GitHub remote + Vercel project + Preview URL → needs push approval (PARKED.md). No high-stakes path.

**Phase 0 checkpoint:** rails complete (repo, tokens, fonts, shell/PWA, Supabase clients, CI) — themed, installable, tokens+fonts correct, Supabase clients wired (keys parked). ▶ Phase 1 next.

## Phase 1 — Design system: primitives + the four signature components

### P1.1 — Icon component ✅ (2026-09-04)
- `components/icon.tsx` — typed `<Icon name size label>` porting all 25 `CL.icon()` paths verbatim (24 viewBox, stroke 1.6, round caps, currentColor). Decorative by default (aria-hidden), `role=img`+aria-label when `label` given. Static self-authored markup via dangerouslySetInnerHTML for exact fidelity.
- **TDD:** `tests/icon.test.tsx` (5) — stroke spec, size grid, every icon has geometry, **no emoji/unicode** (ERD §2), a11y label. **Verify:** 23/23 tests, tsc + lint clean. Visual → in the P1.2 gallery screenshot.

### P1.2 — Core controls ✅ (2026-09-04)
- Control CSS ported verbatim into `app/globals.css @layer components` (`.field/.seg/.filters/.rowline/.cta/.tabbar/.lab` + reduced-motion settle + oxblood errored field). React wrappers in `components/controls.tsx`: `Cta` (default/ghost/disabled/loading+aria-busy), `Segmented`, `FilterTabs` (aria-pressed, matches prototype — not a false tablist), `TextField` (label/prefix/icon/clear/error), `SelectableRow` (option|radio, ink rule + tick), `RuledRows`, `TabBar` (aria-current, ink indicator).
- **TDD:** `tests/controls.test.tsx` (12) — every state + interaction. Fixed a real port detail: Icon size widened to `number` (prototype tab bar uses 22).
- **Verify:** 35/35 tests, tsc + lint clean (0 warnings); gallery `/dev/controls` matches prototype at 440px (segmented, filter underline, oxblood error field, selected row, CTA states, tab bar), console clean; screenshots sent.

### P1.3 — SplitFlap (Solari board) 🎯 ✅ (2026-09-04)
- `components/split-flap.tsx` — React structure + imperative flip ported from `CL.splitflap`/`buildFlaps`/`flipTo`: paper2 tiles, serif digits, centre hinge, `-90deg` fold `.13s` step, flips on mount + change, plain-glyph colon, hero 44×62 / compact 33×47. Reduced-motion sets final with no animation. CSS ported verbatim into globals (kept outside @layer for the `@keyframes foldDown`). Reusable `lib/use-reduced-motion.ts`.
- **TDD:** `tests/split-flap.test.tsx` (6) — cell count/colon, aria-label, reduced-motion settle (no animate class), value change, compact modifier, animated path settles under fake timers.
- **Verify:** 41/41 tests, tsc + lint clean; `/dev/signatures` shows the board flipping (captured mid-flip), console clean; screenshot sent.

### P1.4 — Duotone 🎯 ✅ (2026-09-04)
- `lib/duotone.ts` — pure `duotonePixels()` transform ported from CL.duotone (paper↔ink, contrast 1.9 / pivot .46 / max .86). `components/duotone.tsx` — canvas renders the two-tone map, top/bottom vignette into paper (ported masthead gradient), credit line. Ships `public/img/dlf-cyberhub.jpg` (CC BY-SA 4.0, credit "Slyronit").
- **TDD:** `tests/duotone.test.ts` (5) — bright→paper, dark→ink capped at max, monochrome ramp, max scaling, buffer length. (Canvas paint verified live, not in jsdom.)
- **Verify:** 46/46 tests, tsc + lint clean; masthead paints monochrome + vignetted in a real browser with credit visible, console clean (no CORS/taint); screenshot sent.

### P1.5 — ClearingSplash 🎯 ✅ (2026-09-04)
- `components/clearing-splash.tsx` — 9 tangled strands straighten into one clear line (strand 0 survives), node travels X0→X1, wordmark (Space Grotesk via `--wordmark`) then tagline fade in. Ported from 01-login.html. Reduced-motion `settle()` renders the final state instantly + fires `onDone` (never blank). Scoped CSS in globals.
- **TDD:** `tests/clearing-splash.test.tsx` (5) — 9 strands + node, reduced-motion settle (wordmark/tagline `in`, node at 314, strand-0 survives), onDone immediate, custom copy, non-settled when motion allowed.
- **Verify:** 51/51 tests, tsc + lint clean; `/dev/signatures` resolves to the clear line + wordmark live (StrictMode replays once in dev), console clean; screenshot sent.

### P1.6 — TripMap 🎯 ✅ (2026-09-04)
- `components/trip-map.tsx` — MapLibre GL (dynamically imported, kept out of the main bundle) + OpenFreeMap `liberty` (no key, via `NEXT_PUBLIC_MAP_STYLE_URL`). Duotone `filter` + paper-multiply tint + origin-ring / dest-teardrop markers + dashed ink route, all ported verbatim. `fitBounds` on origin+dest. **Repaint kick** (resize+triggerRepaint on visibilitychange/focus/pageshow/mount) — the prototype's fix for the rAF freeze. `lib/map-markers.ts` = pure, testable marker factory.
- **Note:** used the prototype's filter values, not ERD §2's (logged in PARKED.md).
- **TDD:** `tests/trip-map.test.tsx` (3) — marker forms (ring/teardrop ink+paper), component renders map + tint (maplibre mocked; WebGL can't run in jsdom).
- **Verify:** 54/54 tests, tsc + lint clean; map **paints in a real browser** as a monochrome duotone (New Delhi, OSM attribution), console clean — confirms the documented automation-tab freeze is only a paint-kick issue, resolved by the repaint kick; screenshot sent.

**Phase 1 checkpoint:** design system complete — Icon, all core controls, and the four signature components (SplitFlap, Duotone, ClearingSplash, TripMap), each with reduced-motion + states, matching the prototype. Gallery routes: `/dev/tokens`, `/dev/controls`, `/dev/signatures`. ▶ Phase 2 (data model & RLS) next.
