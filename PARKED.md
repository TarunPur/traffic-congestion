# Parked — needs Tarun (build continues around these)

Per Tarun's directive (2026-09-04): never stop on a blocker — park it here, keep building,
we resolve these together later. Local commits proceed; nothing is pushed to GitHub/Vercel
until Tarun approves.

## Open blockers

- [ ] **Supabase API keys** — project exists at `https://sgwazmaiaydkgdizguxy.supabase.co`.
  Need from Settings → API: the **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) and the
  **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`, server-only). Paste into `.env.local`.
  Until then: clients are wired against env vars; live DB connection / applying migrations to
  the remote project is parked. Migrations + RLS are authored as SQL and unit-tested regardless.
- [ ] **Supabase phone-OTP test numbers** — in Auth → Providers → Phone, enable and add a test
  number + fixed code (no SMS provider needed) so P3 login/OTP can be exercised.
- [ ] **Mappls key** — signup is Tarun's; confirm free/no-card/routing-in-tier. Until then the
  Planner runs on the locked sample-plan stub (P4.1). Do not wire P4.2 without the key.
- [ ] **NO-GO screen confirmations** — every product screen gets a screenshot via SendUserFile;
  Tarun confirms on his own device. Build proceeds; confirmations reconciled when he reviews.
- [ ] **git push / Vercel deploy** — deferred until Tarun approves (P0.5 CI + P11.6 launch).

## Resolved
- Supabase project created (2026-09-04).
