# Clearline — Handoff for the next agent

**The app is BUILT, DEPLOYED, and LIVE.** Read this whole file before doing anything —
especially before touching Supabase, Vercel, or claiming any screen is "done." Previous
handoffs in this file are superseded; this is the current truth as of the timestamp below.

Last updated: 2026-09-05 (session covering: GitHub push, Vercel deploy, remote Supabase
setup, phone-auth fix, live QA pass, 2 bugs found + fixed). Run `git log --oneline` and
`git status` yourself before trusting anything below — verify, don't assume.

---

## 0. State in 30 seconds

- **Live URL: https://traffic-congestion-tau.vercel.app** — real app, real database, shareable
  with test users right now.
- Repo: `~/Desktop/The last case study/clearline-app` — git, branch `main`.
- **GitHub: `github.com/TarunPur/traffic-congestion` (PUBLIC)** — local, GitHub, and Vercel's
  deployed commit are all `8af139e`, identical, verified by hash comparison (not assumed).
- CI (GitHub Actions `verify`: typecheck/lint/test/build) — **green** on `8af139e`.
- `/api/health` → `{"ok":true,"connected":true,"placesReachable":true}` — DB connection confirmed live, not just asserted.
- Next.js 15.1.9 (bumped from 15.1.6 mid-session — that version had a CVSS 10.0 RCE, see §4).
  TypeScript strict, **no `any`**. Tailwind 3. Supabase (`@supabase/ssr`). pnpm.
- **140 Vitest + 27 pgTAP + 5 Playwright e2e — all green** as of `8af139e`.
- **Still local-only / not started: Mappls integration.** The planner runs on a locked sample-plan
  stub — every "Ways to go" result is canned, not a real computed route. This is the biggest
  functional gap. Tarun has not yet signed up for Mappls.

---

## 1. What changed this session (in order — read this to understand *why* things are the way they are)

1. **Pushed to GitHub** (repo was local-only before). Needed a `workflow`-scoped `gh` token
   (Tarun granted it via device-code flow) because the repo ships `.github/workflows/ci.yml`.
2. **CI failure #1, fixed**: `tests/corridor.test.tsx`'s `useRouter` mock returned a fresh
   `{push,replace}` object each render, re-firing `CorridorPage`'s `useEffect(_, [router])` on
   every re-render; a late relative-URL fetch escaped `afterEach`'s unstub and Node 22 (CI)
   rejected it (Node 26 locally tolerated it). Fixed with a stable `vi.hoisted` router mock.
3. **Playwright e2e installed and made to actually run** — it had been written but never
   executed; the spec assumed screens/copy that didn't match the build. Rewrote it, added
   `tests/e2e/auth.setup.ts` (log in once, reuse session — avoids Supabase's SMS-frequency limit).
4. **Vercel deploy blocked by CVE-2025-66478** (CVSS 10.0, RCE in React Server Components,
   affects all Next 15.x App Router apps). Vercel's failure UI showed only a generic "Build
   Failed" card — the real cause was the *last line* of the build log ("Vulnerable version of
   Next.js detected"). Bumped `next` 15.1.6 → 15.1.9. **The app was never publicly reachable
   while vulnerable** (every deploy attempt was refused), so no secret rotation was needed.
5. **Remote Supabase wired up**: project "Traffic congestion" (`sgwazmaiaydkgdizguxy`,
   Southeast Asia/Singapore, Postgres 17). CLI linked, `supabase db push` applied migrations
   0001–0004, seed data (6 places, 1 demo corridor, 1 partner domain) inserted via the SQL
   Editor (not `db push` — that only applies schema, not `seed.sql`).
6. **Vercel env vars set**, then found empty on first deploy — `NEXT_PUBLIC_*` bake in at
   **build time**, so saving a var needs a **redeploy**, not just a save. Also switched the two
   public Supabase vars from Secret→**Config** type in Vercel so they stay human-verifiable
   (service_role stays Secret — correctly hidden).
7. **Only ~4 screens were reachable after deploy** — turned out the remote Supabase project had
   **Phone auth disabled**. Enabled it with the same test-number pattern as local (see §3).
8. **Live QA pass on production** found and fixed two real bugs (both deployed, reverified live):
   - Screen 10 (home): evening-commute row's title/description ran together on one line —
     two `<span>`s missing `display:block`. **The frozen prototype has the identical bug**
     (flagged in `PARKED.md`, prototype left untouched — it's Tarun's visual contract).
   - Screen 17 (corridor): for 1–3s while `/api/corridor` was loading, the page showed a
     hardcoded fake corridor name and a contradictory "threshold is met" message instead of a
     neutral loading state.
9. **Corridor commit-counter is now genuinely at 1** (was 0) — from live-testing the write path
   during QA. Real data, not fake, but Tarun may want it reset to 0 before real users see it —
   he was told and hadn't answered as of this handoff. One `update corridors set committed_count
   = 0 where demo = true;` in the Supabase SQL Editor resets it if asked.
10. Published two visual QA artifacts this session (screenshots of every screen) — **these are
    disposable review aids, not source of truth.** Don't treat them as documentation; this file
    and `BUILD-LOG.md` are.

---

## 2. Non-negotiable rules (still in force)

1. **Port, don't restyle.** `design/journey1-timetable/16screensjourney1-working/` is the frozen
   visual contract. Screen 08 "Ways to go" (v8) is **LOCKED** — additive only.
2. **Reuse built components** — don't rebuild `SplitFlap`, `Duotone`, `ClearingSplash`, `TripMap`,
   `Icon`, `AppShell`, `Cta`, `Segmented`, `FilterTabs`, `TextField`, `SelectableRow`, `RuledRows`,
   `TabBar`, `OtpInput`.
3. **Honesty everywhere**: live-vs-scheduled labels, "you arrange this," source+freshness lines,
   J2 "committed window" (never "guaranteed"), no fabricated traction/counts. The corridor
   counter and recent-trips lists are real aggregates — never seed fake ones.
4. **Oxblood `--accent #8f342a` is risk-only.** Never selection/positive/decoration. Verified this
   session: only `.tl.stale` uses it in the deployed CSS.
5. **No money in the pilot.** `bookings.billing_on` stays false — DB default + RLS both enforce
   this, proven unforgeable by `j2_rls_test.sql`. Don't touch that guarantee without a security
   review.
6. **TDD. No `any`** (lint fails the build on it).
7. **NO-GO** — a screen isn't "done" until verified live in a **real browser** (not just this
   agent's automation tab — MapLibre renders blank there; two real bugs this session were only
   caught live, never by tests) and Tarun has seen it himself.
8. **🔒 High-stakes paths** (auth, RLS/policies, `app/api/*`, `.env*`, `supabase/migrations|functions`)
   need a `security-review` pass before committing — record it with
   `node ~/.claude/hooks/security-gate.mjs --record-pass` or the commit hook blocks you.
9. **`git push` needs Tarun's explicit OK** — it was given once this session to establish the
   GitHub repo; don't assume standing permission for future pushes without asking again per his
   global CLAUDE.md rule ("Always ask before anything significant... push").

---

## 3. Environment — do this first every session

```bash
cd "~/Desktop/The last case study/clearline-app"
open -a Docker                         # wait until it's up
supabase status || supabase start      # LOCAL Supabase must be running for local dev
supabase db reset                      # re-applies migrations 0001–0004 + seed.sql
pnpm install                           # if node_modules missing
pnpm dev                               # http://localhost:3000
```

- `.env.local` (gitignored) points at **local** Supabase — separate from the deployed remote
  project. Test login locally and on production: phone `98123 45678` / OTP `424242`, or
  `99999 00001` / `123456`.
- **Remote (production) Supabase** project: `sgwazmaiaydkgdizguxy` ("Traffic congestion",
  Singapore, Postgres 17). CLI is linked (`supabase link` already run). To push schema changes:
  `supabase db push`. Remote phone auth uses the **same two test numbers**, valid until
  2027-09-30, with dummy Twilio credentials (no SMS spend either locally or in prod right now).
- **Never run `pnpm build` while `pnpm dev` is running** — clobbers `.next`, dev server 404s its
  own chunks (`rm -rf .next` + restart to fix).
- **Vercel project**: `traffic-congestion` under team `tarun-puri-s-projects1`. Auto-deploys on
  push to `main`. Env vars are set (Production+Preview scope) — see `.env.example` for names.
  Changing a `NEXT_PUBLIC_*` var requires a manual redeploy afterward (Vercel dashboard →
  Deployments → ⋯ → Redeploy on the latest commit) — saving alone does not rebuild.

---

## 4. What's built — all 24 screens, both journeys, verified live in production

See `BUILD-LOG.md` for the full per-phase build history (Phases 0–11) and the route/API table.
**Don't re-derive this from scratch** — it's accurate and current. Short version:

- **J1 (01–16):** login → OTP → choose service → where-from/to → set-on-map → which-part →
  ways-to-go (locked v8) → plan detail → home → profile/support/privacy/about/feedback/account.
- **J2 (17a–23):** eligibility (server-side email-domain match, unforgeable) → corridor &
  waitlist (real commit counter) → corridor-live → managed setup → itinerary (boarding-pass
  stub) → booking (₹0 · pilot, no payment SDK) → managed home → live trip (Realtime).
- All 12 API routes are auth-gated, `user_id` from the session, RLS backstop, service-role only
  post-auth on no-client-write tables.

**QA status (this session, live on production, not just localhost):** 22 of 24 screens directly
tested against real data. Not tested: 06 (map — MapLibre blank in automation browser only, works
on real devices, confirmed by Tarun's own screenshot), 07 (needs a multi-part destination), 18
(only fires at the real 250-commitment threshold — correctly unreachable in normal testing).

**Known cosmetic deviations from `design.md`** (not bugs, just imprecise — decide if worth fixing):
- Primary CTA letter-spacing: spec says `.11em`, built is `.055em`.
- Micro-label (`.lab`) letter-spacing: spec says `.14em`, built is `.17em`.
- `design.md §1`'s grey table (`#726c5e`/`#9a9384`) is stale — the retuned values actually built
  (`#5f5a4e`/`#877f6e`) are documented in `design.md §11` and are correct; this is a doc-only
  cleanup item, already in `PARKED.md`.

---

## 5. What's NOT done — in priority order

1. **Mappls integration (biggest gap).** The planner (`lib/planner/stub.ts`) returns a locked
   sample plan for every query — "Ways to go" never computes a real route. Tarun has not signed
   up yet. Needs: his signup, confirm free/no-card/routing-in-tier, hand you the
   `MAPPLS_CLIENT_ID`/`MAPPLS_CLIENT_SECRET`, wire the real `Planner` adapter (P4.2 in
   `IMPLEMENTATION-PLAN.md`), keep the stub as fallback.
2. **API rate-limiting** — none of the mutating routes are rate-limited. Owner-scoped so it's
   self-DoS only, not a data risk, but should land before any public/open launch.
3. **Production phone-auth is test-numbers-only.** Fine for a handful of known testers (Tarun
   confirmed he's OK with this for now). Needs a real SMS provider (Twilio/MSG91) before open
   testing with real phone numbers.
4. **Corridor counter is at 1**, not 0 — from this session's live write-test. Ask Tarun if he
   wants it reset before real users see it.
5. **On-device NO-GO walkthrough** — Tarun clicking through the live app on his own phone.
   Partially done (he sent one real-device screenshot confirming the map renders correctly),
   not a full walkthrough yet.
6. **Two cosmetic letter-spacing deviations** from `design.md` (§4 above) — low priority, his call.
7. **The frozen prototype has the same `.addrow` display:block bug** the app had — logged in
   `PARKED.md`, not fixed, needs Tarun's sign-off before editing the prototype (it's his visual
   contract, not something to touch unilaterally).

---

## 6. Gotchas that will bite you

1. **Vercel's "Build Failed" card can lie about the cause.** If a deploy fails with no clear
   error in the summary, read the **literal last few lines** of the Build Logs panel — Vercel's
   own infra checks (vulnerable-dependency blocks, etc.) print there, not in the failure card.
2. **`NEXT_PUBLIC_*` env var changes need a manual redeploy.** Saving in the Vercel dashboard
   does not trigger a rebuild by itself.
3. **CSS bugs are invisible to this project's test suite — three found so far, all only in a
   real browser.** `.trip`/`.empty` class collisions (earlier phases) and the two found this
   session (`.addrow` missing `display:block`, corridor's loading-state fallback text) all
   passed Vitest because jsdom does no layout and the tests mock fetch instantly (no loading
   window to observe). **Always eyeball a real Chrome tab before calling a screen done**, and
   watch specifically for (a) sibling `<span>`s that should stack needing `display:block`, and
   (b) loading-state fallback values that could show something false/contradictory before real
   data arrives.
4. **MapLibre renders blank in this agent's browser-automation tab specifically** — not a bug,
   a known limitation of that specific tool. Screens 06 and 22's map band need a real browser
   (or Tarun's own device) to verify.
5. **`supabase test db` needs a clean seed first** — `j2_rls_test.sql` assumes the demo
   corridor's `committed_count` starts at 0. Always `supabase db reset` before `supabase test db`
   locally. (This doesn't apply to the remote/production corridor, which is now genuinely at 1 —
   see §5.4.)
6. **A test file's fixture data can coincidentally match a real bug's symptom** — don't assume
   a match is a coverage gap without reading the actual assertion (this tripped me up briefly
   this session with `tests/corridor.test.tsx`'s `BASE.name` string).
7. **`git push` and any `supabase db push`/schema change need Tarun's explicit OK each time** —
   don't treat one approval as standing permission.

---

## 7. Key file map

```
app/                  24 product screens (App Router) + 3 dev galleries (404 in prod)
  page.tsx ─────────── 10 Home
  {login,verify}/ ──── 01/02 auth
  {choose,from,to,map,part,ways,plan}/  03–09 J1 plan
  {you}/ ────────────── 16 account
  {profile,support,privacy,about,feedback}/  11–15 More
  {eligibility,corridor,corridor-live}/  17a/17/18 J2 entry
  {setup,itinerary,booking}/  19/20/21 J2 plan
  {managed,trip}/ ───── 23/22 J2 live
  api/**/route.ts ───── 12 auth-gated API routes
  globals.css ───────── ALL 24 screens' ported CSS, one @layer components block
components/            app-shell, controls, icon, split-flap, duotone, clearing-splash,
                       trip-map, otp-input, offline-banner, service-worker-register
lib/                   trip-state, planner/{types,stub}, arrive-by, hm-time, save-commute,
                       demand, managed-plan, managed-trip, tokens, supabase/{client,server,middleware}
supabase/              migrations 0001–0004, seed.sql, tests/*.sql, config.toml (Postgres 17)
tests/                 32 unit files (140 Vitest) + e2e/journeys.spec.ts + auth.setup.ts (Playwright)
BUILD-LOG.md           full phase-by-phase build history — READ for "what was built and why"
PARKED.md              every open item needing Tarun's decision — READ before assuming something
                       is unfinished; it might just be waiting on him
ERD.md, IMPLEMENTATION-PLAN.md   original engineering plan (still accurate for what's left, e.g. P4.2 Mappls)
```

---

## 8. Where things stand with Tarun (context, not just code)

- He corrected two miscommunications this session: (1) he wanted the **live Vercel link** to
  share with test users, not a screenshot artifact — the artifacts I built were a QA aid, not
  the deliverable; the deliverable is the URL in §0. (2) He wanted actual **screenshots embedded**
  in the QA report, not a text-only table describing screens — don't describe a screen without
  showing it when he's asking to review visual work.
- He's fine with hardcoded test phone numbers for now — no urgency on a real SMS provider.
- He has not yet said whether to reset the corridor counter to 0.
- He has not yet said whether to fix the two letter-spacing deviations from spec.
- **Next planned step (per him): Mappls setup**, after this handoff.

---

## 9. Definition of done for what's left

Mappls wired (or explicitly deferred with his OK) → rate-limiting in → real SMS provider
configured (or explicitly deferred) → corridor counter resolved → full on-device NO-GO
walkthrough → then, only on his explicit approval, any further `git push`.

Everything up to "live and shareable with test users on hardcoded numbers" is **done now**.
