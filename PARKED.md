# Parked — needs Tarun (build continues around these)

Per Tarun's directive (2026-09-04): never stop on a blocker — park it here, keep building,
we resolve these together later. Local commits proceed; nothing is pushed to GitHub/Vercel
until Tarun approves.

## Open blockers

- [ ] **Mappls key** — signup is Tarun's; confirm free/no-card/routing-in-tier. Until then the
  Planner runs on the locked sample-plan stub (P4.1) — **every "Ways to go" result is canned, not
  a real computed route.** This is the single biggest functional gap in the live app. Do not wire
  P4.2 without the key.
- [ ] **API rate-limiting** — none of the mutating routes (`/api/commute|profile|feedback|privacy|
  demand|eligibility|commit|managed*`) are rate-limited. Self-DoS / abuse only (all owner-scoped),
  but add a per-user/IP limiter before any public/open launch.
- [ ] **Production auth is test-numbers-only.** Tarun confirmed (2026-09-04) he's fine with this
  for now — no urgency on a real SMS provider. Needed only before opening testing to real phone
  numbers.
- [ ] **Corridor commit-counter is genuinely at 1, not 0** — from live-testing the commit write
  path during the 2026-09-05 QA pass. Real data, not fabricated, but Tarun hadn't said whether to
  reset it before real users see it as of this entry. One SQL statement in the Supabase SQL
  Editor resets it: `update corridors set committed_count = 0 where demo = true;`
- [ ] **Two cosmetic letter-spacing deviations from `design.md`**, found during the 2026-09-05 CSS
  byte-level audit — not bugs, just imprecise: primary CTA is `.055em` vs spec's `.11em`; `.lab`
  micro-labels are `.17em` vs spec's `.14em`. Low priority, Tarun's call whether to tighten.
- [ ] **Full on-device NO-GO walkthrough** — Tarun has sent one real-device screenshot (confirming
  the live-trip map renders correctly, unlike in browser-automation testing) but hasn't done a
  full click-through of the live app on his own phone yet.
- [x] **Local phone-OTP** — DONE: config.toml has `[auth.sms.test_otp]` (98123 45678→424242,
  99999 00001→123456) + a dummy provider so phone auth runs locally without SMS.
- [x] **`/dev/*` gallery routes** — DONE (P11.1): a 404 in production via `lib/supabase/middleware.ts`.
- [x] **Playwright e2e** — DONE 2026-09-04 (commit `b98d194`). `pnpm test:e2e` → 5/5 green (needs
  local Supabase up + `supabase db reset` first). **Not yet in CI** — the GitHub Actions `verify`
  job still runs typecheck/lint/unit/build only; adding e2e there needs a Supabase service
  container.
- [x] **git push / Vercel deploy** — DONE 2026-09-04/05. Live at
  `https://traffic-congestion-tau.vercel.app`. Remote Supabase project linked (`sgwazmaiaydkgdizguxy`),
  migrations + seed applied, env vars set, phone auth enabled with test numbers. GitHub/local/Vercel
  confirmed byte-identical at `8af139e` by hash comparison.
- [x] **Remote production phone auth was disabled** (found + fixed 2026-09-04) — the remote
  Supabase project had Phone provider off by default, blocking all logins on the live site past
  the first ~4 screens. Enabled with the same test-number pattern as local, valid to 2027-09-30.
- [x] **Screen 17 corridor loading-state bug** — found + fixed during the 2026-09-05 live QA pass
  (commit `8af139e`). See "Resolved" below for detail.

## Doc discrepancies to reconcile (non-blocking; I used the frozen prototype)
- [ ] **TripMap filter numbers** — ERD §2 lists `grayscale(.82) contrast(.95) brightness(1.05) sepia(.10)`,
  but the frozen prototype (06-setonmap.html / 22-livetrip.html) uses
  `grayscale(.88) contrast(1.1) brightness(1.02) sepia(.08)` + paper-multiply tint. Per "port, don't
  re-derive" I used the prototype values. Reconcile the ERD text when convenient.
- [ ] **design.md §1 grey table** — still lists pre-retune greys `#726c5e/#9a9384`; the authoritative
  retuned set `#5f5a4e/#877f6e` (ERD §2 + active CSS) is what's built. Docs cleanup only.
- [ ] **🐞 Prototype has the same `.addrow` bug the app just fixed** — in
  `design/journey1-timetable/16screensjourney1-working/10-savedhome.html` (~line 63–64),
  `.addrow .tx .t` / `.d` are `<span>`s with no `display:block`, so the evening-commute title and
  description render on one line. The `margin-top:2px` on `.d` is a no-op there, proving block was
  intended. Fixed in the app (`app/globals.css`, commit `2a1e871`); **the frozen prototype is NOT
  edited** — needs Tarun's OK since it's the visual contract. Screen 10 was never eyeballed in
  review (handoff §0 open item 1), which is why it survived.

## Later refinements (non-blocking)
- [ ] **Places `multi_part`/`parts` model** — screen 05→07 routing currently uses an `isMultiPart`
  name/type heuristic. A proper `multi_part boolean` + `parts` (buildings/gates) on the places table
  is the real model; screen 07 uses a demo parts list until then.

## Resolved
- Supabase project created (2026-09-04).
- Screen 10 `.addrow` inline-span display:block bug — fixed 2026-09-04, commit `2a1e871`.
- `next@15.1.6` CVE-2025-66478 (CVSS 10.0 RCE) — fixed 2026-09-04/05, bumped to 15.1.9, commit `c90bbdc`.
  App was never publicly reachable while vulnerable (Vercel refused every deploy), no secrets
  needed rotating.
- Screen 17 corridor loading-state bug (hardcoded fake corridor name + contradictory "threshold
  met" message shown for 1–3s while `/api/corridor` was in flight) — fixed 2026-09-05, commit
  `8af139e`. Found during a live QA pass on production; not caught by tests since jsdom's mocked
  fetch resolves instantly, never exposing the loading window.
- `tests/corridor.test.tsx` CI-only unhandled-rejection flake — fixed 2026-09-04, commit `7f220e5`.
