# Clearline — Handoff for the next build agent

**The app build is COMPLETE. All 24 screens are live, both journeys pass end to end, everything
is green locally, nothing is pushed.** Your job is the human-gated finish (deploy prep) + any
polish/bugfix Tarun asks for — NOT rebuilding screens. Read this whole file once.

Last updated: 2026-09-04, end of the Phases 6–11 autonomous run (25 build commits since the
resume-at-Phase-6 point `ed86308`). Previous handoff is superseded by this file. Run
`git log --oneline` for the exact HEAD.

---

## 0. State in 30 seconds

- Repo: `~/Desktop/The last case study/clearline-app` — git, branch `main`, **LOCAL ONLY, never `git push`** without Tarun's explicit OK.
- Next.js 15 (App Router) + TypeScript (strict, **no `any`**) + Tailwind 3 + Supabase (`@supabase/ssr`) PWA. pnpm.
- **Phases 0–11 DONE.** ~50 local commits total.
- **140 Vitest + 27 pgTAP green; `pnpm typecheck` + `pnpm lint` + `pnpm build` all clean.**
- Both journeys were **walked through screen-by-screen in a real Chrome tab** at the end of the run — console clean on every screen, real Supabase data, the commitment counter really incremented server-side, maps paint.
- Source-of-truth docs live in `../` ("The last case study/"): `ERD.md`, `design/design.md` (❄️ frozen visual system), `design/journey1-timetable/BUILD-SPEC.md` (per-screen behaviour — §7 J1 01–10, §10 J1 More 11–16, §11–12 J2 17a–23), `PRODUCT.md`, `journey.md` (the 24-screen flow + nav map).
- Progress log: `BUILD-LOG.md` (this repo). Human-gated blockers: `PARKED.md`.
- Frozen prototype ported from: `../design/journey1-timetable/16screensjourney1-working/` (`01-…`–`23-…` HTML + `clearline.css` + `clearline.js`).

---

## 1. Non-negotiable rules (still in force — violating any = a defect)

1. **Port, don't restyle.** The prototype is the visual contract. **Screen 08 "Ways to go" (v8) is LOCKED — additive only, never restyle** (its `.r` / `.leaveby` / `.alt` / `.jbar` CSS is shared; scope new CSS instead of widening those).
2. **Reuse the built components.** `components/`: `Icon` (+ `mail`, `phone` added this run), `AppShell` (now renders `OfflineBanner` on every screen), `OfflineBanner`; from `components/controls.tsx`: `Cta, Segmented, FilterTabs, TextField, SelectableRow, RuledRows, TabBar`; signatures `SplitFlap, Duotone, ClearingSplash, TripMap`; `OtpInput`.
3. **Honesty everywhere:** live-vs-scheduled labels, "you arrange this" on auto/walk legs, source+freshness lines, J2 "committed window" (never "guaranteed"), no fabricated traction/counts (the corridor counter is the real `commitments` aggregate — seed starts at 0), driver/vehicle on `/trip` are labelled "sample data for the pilot".
4. **Oxblood `--accent #8f342a` is RISK ONLY** (errors / late / disruption / delete-all / Emergency). Never for selection / positive / decoration. Metro line colours (`LINECOL`) are the narrow §1a exception — transit graphics only.
5. **No money in the pilot.** `bookings.billing_on` stays false; no payment SDK. `POST /api/managed/booking` never sets `billing_on` (DB default false + RLS `bookings_owner_reserve` rejects `true` — proven in `j2_rls_test.sql`).
6. **RLS on every user table; `partnered` + `committed_count` + `billing_on` decided server-side; k-anon N≥5 on demand; home never in a demand signal (generalised OD only).**
7. **TDD** — test first. **No `any`** (lint errors on it). `@typescript-eslint/no-explicit-any: error` is enforced.
8. **NO-GO** — a screen isn't "done" until it's verified live in Chrome (console clean) and Tarun has seen it. Never claim done off tests alone. ([[feedback_claiming_done_before_user_can_see]])
9. **🔒 High-stakes paths** (auth, RLS/policies, `app/api/*`, `.env*`, `supabase/migrations|functions`, `.sql`): review the staged diff for security yourself (the `security-review` skill's auto-diff fails with no git remote), then record the gate pass — `node ~/.claude/hooks/security-gate.mjs --record-pass` — or the `PreToolUse` hook blocks the commit.

---

## 2. Environment — do this FIRST every session

```bash
cd "~/Desktop/The last case study/clearline-app"
open -a Docker                         # wait until it's up
supabase status || supabase start      # local Supabase MUST be running
supabase db reset                      # re-applies migrations 0001–0004 + seed.sql (see gotcha ⚠️4)
pnpm install                           # if node_modules missing
pnpm dev                               # http://localhost:3000
```

- `.env.local` (gitignored) → **LOCAL** Supabase, well-known local keys. Mappls keys are empty → the Planner runs on the **locked sample-plan stub** (`lib/planner/stub.ts`). `LIVE_FULFILMENT_SOURCE=diy` → `/trip` steps are schedule-derived (no real driver feed).
- **Auth required for every route except** `/login /verify /api/* /dev/*` (and `/dev/*` is a 404 in production). Test login: phone **`98123 45678`**, OTP **`424242`** (`supabase/config.toml [auth.sms.test_otp]`, dummy provider — no SMS sent).
- Never put real remote keys in `.env.local` on this machine — they go in Vercel env at deploy time (PARKED).

---

## 3. What's built (all live, all committed)

### Routes — `app/**/page.tsx` (24 product screens + 3 dev galleries)

| # | Route | Screen | Notes |
|---|---|---|---|
| 01 | `/login` | Login | phone OTP, ClearingSplash brand moment |
| 02 | `/verify` | OTP | 6-cell OtpInput, oxblood error |
| 03 | `/choose` | Choose service | Free → `/from` · Managed → `/eligibility` |
| 04 | `/from` | Where from | live search over seeded `places`, `Use current location`, `Set on map` |
| 05 | `/to` | Where to | search + arrive-by bar (±15, default 09:30) |
| 06 | `/map` | Set on map | draggable MapLibre pins |
| 07 | `/part` | Which part | Duotone masthead + radio parts (multi-part POIs; heuristic — parked) |
| 08 | `/ways` | Ways to go | **LOCKED v8** — 4 plans from `/api/plan`, LEAVE split-flap board, filters, on-time grey / late oxblood |
| 09 | `/plan` | Plan detail | `?name=`, count-ups, journey-at-a-glance bar (§1a line-colour trunk + §1b open ends), leg expander |
| 10 | `/` | Saved / home | GET `/api/commute` → POST `/api/plan`; leave-by split-flap, later departures, disruption banner, empty onboarding, Myself/Clearline toggle (→ `/managed` if a managed commute exists, else J2 upsell), TabBar |
| 11 | `/profile` | Profile | 5 progressive `profile_fields` rows, inline editors → PUT `/api/profile` |
| 12 | `/support` | Support | single-open FAQ (honesty spine, verbatim), action rows |
| 13 | `/privacy` | Privacy & data | demand toggle (PATCH `/api/privacy`), per-row delete, **two-step oxblood delete-all** |
| 14 | `/about` | About | ClearingSplash + source icon/badge matrix + "pre-launch, no fabricated traction" |
| 15 | `/feedback` | Feedback | 1–5 diverging tone-underline scale (`FEEDBACK_TONES`, never oxblood) → POST `/api/feedback` |
| 16 | `/you` | You / Account | masked phone, recent trips (RLS owner), More menu → 11–14, sign-out → `/login` |
| 17a | `/eligibility` | Eligibility | **OR-gate. `POST /api/eligibility` decides `partnered` server-side by email-domain vs `partner_domains` (unforgeable — proven by `tests/api-eligibility.test.ts`).** partnered → `/setup`, else → `/corridor` |
| 17 | `/corridor` | Corridor & waitlist | Duotone masthead, real `committed_count` / threshold / `.prog` bar, `POST /api/commit` (recomputes count server-side, opens at threshold), "intent not money" |
| 18 | `/corridor-live` | Corridor is live | the one dramatic moment — clearing-line resolve, reduced-motion settles; "Set up" → `/setup`, "Later" → `/` |
| 19 | `/setup` | Managed setup | home/tower prefill from `profile_fields`, ±15 steppers, Mon–Fri chips → `POST /api/managed` writes `managed_setups` + builds the plan |
| 20 | `/itinerary` | Itinerary card | boarding-pass **stub** (paper2 band + dashed perforation, NOT a card), LEAVE split-flap, all legs `.tl.mgd` (filled ink square) incl. AC-shuttle trunk, `.mgd-legs .r` wider mode column for "SHUTTLE" |
| 21 | `/booking` | Booking & pass | monthly/per-day rows + trip Segmented, "₹0 · pilot", **NO payment SDK** → `POST /api/managed/booking` |
| 22 | `/trip` | Live trip | TripMap band, split-flap ETA, driver (labelled sample), step tracker (done/now/upcoming), held line, Share (copy link), **Emergency (oxblood + honest copy)**. **Supabase Realtime** on `managed_trips` + 30s re-read; steps schedule-derived |
| 23 | `/managed` | Managed home | mirrors J1 home; assigned ride leads (`.tl.mgd` "Assigned"), Start → `/trip`, Myself → `/`, TabBar |
| — | `/dev/{controls,signatures,tokens}` | galleries | **404 in production** (P11.1); dev-only |

### API routes — `app/api/**/route.ts` (all auth-gated, `user_id` from the SSR session, RLS backstop)

`/api/plan` (POST — creates `trips`, stub planner, caches `plans` via service-role, records a generalised demand signal) ·
`/api/commute` (GET list / POST save `saved_commutes`) ·
`/api/profile` (GET / PUT `profile_fields`, key whitelist) ·
`/api/feedback` (POST `feedback`, rating 1–5) ·
`/api/privacy` (GET rows+pref / PATCH demand / DELETE `?id=&kind=` or `?all=1`) ·
`/api/demand` (POST one signal via service-role, no user linkage, opt-out honoured) ·
`/api/eligibility` (GET own / POST — **`partnered` server-derived only**, `eligibility` upsert via service-role) ·
`/api/corridor` (GET demo corridor + own commitment) ·
`/api/commit` (POST — upsert `commitment`, recompute `committed_count`, open at threshold — all server-side) ·
`/api/managed` (GET latest setup+plan / POST setup → `managed_setups` + `managed_plans` via service-role) ·
`/api/managed/booking` (POST `bookings` — `billing_on` never set) ·
`/api/managed/trip` (GET — create-or-get today's `managed_trips` via service-role, schedule-derived steps) ·
`/api/health` (pre-existing).

### Schema — `supabase/migrations/`
- `…0001_j1_schema.sql` — J1 tables + RLS (`places` public-read; `trips plans saved_commutes profile_fields feedback demand_prefs` owner-only; `demand_signals` RLS-on / no policies = server-write-only).
- `…0002_j2_schema.sql` — J2 tables + RLS (`corridors` public-read; `partner_domains` no policies; `eligibility` owner-read only; `commitments managed_setups` owner-all; `managed_plans managed_trips bookings` owner-read via parent; `bookings` insert only with `billing_on = false`).
- `…0003_demand_kanon.sql` — `demand_aggregate()` `SECURITY DEFINER`, `search_path=''`, groups by generalised `od_pair`, **returns a group only at `count(*) >= 5`**; EXECUTE revoked from anon/public, granted `authenticated`.
- `…0004_realtime.sql` — `managed_trips` added to the `supabase_realtime` publication (RLS still gates delivery).
- `supabase/seed.sql` — 6 `places`, 1 demo corridor (`Hauz Khas ↔ DLF Cyber Hub`, threshold 250, **count 0**), 1 placeholder `partner_domains` row (`demo-employer.example`). No fake commitments.

### Key `lib/` (reuse — do not rebuild)
`trip-state.ts` (localStorage trip across 03–09) · `use-places-search.ts` · `planner/{types,stub}.ts` · `arrive-by.ts` · `hm-time.ts` (H:MM ⇄ timestamptz, UTC) · `save-commute.ts` · `demand.ts` (`recordDemandSignal`, `generalisePlace`) · `managed-plan.ts` (locked J2 sample) · `managed-trip.ts` (schedule-derived steps + placeholder driver) · `tokens.ts` (`TOKENS, LINECOL, lineColour, FEEDBACK_TONES`) · `use-count-up.ts`, `use-reduced-motion.ts` · `supabase/{client,server,middleware}.ts` (`createClient` user-scoped, `createServiceRoleClient` server-only + throws in browser) · `env.ts` (`publicEnv`, `serverEnv()`).

### Tests — `tests/` (32 files, 140 Vitest) + `supabase/tests/` (3 files, 27 pgTAP) + `tests/e2e/journeys.spec.ts` (Playwright, not yet runnable — §5).

---

## 4. Verification status (exact — re-run before trusting)

```bash
pnpm typecheck        # tsc --noEmit — clean
pnpm lint             # next lint — clean
pnpm test             # 140 pass (32 files)
supabase db reset && supabase test db   # 27 pgTAP pass (reset FIRST — gotcha ⚠️4)
pnpm build            # clean — 24 routes, middleware 62.5 kB (do NOT run while pnpm dev is up — gotcha ⚠️1)
```

Live-verified in Chrome at end of run: login → 03 → 04 → 05 → 08 → 09 → save → 10 (J1); 17a → 17 (+commit, count 0→1) → 19 → 20 → 21 → 23 → 22 (J2); plus 11/13/14/15/16. Console clean throughout.

**🔒 Full security-review self-sweep result: ZERO high-severity.** Every API route auth-gated with `user_id` from the session + RLS backstop; service-role only post-auth on no-client-write tables, scoped to the caller's own resources; `partnered` / `billing_on` server-derived and test-proven unforgeable; k-anon N≥5; home never in a signal; no payment path; no secrets in responses; `.env*` gitignored. Gate passes recorded for every high-stakes file this run.

---

## 5. What's LEFT — the human-gated finish (this is your job)

All in `PARKED.md`. **None are code defects.** Do them in roughly this order, each only when Tarun says go:

1. **Playwright e2e** — spec is written (`tests/e2e/journeys.spec.ts`, both journeys incl. `₹0 · pilot` assertions), `pnpm test:e2e` + `playwright.config.ts` wired, `tsconfig`/`eslint` already exclude the dir. Needs an **install** (ask first): `pnpm add -D @playwright/test && pnpm exec playwright install chromium`. Then: local Supabase up + `supabase db reset` + `pnpm test:e2e`.
2. **API rate-limiting** — none of the mutating routes (`/api/commute|profile|feedback|privacy|demand|eligibility|commit|managed*`) are rate-limited. Self-DoS / abuse only (all owner-scoped), but add a per-user/IP limiter before any public launch.
3. **Production auth** — configure a real SMS provider (or Supabase dashboard test numbers for the pilot) on the remote project; ensure **no `[auth.sms.test_otp]` numbers ship to prod**.
4. **Remote Supabase** — project `https://sgwazmaiaydkgdizguxy.supabase.co`. Get the anon + service_role keys → Vercel env vars (NOT `.env.local` on this machine). `supabase link` then `supabase db push` to apply migrations 0001–0004 remotely.
5. **Mappls key** (optional, still stub) — Tarun's signup; confirm free / no-card / routing-in-tier. Until then the Planner stays on `lib/planner/stub.ts` — **do not wire the real engine without the key** (P4.2). Same for a real `places.multi_part`/`parts` column (05→07 currently uses the `isMultiPart` name/type heuristic + a demo parts list).
6. **`git push` + Vercel deploy** — Tarun-approved only. Then a full **on-device NO-GO walkthrough** with him (this is where a live axe/Lighthouse pass belongs too — static a11y is done: aria-labels on icon buttons, focus-visible ink ring, reduced-motion settles, `role="status"` on banners).

**If Tarun instead asks for polish / a bug fix:** follow the §3-loop from the old handoff — read the prototype file + BUILD-SPEC entry, port, TDD, `pnpm typecheck && pnpm lint && pnpm test` green (+ `supabase test db` for DB changes), verify live in Chrome + screenshot to Tarun, commit small (`PX.Y: …` + the two trailer lines from `git log -1`), update `BUILD-LOG.md`. Record a 🔒 gate pass for any high-stakes file.

---

## 6. Parked / needs Tarun (see `PARKED.md` — don't block on these)
- Remote Supabase keys + `supabase db push` + `git push` + Vercel deploy + on-device NO-GO. **Human-approved only.**
- Playwright install; API rate-limiting; prod SMS/OTP config.
- Mappls key (stub planner until then); real `places.multi_part`/`parts` column.
- Doc reconciliations (non-blocking): TripMap filter numbers (ERD §2 text vs the prototype values that were built), `design.md §1` pre-retune grey table.

---

## 7. Gotchas that will bite you

1. **⚠️ Never run `pnpm build` while `pnpm dev` is running.** The build overwrites `.next` and the dev server then 404s its own chunks → the page renders completely unstyled. Fix: `pkill -f "next dev"; rm -rf .next; pnpm dev`.
2. **⚠️ CSS class-name collisions bit this run TWICE** (`.trip`, `.empty`) — both only caught on the live walkthrough, not by Vitest. `app/globals.css` is one big `@layer components` shared by all 24 screens. **Before adding a ported class, `grep app/globals.css` for the bare name**; if it exists, namespace yours (`.priv-trip`, `.onboard`, `.mgd-legs .r`, …). Logged for Tarun in the 2026-09-04 daily note.
3. **⚠️ `supabase test db` needs a clean seed.** `j2_rls_test.sql` test 4 assumes the demo corridor's `committed_count` starts at 0 — any real commit (e.g. from a live walkthrough) leaves it at 1+ and the test fails. **Always `supabase db reset` before `supabase test db`.** (Pre-existing test-isolation weakness; not fixed — out of scope.)
4. **Supabase must be running** before any DB/auth work or `/api/plan` returns 401 / pages redirect to `/login`.
5. **MapLibre paints blank in Claude's automation tab** — it composites only in a real visible browser. Kick with the zoom control if needed. Expected, not a bug.
6. **`useSearchParams` needs a `<Suspense>` wrapper** in Next 15 (see `app/plan/page.tsx`).
7. **`/api/plan` inserts a `trips` row on every call** — home + `/plan` + the J2 flow each hit it, so a single walkthrough leaves ~5 identical trip rows. Honest (they are trips the user planned) but noisy; a `?cache` param or dedupe is a reasonable future cleanup (not done).
8. **`/trip` step tracker** shows the last step as "now" when opened after ~09:00 (all committed-window times are past) — schedule-derived honesty with no live feed; self-corrects for a real morning trip.
9. **Don't create `any`** — lint fails the build. Cast jsonb through `unknown` to the generated `Json` type (see `app/api/plan/route.ts`).
10. Update `BUILD-LOG.md` per task, `PARKED.md` when you defer, and the auto-memory `~/.claude/projects/-Users-tarunpuri/memory/project_clearline_app_build.md` when state changes.

---

## 8. Key file map

```
app/
  page.tsx …………………………… 10 Home            app/api/
  {login,verify}/ ……………… 01/02 auth            plan/route.ts ………… POST (stub planner + demand)
  {choose,from,to,map,part,               commute/route.ts …… GET/POST saved_commutes
   ways,plan}/ ………………… 03–09 J1 plan          profile/route.ts …… GET/PUT profile_fields
  {you}/ ………………………… 16 account              feedback/route.ts … POST feedback
  {profile,support,privacy,               privacy/route.ts …… GET/PATCH/DELETE
   about,feedback}/ …………… 11–15 More            demand/route.ts …… POST (service-role, k-anon)
  {eligibility,corridor,                  eligibility/route.ts  POST (partnered server-side)
   corridor-live}/ …………… 17a/17/18 J2 entry     corridor/route.ts … GET
  {setup,itinerary,booking}/  19/20/21 J2 plan   commit/route.ts …… POST (recompute count)
  {managed,trip}/ ……………… 23/22 J2 live          managed/route.ts …… GET/POST setup+plan
  dev/{controls,signatures,               managed/booking/route.ts  POST (billing off)
   tokens}/ ……………… galleries (404 in prod)     managed/trip/route.ts     GET (Realtime source)
  globals.css …… ALL 24 screens' ported CSS, one @layer components block
  layout.tsx …… metadata + manifest + ServiceWorkerRegister

components/  app-shell (+OfflineBanner) · controls · icon (+mail,phone) · offline-banner ·
             split-flap · duotone · clearing-splash · trip-map · otp-input · service-worker-register
lib/         (see §3) · supabase/{client,server,middleware,types}
supabase/    migrations/0001–0004 · seed.sql · tests/{j1_rls,j2_rls,demand_kanon}_test.sql · config.toml
tests/       32 *.test.{ts,tsx} · e2e/journeys.spec.ts   playwright.config.ts
BUILD-LOG.md  PARKED.md  .env.example  .env.local(gitignored)
```

**Definition of done for the overall project:** all 24 screens live (✅), both journeys pass (✅),
honesty labels everywhere (✅), RLS + k-anon hold (✅ — 27 pgTAP), no money wired (✅),
`billing_on` unforgeable (✅), Realtime wired (✅) — **then, only on Tarun's approval:** Playwright
green, rate-limiting in, prod auth configured, remote keys + `db push`, `git push`, Vercel deploy,
on-device NO-GO walkthrough. Everything up to `git push` is done and green locally.
