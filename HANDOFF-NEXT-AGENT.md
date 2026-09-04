# Clearline — Handoff for the next build agent

**You are resuming a real app build. Phases 0–5 are DONE. Start at Phase 6.**
Read this whole file once, then follow it literally. Do not redesign anything. Do not skip steps.

---

## 0. What this is (30-second orientation)

- Repo: `~/Desktop/The last case study/clearline-app` (git, branch `main`, **local only — never `git push`**).
- It's a Next.js 15 (App Router) + TypeScript (strict, **no `any`**) + Tailwind + Supabase PWA.
- You build **real screens** by **porting exactly** from the FROZEN prototype at
  `../design/journey1-timetable/16screensjourney1-working/` (HTML files `01-…`–`23-…` + `clearline.css` + `clearline.js`).
- Source-of-truth docs (in `../`, i.e. "The last case study/"): `IMPLEMENTATION-PLAN.md` (the task list),
  `ERD.md` (engineering contract), `design/design.md` (frozen visual system), `design/journey1-timetable/BUILD-SPEC.md`
  (per-screen behaviour, §7/§9–§12), `PRODUCT.md`, `journey.md`.
- Progress + decisions are logged in `BUILD-LOG.md` (this repo). Things blocked on the human are in `PARKED.md`.

## 1. Non-negotiable rules (violating any = a build defect)

1. **Port, don't restyle.** Reproduce the prototype exactly. If a class/value exists in `clearline.css`, copy it verbatim.
2. **Reuse the built components** — never re-invent them. They live in `components/`:
   `Icon`, `AppShell`, and from `components/controls.tsx`: `Cta, Segmented, FilterTabs, TextField, SelectableRow, RuledRows, TabBar`;
   plus the 4 signatures `SplitFlap, Duotone, ClearingSplash, TripMap`, and `OtpInput`.
3. **Honesty everywhere:** live-vs-scheduled labels, "you arrange this" on auto/walk legs, source+freshness lines,
   J2 "committed window" (never "guaranteed"). Never fabricate traction/counts.
4. **Oxblood `--accent #8f342a` is RISK ONLY** (errors/late/disruption/emergency). Never for selection/positive/decoration.
5. **No money in the pilot.** `bookings.billing_on` stays false; no payment SDK.
6. **RLS on every user table; eligibility decided server-side; k-anon N≥5; home never exposed.**
7. **TDD** — write the test first. **No `any`** (lint errors on it).
8. **NO-GO** — a product screen isn't "done" until it's verified live in Chrome (console clean) and a screenshot is
   sent to the human. Never claim a screen done off tests alone.

## 2. Environment — do this FIRST every session

```bash
cd "~/Desktop/The last case study/clearline-app"
supabase status || supabase start      # local Supabase MUST be running (Docker must be up: `open -a Docker` then wait)
pnpm install                           # if node_modules missing
pnpm dev                               # http://localhost:3000
```
- `.env.local` already points at LOCAL Supabase (well-known local keys; fine). Do NOT put real remote keys here.
- **Auth is required for most routes.** Test login: phone `98123 45678`, OTP code `424242`
  (test numbers live in `supabase/config.toml [auth.sms.test_otp]`; a dummy provider is configured so no SMS is sent).
- If the DB schema/seed seems missing after a restart: `supabase db reset` (re-applies migrations + `supabase/seed.sql`).

## 3. The exact loop for EVERY screen/task (follow in order)

1. **Read the prototype file** for the screen (e.g. `../design/journey1-timetable/16screensjourney1-working/10-savedhome.html`)
   AND its spec in `BUILD-SPEC.md` (§7 for J1 screens, §9–§12 for states/J2). Grep the HTML for the classes + JS logic.
2. **Port any screen-specific CSS** verbatim into `app/globals.css` inside `@layer components` (keep the existing pattern;
   search the file for a similar block). Reuse existing tokens/classes; don't invent values.
3. **Write the test first** (`tests/<name>.test.tsx`), then the route (`app/<route>/page.tsx`). Reuse components (rule 2).
   Mock `next/navigation` (`useRouter`), `@/lib/trip-state`, and heavy components (`TripMap`, `Duotone`) in tests as needed
   (see `tests/from.test.tsx`, `tests/choose.test.tsx` for the pattern).
4. **Verify:** `pnpm typecheck && pnpm lint && pnpm test` must all be green.
   For DB/RLS changes also run `supabase test db` (pgTAP in `supabase/tests/`).
5. **Live NO-GO:** `pnpm dev`, log in if needed, open the route in Chrome (use the browser tools), screenshot,
   read console (must be clean), then `SendUserFile` the screenshot to the human with a one-line caption.
   - MapLibre note: the map only composites in a *real* visible browser tab. In the automation tab it can render blank —
     click the map's zoom "+" control once to kick a repaint, then screenshot. This is expected, not a bug.
6. **Commit locally** (small, per task). Message: `PX.Y: NN <screen> — <one line>` + the two trailer lines used on every commit
   (copy them from `git log -1`). Update `BUILD-LOG.md` with a short entry.
7. **🔒 High-stakes paths** (anything touching auth, RLS/policies, `app/api/*`, `.env*`, `supabase/migrations|functions`, `.sql`):
   BEFORE committing, review the staged diff for security (the `security-review` skill's auto-diff fails with no git remote —
   just review the staged files yourself), then record the gate pass:
   `node ~/.claude/hooks/security-gate.mjs --record-pass` (a PreToolUse hook blocks the commit otherwise).

## 4. What already exists (reuse these — do not rebuild)

- **State:** `lib/trip-state.ts` (`useTrip`/`getTrip`/`setTrip`, localStorage) carries origin/dest/arriveBy/service across screens.
- **Search:** `lib/use-places-search.ts` (debounced query over the `places` table) + `iconForPlace` + `isMultiPart`.
- **Planner:** `lib/planner/types.ts` (`Planner`, `Plan`, `Leg`, `CAR_BASELINE`, `hmToMin`) + `lib/planner/stub.ts`
  (`stubPlanner`, the locked sample plans) + `app/api/plan/route.ts` (auth-gated POST → Plan[]).
- **Helpers:** `lib/arrive-by.ts`, `lib/use-count-up.ts`, `lib/use-reduced-motion.ts`, `lib/tokens.ts` (`TOKENS`, `LINECOL`,
  `lineColour`, `FEEDBACK_TONES`).
- **Auth:** `app/login/actions.ts` (server actions), `middleware.ts` (route protection — add new authed routes are protected
  by default; public routes are whitelisted in `lib/supabase/middleware.ts` — `/login`, `/verify`, `/api/*`, `/dev/*`).
- **DB clients:** `lib/supabase/{client,server}.ts`. Schema + RLS in `supabase/migrations/` (J1 = `…0001`, J2 = `…0002`),
  types in `lib/supabase/types.ts` (regenerate after a migration: `supabase gen types typescript --local > lib/supabase/types.ts`).
- **Routes so far:** `/login /verify /choose /from /to /map /part /ways /plan` (+ `/dev/*` galleries, `/api/health`, `/api/plan`).

## 5. Remaining work — Phases 6–11 (build in this order)

For each screen: read its prototype HTML + `BUILD-SPEC.md`, port, TDD, verify live, screenshot, commit. Suggested route names in ().

### Phase 6 — J1 home & shell
- **10 Saved / home** (`/` — replace the placeholder home). "My rides" hero (leave-by `SplitFlap`, next departures),
  add-evening nudge, **bottom `TabBar` (Home/Plan/You)**, save-commute → writes `saved_commutes` (RLS owner-only; CTA restates
  "Saved as your commute"), J2 upsell → `/eligibility`, disruption banner, empty state. Port `10-savedhome.html`.
  → Wire screen 09's + 08's "Save this plan"/"Set as my commute" to actually insert `saved_commutes`, then land here.
  🔒 (writes saved_commutes) — security-review before commit.
- **16 You / Account** (`/you`) — `TabBar` shell, More menu rows → 11–14, sign-out → `/login` (`supabase.auth.signOut()`). Port `16-account.html`.

### Phase 7 — J1 More + demand (🔒 on 13 + demand)
- **11 Profile** (`/profile`) — progressive `profile_fields` rows (all optional, "Not set"), inline editors; home/work feed
  `saved_commutes` + J2 prefill. Port `11-profile.html`. 🔒 (profile_fields).
- **12 Support** (`/support`) — single-open accordion (verbatim honesty answers) → 15/report/contact. Port `12-support.html`.
- **13 Privacy & data** (`/privacy`) 🔒 — "what we keep" list, demand toggle (`demand_prefs`), per-trip delete,
  **two-step oxblood delete-all** (arm→confirm, auto-disarm). Delete removes rows + demand. Port `13-privacy.html`.
- **14 About** (`/about`) — source icon+badge matrix (live/scheduled/reference/demo), `ClearingSplash`,
  "pre-launch — no fabricated traction" line. Port `14-about.html`.
- **15 Feedback** (`/feedback`) — 1–5 §1c diverging scale (tone-underline, `FEEDBACK_TONES`; ink text on the light amber),
  optional note → `feedback` (internal-only RLS), disabled-until-rated, "Thanks — noted" → `/`. Port `15-feedback.html`.
- **Demand instrumentation** 🔒 — `POST /api/demand` (server-write `demand_signals`), a **k-anon N≥5 aggregate view**
  (add a migration), raw rows never client-readable, home never identifying. Add a pgTAP test proving <5 is hidden.

### Phase 8 — J2 entry: eligibility, waitlist, activation (🔒 on 17a)
- **17a Eligibility** (`/eligibility`) 🔒 — form (name/employee-ID/company/work-email); **`POST /api/eligibility` decides
  `partnered` SERVER-SIDE** vs `partner_domains` (client can NEVER forge it); ID captured-not-verified; partnered → `/setup`,
  personal/unknown → `/corridor` (NOT an error). Port `17a-eligibility.html`. Add a test proving the client can't set partnered.
- **17 Corridor & waitlist** (`/corridor`) — corridor read (committed_count/threshold, "Opening soon"), `POST /api/commit`
  (creates a `commitment`, recomputes `committed_count` server-side), "intent not money" copy. Port `17-corridor.html`.
- **18 Corridor is live** (`/corridor-live`) — `ClearingSplash` resolve; "Set up" → `/setup`, "Later" → `/`;
  fires on real activation (partnered immediately / demand threshold), not a timer. Port `18-corridor-live.html`.

### Phase 9 — J2 plan: setup, itinerary, booking
- **19 Managed setup** (`/setup`) — home/tower (prefill from `profile_fields`), arrival/return steppers ±15, Mon–Fri chips;
  writes `managed_setups`; history-aware back; → `/itinerary`. Port `19-setup.html`.
- **20 Itinerary card** (`/itinerary`) — **boarding-pass "stub"** (LEAVE `SplitFlap` hero, dashed perforation, `--paper2`, NOT a
  card), all-contracted legs (`.tl.mgd` filled-ink-square marker, AC-shuttle trunk), why-this-plan stats, "committed window"
  honesty, fallback-cab+credit note; → `/booking`. Port `20-itinerary.html`. (New marker `.tl.mgd` = filled ink SQUARE per design §11.)
- **21 Booking & pass** (`/booking`) — trip-type + per-day/monthly, "what's covered", `bookings.billing_on=false`, "₹0 · pilot"
  copy, **no payment SDK**; → `/managed`. Port `21-booking.html`. 🔒 (bookings — verify billing_on can't be true, RLS already enforces it).

### Phase 10 — J2 live: trip + managed home
- **23 Managed home** (`/managed`) — Myself/Clearline segment (Myself → `/`), assigned ride (`SplitFlap`, `.tl.mgd`,
  "Pilot — no charge yet"), reschedule + modify (→ `/setup` prefilled), `TabBar`; → `/trip`. Port `23-managed-home.html`.
- **22 Live trip** (`/trip`) — `TripMap`, `SplitFlap` ETA, driver/vehicle, step tracker (done/now/upcoming), Share (copy link),
  **Emergency (oxblood)**; **Supabase Realtime on `managed_trips`**; feature-flag the source (Tookan trial ↔ DIY driver-GPS).
  Port `22-livetrip.html`. Steps advance via Realtime; map repaint kick; leg-fail → fallback+credit state.

### Phase 11 — Hardening / a11y / PWA / launch
- Sweep every screen's states (error/empty/loading/offline/edge) + the offline "last-known + freshness" banner.
- Accessibility AA (axe clean, keyboard-only, reduced-motion settle everywhere), responsive 320/390/430/tablet.
- PWA install + honest offline; Lighthouse perf on 4G; maps lazy.
- **Gate/remove `/dev/*` routes before launch** (currently public — see PARKED). Full `security-review` sweep + record pass.
- Playwright e2e per `journey.md`. Then: **only when the human approves**, wire remote Supabase keys, `git push`, Vercel deploy,
  and a full on-device NO-GO walkthrough with the human.

## 6. Parked / needs the human (see `PARKED.md`, don't block on these)
- Remote Supabase keys (for Vercel deploy only — local build is self-sufficient).
- Mappls key → the Planner runs on `stubPlanner` (P4.1). **Never wire real Mappls (P4.2) without the key.**
- A real `multi_part`/`parts` column on `places` (screen 05→07 currently uses the `isMultiPart` heuristic; 07 uses a demo parts list).
- `git push` / Vercel / on-device confirms — human-approved only.

## 7. Gotchas that will bite you
- **Supabase must be running** before any DB/auth work or `/api/plan` returns 401 / pages redirect to `/login`.
- **MapLibre blank in the automation tab** is expected — kick with the zoom control; it paints in a real browser.
- **`useSearchParams` needs a `<Suspense>` wrapper** in Next 15 (see `app/plan/page.tsx`).
- **The security-gate hook blocks commits** touching high-stakes paths until you record a pass (§3.7).
- **Don't create `any`** — lint fails the build. Cast through `unknown` to the generated `Json` type for jsonb columns
  (see `app/api/plan/route.ts`).
- Update `BUILD-LOG.md` per task and `PARKED.md` when you defer something. Update the auto-memory
  `~/.claude/projects/-Users-tarunpuri/memory/project_clearline_app_build.md` when a phase completes.

**Definition of done:** all 24 screens live on the local build, both journeys pass, honesty labels everywhere, RLS + k-anon hold,
no money wired, tests green — then hand back to the human for push/deploy approval.
