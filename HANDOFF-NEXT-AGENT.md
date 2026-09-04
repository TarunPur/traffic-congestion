# Clearline — Handoff for the next agent

**The app is BUILT, DEPLOYED, and LIVE.** Read this whole file before doing anything — especially
before touching Supabase, Vercel, `.env.local`, or claiming any screen is "done." Previous
handoffs in this file are superseded; this is the current truth as of the timestamp below.

Last updated: 2026-09-05 (session covering: desktop iPhone-frame decoration built then fully
reverted, Mappls integration spiked and scoped, transit-routing options researched and tested,
Delhi's official government transit data discovered, a GTFS download blocked mid-flow by a
flaky government server). Run `git log --oneline` and `git status` yourself before trusting
anything below — verify, don't assume.

---

## 0. State in 30 seconds

- **Live URL: https://traffic-congestion-tau.vercel.app** — real app, real database, shareable
  with test users right now. **Unchanged this session** — nothing new was pushed or deployed.
- Repo: `~/Desktop/The last case study/clearline-app` — git, branch `main`, working tree clean.
- `git log --oneline -3` should show `c39627e` (revert) on top of `f17341e`/`a71df38`/`31fa812`/
  `4032b8f` (the reverted frame experiment, safe to ignore) on top of `fab582e` (the last
  handoff, still the deployed commit — see §1 for why nothing since then shipped).
- **140 Vitest + 27 pgTAP + 5 Playwright e2e — all still green.** No product code changed this
  session; only research, one manual API spike, and a fully-reverted CSS experiment.
- **Still local-only / not started: real routing.** The planner runs on the locked sample-plan
  stub — every "Ways to go" result is canned. This session did real, verified groundwork toward
  fixing that (see §1, §5) but **no adapter code was written yet.**

---

## 1. What changed this session (read in order — explains *why*, not just *what*)

1. **Desktop-only iPhone bezel around the app, for viewing the live URL in a wide Chrome
   window — built across 4 passes, rejected every time, fully reverted.** Tarun wanted the live
   Vercel link to visually read as "a phone app" when opened on a desktop browser (cosmetic
   only; real phones/the installed PWA were never meant to be touched, and per `git diff` proof,
   never were). Passes: arbitrary frame size with a notch that overlapped real content (fixed
   same pass) → recalibrated to real iPhone 17 Pro measurements (402×874pt from Apple's official
   spec) but still looked "too broad" → rebuilt to match a reference photo-mockup (moved status
   bar/notch/home-indicator onto the actual screen surface; hit a real CSS bug where a container
   using `cqw` units for its own `border-radius` renders as an oval, not rounded corners — fixed
   by keeping that one property a fixed px value) → added metal-gradient depth/contrast. Still
   rejected ("shitty," "changed the design of the screen"). **Reverted all 4 commits** via
   `git revert` (non-destructive) — confirmed via `git diff` that `app/globals.css` and
   `components/app-shell.tsx` are now byte-identical to before the experiment started. **Nothing
   here was ever pushed, so the live Vercel deploy was unaffected the entire time.** Don't
   revisit this unless Tarun asks — it cost real time for zero shipped value.
2. **Mappls: signed up, key obtained, spiked, and scoped — genuinely useful for one narrow
   thing, not the transit engine.** Walked Tarun step-by-step through the actual Mappls
   developer console (he twice landed on the wrong site — mappls.com's consumer map app, not
   developer.mappls.com — including once hitting a login modal auto-filled with what looked
   like his phone number; backed out without touching it). Created a **Cloud App** ("Clearline"),
   got a **Static Key** (not the OAuth `client_id`/`client_secret` `.env.example` was scaffolded
   for — see §6.7). Stored in `.env.local` as `MAPPLS_STATIC_KEY` (gitignored, never echoed back
   in chat). **Real test call against the actual sample OD** (`route_adv`, driving profile,
   Hauz Khas Enclave → DLF Cyber Hub): `200 OK`, 26 min / 17 km, one road leg, **zero transit
   data**. Confirmed via Mappls's own docs: their routing profiles are `driving`/`biking`/
   `walking`/`trucking` only — no transit/multimodal profile exists. **Verdict: Mappls cannot
   power "Ways to go"'s actual transit legs**, but it's real and free for the "X min faster than
   driving" car-comparison baseline, and for geocoding/autosuggest/snap-to-road (31 REST APIs
   already allocated free, no card added — confirmed, a ₹1000 wallet credit shown in the console
   is trial credit, not something Tarun funded).
3. **Transit-routing alternatives researched and tested — not just read about.**
   - **Google Directions API (transit mode):** would work technically (Google's own transit
     directions are good for Delhi) but **requires a card/billing account on Google Cloud even
     to stay in the free tier** — confirmed from their docs. Ruled out per the project's
     consistent no-card preference, pending Tarun overriding that.
   - **Transitous** (free, no-card, community GTFS aggregator, the fallback the original
     `IMPLEMENTATION-PLAN.md` named): **live-tested with the real sample OD — zero itineraries,
     zero direct routes.** Sanity-checked the same code path against Berlin (a city it almost
     certainly covers) in the same call session — got 6 real multimodal itineraries back,
     proving the null Delhi result is genuine "not covered," not a malformed request. **Verdict:
     Transitous does not currently have Delhi loaded**, despite Delhi bus data existing publicly
     elsewhere (it showed up in Transitland's feed index).
   - **Self-hosted OTP2 (or MOTIS, what Transitous itself runs on):** the remaining real option.
     Needs an always-on server — ruled out by Tarun ("I don't want to commit for the server
     cost"). **Landed on a genuinely free architecture instead:** a scheduled GitHub Actions job
     (free CI compute, no card) periodically builds a routing graph from real Delhi GTFS data and
     precomputes routes for the app's known `places`, writing results into Supabase — the app
     then reads cached real routes instantly, no live server ever running. A GPS "current
     location" query outside the precomputed set falls back to the **already-designed** "no
     coverage" empty state on screen 08 — an honest degrade, not a bug, and appropriate for a
     small employer-partnered pilot. **Nothing built yet — this is the agreed direction, not
     implemented code.**
4. **Correction to something stated wrong earlier this session: Delhi Metro (DMRC) is NOT
   data-less.** Originally told Tarun no vendor has real Metro schedule data — **wrong**, caught
   and corrected same session. Delhi's own government open-data portal,
   **`otd.delhi.gov.in`**, publishes real GTFS for **both** DTC/cluster buses (`/data/static`)
   **and DMRC Metro** (`/data/staticDMRC` — 262 stations, 36 lines, ~412K scheduled stop-times,
   ~18K trips, last updated 2023-08-10, hosted with IIIT-Delhi). Free, no card — but the download
   requires submitting a name/email/purpose form and agreeing to their Terms (got Tarun's
   explicit OK before submitting anything; used `Tarun` / `tarun171093@gmail.com` / Non-Commercial
   / R&D).
5. **The GTFS download itself is currently blocked by a flaky server on Delhi's end — not a
   dead end, just bad timing.** The site's pages all load fine (confirmed: homepage, `/data/
   static`, `/data/staticDMRC` all `200 OK`), but the actual file-generation/download action
   failed three different ways in a row from my side (a dropped connection, then `503 Service
   Temporarily Unavailable`, then `403 Forbidden`), and **Tarun independently hit
   `ERR_INVALID_RESPONSE` from his own real browser** trying the same thing — confirming this is
   their backend, not anything either of us is doing wrong. Recommendation: **retry later**
   (a few hours / next day), don't hammer it. See §5 for exact retry steps.
6. **Process lesson, logged to Obsidian at Tarun's explicit request:** the entire Mappls/transit
   risk (does the chosen routing engine actually support Delhi transit multimodal itineraries?)
   was named as a "Gate" in the original build plan, but wasn't actually checked until now — 24
   screens and a full `Planner` interface/stub were built around an unverified assumption first.
   Tarun's directive going forward: **evaluate third-party integrations first, as top priority,
   the moment they're identified as a dependency — not at the end.** See
   `~/SecondBrain/Past Mistakes/2026-09-05 - evaluated a third-party integration only at the end instead of first.md`.

---

## 2. Design source-of-truth — read this before touching ANY screen's UI

The live app was built by **porting these files verbatim** — colors, spacing, copy, component
behaviour. If a future task touches a screen's look or feel, these are the files to check
against, in priority order. Do not re-derive design decisions from the live app's CSS backward;
these files are upstream of it.

| Path (relative to `~/Desktop/The last case study/`) | What it is | Status |
|---|---|---|
| `design/journey1-timetable/16screensjourney1-working/` | **The frozen visual contract.** All 24 screens as standalone HTML (`01-login.html` … `23-managed-home.html`, plus `17a-eligibility.html`), the shared `clearline.css`/`clearline.js`, real assets (`dlf-cyberhub.jpg`, MapLibre, mode icons). This is what `app/globals.css` and the React components were ported from. | ✅ **Active — this is the one to read/edit if a design change is ever needed.** |
| `design/journey1-timetable/16screensjourney1-working/08-waystogo.html` | Screen 08 specifically. | 🔒 **LOCKED v8 — additive changes only, never restyle.** Same rule applies to the built `/ways` route. |
| `design/journey1-timetable/10screensjourney1-working/` | An earlier 10-screen version of the same working copy. | ❄️ **FROZEN — has its own `FROZEN-DO-NOT-EDIT.txt` marker. Do not edit or treat as current.** |
| `design/design.md` | The full design system: tokens (`--paper`, `--ink`, `--grey`/`--grey2`, `--accent` oxblood, spacing, type), the monochrome + risk-only-oxblood rules, per-screen notes. | ✅ Frozen-for-build reference. Two known stale details: §1's grey table lists pre-retune values (`#726c5e`/`#9a9384`) — the real, correct, *built* values are `#5f5a4e`/`#877f6e`, documented in §11 and already in `app/globals.css`. Docs-only cleanup, logged in `PARKED.md`. |
| `design/journey1-timetable/BUILD-SPEC.md` | Per-screen behavioural spec (inputs · validation · transitions · edge states) for all 24 screens — this is what `IMPLEMENTATION-PLAN.md`'s screen tasks were built against. | ✅ Reference. |
| `~/Desktop/The last case study/journey.md` | The two-journey, 24-screen flow map (entry/exit points, activation model, nav map). | ✅ Reference. |
| `~/Desktop/The last case study/ERD.md`, `IMPLEMENTATION-PLAN.md`, `PRODUCT.md`, `ClaudePRD.md` | Engineering/product spec docs the original build plan came from. `IMPLEMENTATION-PLAN.md` §"Phase 4" is specifically the planner/Mappls section this session's work extends. | ✅ Reference — largely executed already; still accurate for what's left (e.g. the real routing engine, still open). |
| `design/journey1-timetable/HANDOFF-NEXT-SESSION.md`, `HANDOFF-timetable-redesign.md` | Design-phase-era handoffs, from before the real app build started. | 🗄️ Historical — superseded by this file and `clearline-app/BUILD-LOG.md` for anything about the actual product build, but still useful for design *history* / *why* a decision was made. |
| `design/journey1-timetable/claude-design-improvement-3rdsept/`, `design/_archive/`, `design/journey1/` | Earlier design explorations / a rejected craft-elevation pass. | 🗄️ **Archived — not the current design. Do not port from these.** |
| `design/journey1-timetable/16screensjourney1-working/_all-screens-live.html` | A single-page live preview of all 23 (working-copy) screens, served locally. | ℹ️ Needs a local static server restarted each session (historically `localhost:8747`) — not currently running, and not needed for backend/integration work like this session's. |

**The rule that matters most:** the live app (`clearline-app/app/`, `components/`,
`app/globals.css`) is the *built, current, deployed* product — for anything touching data,
routing, or backend logic (like the Mappls/transit work below), you don't need the design files
at all. Only open them if a task specifically changes what a screen looks like.

---

## 3. Non-negotiable rules (still in force)

1. **Port, don't restyle.** See §2 — the frozen working copy is the visual contract.
2. **Reuse built components** — don't rebuild `SplitFlap`, `Duotone`, `ClearingSplash`, `TripMap`,
   `Icon`, `AppShell`, `Cta`, `Segmented`, `FilterTabs`, `TextField`, `SelectableRow`, `RuledRows`,
   `TabBar`, `OtpInput`.
3. **Honesty everywhere**: live-vs-scheduled labels, "you arrange this," source+freshness lines,
   J2 "committed window" (never "guaranteed"), no fabricated traction/counts. This directly
   applies to the routing work: if a real route can't be computed, show the honest "no coverage"
   state — never fall back to fabricated-looking data.
4. **Oxblood `--accent #8f342a` is risk-only.** Never selection/positive/decoration.
5. **No money in the pilot.** `bookings.billing_on` stays false — DB default + RLS both enforce
   this, proven unforgeable by `j2_rls_test.sql`. Don't touch that guarantee without a security
   review.
6. **TDD. No `any`** (lint fails the build on it).
7. **NO-GO** — a screen isn't "done" until verified live in a **real browser** (not just an
   agent's automation tab) and Tarun has seen it himself.
8. **🔒 High-stakes paths** (auth, RLS/policies, `app/api/*`, `.env*`, `supabase/migrations|
   functions`) need a `security-review` pass before committing — record it with
   `node ~/.claude/hooks/security-gate.mjs --record-pass` or the commit hook blocks you. **This
   applies to the real-routing work**: `/api/plan` handles user data and calls an external
   engine.
9. **`git push` needs Tarun's explicit OK each time** — no standing permission from a past
   approval.
10. **NEW this session — evaluate third-party integrations first.** Before designing any code or
    UI around an external API/data source, read its actual docs for the *specific* capability
    needed and make one real test call, before committing to it. See §1.6.

---

## 4. Environment — do this first every session

```bash
cd "~/Desktop/The last case study/clearline-app"
open -a Docker                         # wait until it's up
supabase status || supabase start      # LOCAL Supabase must be running for local dev
supabase db reset                      # re-applies migrations 0001–0004 + seed.sql
pnpm install                           # if node_modules missing
pnpm dev                               # http://localhost:3000
```

- `.env.local` (gitignored) points at **local** Supabase, plus now has `MAPPLS_STATIC_KEY`
  (real, working, added this session — see §1.2). The originally-scaffolded
  `MAPPLS_CLIENT_ID`/`MAPPLS_CLIENT_SECRET` lines are still present but empty/unused — Mappls's
  actual Cloud App auth is a single static key, not OAuth. `.env.example` should eventually be
  updated to match (docs-only cleanup, not urgent).
- Test login locally and on production: phone `98123 45678` / OTP `424242`, or
  `99999 00001` / `123456`.
- **Never run `pnpm build` while `pnpm dev` is running** — clobbers `.next`.
- **Vercel project**: `traffic-congestion` under team `tarun-puri-s-projects1`. Auto-deploys on
  push to `main`. Nothing new deployed this session.

---

## 5. What's NOT done — in priority order

1. **Real transit routing — the actual next task, and the current session's main unfinished
   thread.** Concrete next steps, in order:
   a. **Retry the Delhi GTFS download** once their server settles (§1.5). Two datasets needed:
      - Bus: `https://otd.delhi.gov.in/data/static/` (`/data/static` page).
      - Metro: `https://otd.delhi.gov.in/data/staticDMRC/` — form needs Name=`Tarun`,
        Email=`tarun171093@gmail.com`, Usage=Non-Commercial, Purpose=R&D, Terms ticked.
      If scripting the download again, note: their server rejected rapid automated retries
      (503 then 403) — space out attempts, or ask Tarun to click through it once in his own
      browser (more reliable, no bot-detection risk).
   b. **Spike OTP2 locally** (no server cost yet — just on this machine) — build a graph from the
      downloaded GTFS + a Delhi OSM extract (Geofabrik), run one real query for the sample OD,
      confirm it actually produces a sensible multimodal itinerary before building anything
      permanent.
   c. **If the spike works:** design the free precompute+cache pipeline — a scheduled GitHub
      Actions workflow that builds the graph, computes routes for the `places` table, and writes
      results to Supabase (new table/columns not yet designed — that's part of this task). Build
      a `TransitPlanner` (or similarly-named) implementing `lib/planner/types.ts`'s `Planner`
      interface, reading from that cache. Keep the stub as fallback for anything not cached.
   d. **Separately, wire Mappls for the driving-comparison baseline** (§1.2) — this is
      independent of the transit work and could be done first if it's a faster win: a small
      adapter call to `route_eta` (traffic-aware, more realistic than the `route_adv` test call)
      for the "X min faster than driving" line on screen 09.
   e. **Metro legs**: hand-curate for known corridors as originally planned, OR — now that real
      DMRC GTFS is available (§1.4) — evaluate feeding it into the same OTP2 graph alongside bus
      data, once the download succeeds. Not yet decided; worth revisiting once the data is in
      hand and its accuracy/freshness (2023 data) can be sanity-checked.
2. **API rate-limiting** — none of the mutating routes are rate-limited. Self-DoS only, but
   should land before any public/open launch.
3. **Production phone-auth is test-numbers-only.** Tarun confirmed he's fine with this for now.
4. **Corridor counter is at 1**, not 0 — Tarun hadn't said whether to reset it as of this
   handoff. One SQL statement in the Supabase SQL Editor: `update corridors set
   committed_count = 0 where demo = true;`
5. **On-device NO-GO walkthrough** — still only partial (one confirming screenshot, not a full
   click-through).
6. **Two cosmetic letter-spacing deviations** from `design.md` — low priority, his call.
7. **The frozen prototype's `.addrow` display:block bug** — still not fixed, still needs
   Tarun's sign-off before touching the frozen HTML (see `PARKED.md`).

---

## 6. Gotchas that will bite you

1. **This machine's `curl`/DNS resolution is intermittently flaky for some hosts** — hit this
   twice this session (`api.transitous.org`, `otd.delhi.gov.in`) where `curl` reported "Could
   not resolve host" while `dig`/`nslookup` resolved the same host fine seconds later. Workaround
   that reliably fixed it: `dig +short <host>` to get an IP, then `curl --resolve
   <host>:443:<ip> ...` to bypass whatever curl's own resolver was doing. Don't assume a host is
   actually down just because one curl attempt fails to resolve — verify with `dig` first.
2. **Government/free-tier data portals can rate-limit or flake under repeated automated
   requests.** `otd.delhi.gov.in`'s download action returned three different failure modes
   across a handful of attempts (connection drop, 503, 403) — likely their backend struggling,
   possibly bot-detection. Space out retries; prefer a human clicking through once over scripted
   repeated POSTs.
3. **Mappls's Cloud App gives a single Static Key, not OAuth `client_id`/`client_secret`** —
   the `.env.example` scaffold assumed OAuth (from generic docs) before anyone had actually
   created an app in the console. Real auth: `access_token=<static key>` as a query param.
   Endpoint format: `https://route.mappls.com/route/direction/route_adv/driving/
   {lng1},{lat1};{lng2},{lat2}?access_token=...` (confirmed via a real 200 response this
   session).
4. **`NEXT_PUBLIC_*` env var changes need a manual Vercel redeploy** — saving doesn't rebuild.
5. **CSS bugs are invisible to this project's test suite** — jsdom does no layout, mocked
   fetches have no loading window. Always eyeball a real Chrome tab.
6. **This agent's own browser-automation tab has real limitations, encountered again this
   session:** `resize_window` calls report success but don't actually change the tab's rendered
   viewport — screenshots kept coming back at the same size regardless of the requested
   dimensions. Don't trust it for testing responsive/breakpoint behaviour; ask Tarun to check on
   his real browser instead. (Same family of issue as MapLibre rendering blank there, noted in
   prior handoffs.)
7. **`git push` and any `supabase db push`/schema change need Tarun's explicit OK each time.**

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
  api/**/route.ts ───── 12 auth-gated API routes (/api/plan is the one this session's work targets)
  globals.css ───────── ALL 24 screens' ported CSS, one @layer components block
components/            app-shell (reverted to pre-frame-experiment state), controls, icon,
                       split-flap, duotone, clearing-splash, trip-map, otp-input, offline-banner
lib/                   trip-state, planner/{types,stub}  ← the Planner seam a real adapter plugs into
                       arrive-by, hm-time, save-commute, demand, managed-plan, managed-trip,
                       tokens, supabase/{client,server,middleware}
supabase/              migrations 0001–0004, seed.sql (6 places incl. the demo OD), tests/*.sql
tests/                 32 unit files (140 Vitest) + e2e/journeys.spec.ts (Playwright)
BUILD-LOG.md           full phase-by-phase build history
PARKED.md              every open item needing Tarun's decision — updated this session
HANDOFF-NEXT-AGENT.md  this file
ERD.md, IMPLEMENTATION-PLAN.md   original engineering plan — Phase 4 = planner/Mappls
.env.local             gitignored; has the real MAPPLS_STATIC_KEY now (see §4)
```

Design files (not in this repo): see §2's table, all under
`~/Desktop/The last case study/design/`.

---

## 8. Where things stand with Tarun (context, not just code)

- He's frustrated by iterative visual guessing that doesn't land — the iPhone-frame experiment
  went through 4 passes and was still rejected each time before he asked to just revert it.
  Lesson applied: for anything visual/subjective, verify against a concrete reference (a real
  measurement, a screenshot he sent) rather than iterating blind, and don't over-promise a fix is
  "good" without him confirming.
- He explicitly does not want to pay for a server — the entire transit-routing plan is shaped
  around a genuinely free (GitHub Actions + Supabase cache) architecture instead of a live OTP2
  server, per his direct instruction.
- He gave explicit, in-the-moment permission for two sensitive actions this session: (1) storing
  and test-calling his real Mappls API key, (2) submitting a government data-download form using
  his real name and email. Both were asked for specifically before acting, not assumed. Keep
  doing that for anything similar (new API keys, forms submitted in his name, anything that
  represents him externally).
- His directive on process, verbatim: **"the first thing we do when some integrations are there
  is to evaluate first as top priority, not look at it in the end."** This should shape how any
  future external dependency (a new API, a new data source) gets handled from now on — spike it
  before designing around it.

---

## 9. Definition of done for what's left

Real Delhi transit data obtained → OTP2 spike confirms it produces usable multimodal itineraries
→ free precompute+cache pipeline built and wired behind the existing `Planner` interface →
Mappls wired for the driving-comparison baseline → rate-limiting in → real SMS provider
configured (or explicitly deferred) → corridor counter resolved → full on-device NO-GO
walkthrough → then, only on Tarun's explicit approval, any further `git push`.

Everything up to "live and shareable with test users on hardcoded numbers, sample routing data"
is **done now**. Nothing shipped or regressed this session — it was a research/spike session for
the next big functional piece.
