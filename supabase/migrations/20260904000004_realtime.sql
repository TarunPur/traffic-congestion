-- Clearline — Realtime for the live managed trip (P10, BUILD-SPEC §11·22).
-- `managed_trips` is the Realtime source for screen 22: the driver-GPS feed UPDATEs the row
-- (steps / eta_min / status) and the screen re-renders. RLS still applies to Realtime — a client
-- only receives changes to rows it can read (managed_trips_owner_read, via booking→setup→user).

alter publication supabase_realtime add table public.managed_trips;
