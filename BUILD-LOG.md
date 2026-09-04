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

## Phase 2 — Data model & RLS (verified on real local Postgres)

Docker was down; I started it + local Supabase (`supabase start`) so RLS ran for real — not parked.

### P2.1 — J1 migrations + RLS 🔒 ✅ (2026-09-04)
- `supabase/migrations/20260904000001_j1_schema.sql` — places (public read), trips, plans, saved_commutes, profile_fields, feedback, demand_prefs, demand_signals (ERD §3). RLS owner-only (subselect-wrapped auth.uid, indexed); reference read-only; **demand_signals server-write-only (RLS on, no policies)**; feedback internal-only.
- **TDD:** `supabase/tests/j1_rls_test.sql` (pgTAP, 11) — owner isolation, home hidden cross-user, demand_signals unreadable, places read-only.

### P2.2 — J2 migrations + RLS 🔒 ✅ (2026-09-04)
- `supabase/migrations/20260904000002_j2_schema.sql` — partner_domains (server-only, no policies), corridors (public read, committed_count server-only), eligibility (owner-read; **partnered not client-writable**), commitments (owner), managed_setups (owner), managed_plans/bookings/managed_trips (owner via join). **bookings.billing_on can never be set true by a client** (policy check) — no money.
- **TDD:** `supabase/tests/j2_rls_test.sql` (pgTAP, 10) — isolation, forge-partnered blocked, committed_count RLS no-op, billing_on=true blocked, partner_domains unreadable.

### P2.3 — Seed ✅ (2026-09-04)
- `supabase/seed.sql` idempotent — sample places (Hauz Khas Enclave, DLF Cyber Hub Bldg 10 + a few), the one demo corridor (threshold 250, **committed_count 0 — real, not the mockup's fabricated 168**, flagged in PARKED), placeholder partner domain.
- Generated real types → `lib/supabase/types.ts` (`supabase gen types --local`, replaces the placeholder).
- **🔒 security-review:** zero high-severity (RLS comprehensive + 21 tests prove it; no secrets; no fabricated traction); pass recorded.
- **Verify:** local `supabase start` applied both migrations + seed cleanly; **`supabase test db` → all 21 RLS tests PASS**; app tsc + lint + 54 Vitest green with generated types. **Parked:** apply to the remote project (needs keys) — local is fully verified.

**Phase 2 checkpoint:** schema + RLS live on the local dev DB, 21 RLS tests green, seed loads. ▶ Phase 3 (auth) next.

## Phase 3 — Auth (screens 01–02) 🔒 (verified live end-to-end)

### P3.1 — 01 Login ✅ / P3.2 — 02 OTP ✅ (2026-09-04)
- **01 Login** (`app/login/page.tsx`) — ClearingSplash brand moment + centred `+91`/10-digit field (`lib/phone.ts` format/validate), Continue (disabled <10 digits, loading "Sending code…"), oxblood error copy (invalid / send-fail / rate-limit). `signInWithOtp` via server action.
- **02 OTP** (`app/verify/page.tsx` + `components/otp-input.tsx`) — 6-cell input (auto-advance, paste-fills-six, backspace, numeric), `verifyOtp`, wrong/expired error + shake (reduced-motion none), 24s resend countdown → Resend, Edit→01, "Sent to +91…" masked.
- **Auth infra:** `app/login/actions.ts` server actions (sendOtp/resendOtp/verifyOtp) — pending phone in an **httpOnly cookie, never a URL** (privacy); SSR session cookies on verify. `middleware.ts` + `lib/supabase/middleware.ts` — `getUser()` session refresh + route protection (unauth→/login; authed off /login,/verify). Local test-OTP via `config.toml` (`[auth.sms.test_otp]` + dummy provider so phone auth is on without real SMS).
- **TDD:** `tests/phone.test.ts` (4), `tests/otp-input.test.tsx` (6). 64 Vitest green.
- **🔒 security-review:** zero high-severity (server-side OTP, httpOnly cookies, getUser protection, no secret leak); pass recorded. Flagged: gate `/dev/*` + no test-OTP in prod (PARKED).
- **Verify:** **full flow driven live in Chrome** — unauth `/`→307→/login; login (test # 98123 45678) → send → /verify → code 424242 → session set → redirect to protected `/`. Console clean. Screenshots sent. tsc + lint clean.

**Phase 3 checkpoint:** a phone can sign in end-to-end (local test OTP); sessions persist; protected routes enforced. ▶ Phase 4 (planner) next.

## Phase 4 — Planner adapter + Mappls (data spine) 🔒

### P4.1 — Planner interface + stub ✅ (2026-09-04)
- `lib/planner/types.ts` — the swap seam (ERD §5): `Planner.plan(origin,dest,{arriveBy})→Plan[]`, `Plan {name,totalMin,fare,timeVsCarMin,co2VsCar,legs[],projectedArrival,onTime}`, `Leg {mode,ride,place,depTime,durMin,arrangeYourself,line?,scheduled?,live?}`, `CAR_BASELINE` (52min/₹430/4.6kg).
- `lib/planner/stub.ts` — `StubPlanner` returns the LOCKED sample plans (Fastest 41 / Recommended 49 @₹55 / Cheapest 60 / Greenest 47), ported verbatim from 08/09 + PRODUCT.md. Honesty baked in: Auto/Walk = arrangeYourself, Metro = scheduled (never live), Bus = live; timeVsCar from the car baseline; onTime computed vs arrive-by (Cheapest arrives 9:35 → the demo's late plan). Non-documented fares/CO₂ marked as sample (real = DMRC matrix + CO₂ model, P4.2/§12).
- `app/api/plan/route.ts` 🔒 — auth-gated POST; creates the trip (owner), runs the planner, caches plans via service-role (plans is server-write-only), returns Plan[]. Engine swappable behind the interface.
- **TDD:** `tests/planner.test.ts` (8) — shape, timeVsCar, projectedArrival, onTime at 9:30 & 9:20, and the honesty fields (arrangeYourself / scheduled-vs-live).
- **🔒 security-review:** zero high-severity (auth→401 verified live; service-role used narrowly post-auth; input validated); pass recorded. Note: add rate-limiting in P11.
- **Verify:** 72 Vitest green, tsc + lint clean; `/api/plan` returns 401 unauth. **Parked:** P4.2 real Mappls (Tarun's key) + P4.3 live-bus GTFS-RT feed.

## Phase 5 — Journey 1 plan flow (screens 03–09)

Shared `lib/trip-state.ts` (localStorage `useTrip`) carries origin/dest/arriveBy/service across 03–09.

### P5.1 — 03 Choose service ✅ (2026-09-04)
- `app/choose/page.tsx` — two `.mode` radio cards (Free default / Managed), serif titles, radio dot, ink-rule-when-selected. Free → `/from`; Managed → `/eligibility` with CTA "Join the waitlist". Honest "Available only on covered corridors" sub-line kept. Ported from 03-choosemode.
- **TDD:** `tests/choose.test.tsx` (3) — default Free→/from, Managed→waitlist→/eligibility, honesty line. 75 Vitest green.
- **Verify:** tsc + lint clean; live at `/choose` matches prototype (session persisted), console clean; screenshot sent.

### P5.2 — 04 Where from ✅ (2026-09-04)
- `app/from/page.tsx` — debounced (~150ms) type-ahead over the seeded `places` table (`lib/use-places-search.ts`, browser client), result rows (icon-by-type + highlighted match), Use-current-location (idle/locating/denied, denied→oxblood), Set-on-map → `/map`, non-interactive TripMap confirmation band (recenters on the picked point — added single-point easeTo to TripMap). Choose → `trip.origin` → Set as start → `/to`.
- **TDD:** `tests/from.test.tsx` (3). 78 Vitest green.
- **Verify:** tsc + lint clean; live at `/from` shows **real seeded places** with correct icons/sub-labels, console clean; screenshot sent.

### P5.3 — 05 Where to ✅ (2026-09-04)
- `app/to/page.tsx` — dest search (same debounced places pattern), the **arrive-by bar** (serif 12h hero + −15/+15 stepper, `lib/arrive-by.ts` clamp 05:00–23:45 step ±15 default 09:30), map band. Set as destination → writes `{dest, arriveBy}` → `isMultiPart` ? `/part` : `/ways`.
- `lib/arrive-by.ts` (clamp/step/toHM/to12h) + `isMultiPart` heuristic (office-hub/landmark without a building number → 07; flagged in PARKED for a real `multi_part` column).
- **TDD:** `tests/arrive-by.test.ts` (6). 84 Vitest green.
- **Verify:** tsc + lint clean; live at `/to` — arrive-by control + real places, console clean; screenshot sent.

### P5.4 — 06 Set on map ✅ (2026-09-04)
- `app/map/page.tsx` — full-height TripMap with **draggable** origin (ring) + dest (teardrop) pins, prefilled from trip or Delhi defaults; drag updates local state; Confirm points → writes trip origin/dest → `/ways`. Added `draggable`/`onOriginMove`/`onDestMove`/`autoFit` props to TripMap (autoFit off so dragging doesn't re-center).
- **Verify:** tsc + lint + 84 Vitest green; map **paints in a real browser** (duotone south Delhi) with both pins, console clean; screenshot sent. (Draggable marker interaction is standard MapLibre.)

### P5.5 — 07 Which part ✅ (2026-09-04)
- `app/part/page.tsx` — Duotone masthead (dest name overlay) + radio parts list (SelectableRow role=radio) for a multi-part hub; Confirm building appends the part to trip.dest → `/ways`. Demo parts list (parked: real parts column). Reuses tested components. tsc + lint clean; visual verify batched with the ways/plan flow.

### P5.6 — 08 Ways to go (LOCKED v8) ✅ (2026-09-04)
- `app/ways/page.tsx` — POSTs `/api/plan` (trip origin/dest/arriveBy) → renders the 4 plans. LEAVE-BY `<SplitFlap>` board (recommended's first-leg dep) + Leave-now/Arrive-by `<Segmented>` (recomputes board/latest), `<FilterTabs>` (All/Metro/Bus/No auto-rickshaw), Recommended itinerary (MODE column + serif places + Scheduled/Live·est stamps + gutter), Other ways as expandable `.alt` with on-time/late status (late→oxblood+demoted via feasible-first sort, on-time→grey), finding-ways loading, no-coverage empty, "Times from Delhi transit data · updated 2 min ago" banner. Plans/rows → `/plan?name=`. Ported verbatim from 08-waystogo; not restyled.
- **Verify:** tsc + lint + 84 Vitest green; live at `/ways` renders real planner data with the split-flap board + honesty stamps, console clean; screenshot sent.
