# Parked — needs Tarun (build continues around these)

Per Tarun's directive (2026-09-04): never stop on a blocker — park it here, keep building,
we resolve these together later. Local commits proceed; nothing is pushed to GitHub/Vercel
until Tarun approves.

## Open blockers

- [ ] **Supabase REMOTE keys (for deploy only)** — project `https://sgwazmaiaydkgdizguxy.supabase.co`.
  Local dev is now fully unblocked: I ran `supabase start`, applied the migrations + seed, and
  `.env.local` points at LOCAL Supabase (health route verified `connected:true`). For Vercel deploy
  we'll need the **remote** anon + service_role keys (Settings → API) as Vercel env vars, and to push
  the migrations to the remote project (`supabase db push` after `supabase link`). Not blocking local build.
- [x] **Local phone-OTP** — DONE: config.toml has `[auth.sms.test_otp]` (98123 45678→424242,
  99999 00001→123456) + a dummy provider so phone auth runs locally without SMS. Full login→OTP
  flow verified live.
- [ ] **PRODUCTION auth** — for the remote/prod project: configure a REAL SMS provider (or dashboard
  test numbers for the pilot) and ensure **no test-OTP numbers** ship to prod. Gate/remove the
  `/dev/*` gallery routes before launch (currently public). (P11.5)
- [ ] **Mappls key** — signup is Tarun's; confirm free/no-card/routing-in-tier. Until then the
  Planner runs on the locked sample-plan stub (P4.1). Do not wire P4.2 without the key.
- [ ] **NO-GO screen confirmations** — every product screen gets a screenshot via SendUserFile;
  Tarun confirms on his own device. Build proceeds; confirmations reconciled when he reviews.
- [ ] **git push / Vercel deploy** — deferred until Tarun approves (P0.5 CI + P11.6 launch).

## Doc discrepancies to reconcile (non-blocking; I used the frozen prototype)
- [ ] **TripMap filter numbers** — ERD §2 lists `grayscale(.82) contrast(.95) brightness(1.05) sepia(.10)`,
  but the frozen prototype (06-setonmap.html / 22-livetrip.html) uses
  `grayscale(.88) contrast(1.1) brightness(1.02) sepia(.08)` + paper-multiply tint. Per "port, don't
  re-derive" I used the prototype values. Reconcile the ERD text when convenient.
- [ ] **design.md §1 grey table** — still lists pre-retune greys `#726c5e/#9a9384`; the authoritative
  retuned set `#5f5a4e/#877f6e` (ERD §2 + active CSS) is what's built. Docs cleanup only.

## Resolved
- Supabase project created (2026-09-04).
