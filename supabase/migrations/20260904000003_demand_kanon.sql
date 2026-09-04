-- Clearline — demand aggregation, k-anon N>=5 (P7.6, BUILD-SPEC §7·Demand).
--
-- `demand_signals` stays server-write-only and never client-readable (RLS enabled, no policies
-- in ...0001). The ONLY sanctioned way to read demand is this aggregate, which:
--   * groups by generalised od_pair (+ coarse mode / time_window),
--   * emits a group ONLY when it has 5 or more signals (the k-anon floor), and
--   * exposes counts only — no signal ids, no timestamps, no user linkage (the table has none).
--
-- It is SECURITY DEFINER on purpose: the definer bypasses the base-table RLS so the HAVING
-- floor can be computed, and the floor itself is the privacy control. Nothing below 5 can leave.
-- EXECUTE is granted to `authenticated` only and revoked from anon/public (avoids the
-- "definer executable by anon" advisor and keeps the aggregate off the public API).

create or replace function public.demand_aggregate()
returns table (
  od_pair text,
  signal_count integer,
  mode text,
  time_window text
)
language sql
security definer
set search_path = ''
stable
as $$
  select s.od_pair,
         count(*)::int as signal_count,
         s.mode,
         s.time_window
  from public.demand_signals s
  group by s.od_pair, s.mode, s.time_window
  having count(*) >= 5
$$;

revoke all on function public.demand_aggregate() from anon, public;
grant execute on function public.demand_aggregate() to authenticated;

comment on function public.demand_aggregate() is
  'k-anon N>=5 demand aggregate. Groups below 5 signals are never returned. authenticated-only.';
