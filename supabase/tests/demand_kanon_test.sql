-- Clearline — demand k-anon tests (P7.6, BUILD-SPEC §7·Demand). Run with `supabase test db`.
-- Proves: demand_aggregate() hides any od_pair group with fewer than 5 signals, returns groups
-- with 5+, stays authenticated-only (anon cannot execute), and the raw table stays unreadable.

begin;
select plan(6);

create schema if not exists tests;

insert into auth.users (id, email) values
  ('33333333-3333-3333-3333-333333333333', 'd1@test.dev');

create or replace function tests.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid::text, 'role','authenticated')::text, true);
end $$;
create or replace function tests.as_anon() returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
end $$;
grant usage on schema tests to anon, authenticated, service_role;
grant execute on all functions in schema tests to anon, authenticated, service_role;

-- Seed as the setup role (RLS bypassed): 5 signals for the "above floor" pair, 3 for "below floor".
insert into public.demand_signals (od_pair, mode, time_window)
select 'Hauz Khas Enclave → DLF Cyber City', 'Metro', 'morning peak (7–10)'
from generate_series(1, 5);
insert into public.demand_signals (od_pair, mode, time_window)
select 'Saket → Aerocity', 'Bus', 'morning peak (7–10)'
from generate_series(1, 3);

select tests.as_user('33333333-3333-3333-3333-333333333333');

-- the 5-signal group is visible with the right count
select is(
  (select signal_count from public.demand_aggregate() where od_pair = 'Hauz Khas Enclave → DLF Cyber City'),
  5,
  'demand_aggregate returns a group with 5 signals'
);

-- the 3-signal group is NEVER returned (k-anon floor)
select is(
  (select count(*)::int from public.demand_aggregate() where od_pair = 'Saket → Aerocity'),
  0,
  'demand_aggregate hides a group below the k-anon floor of 5'
);

-- every returned group is at or above the floor
select ok(
  (select bool_and(signal_count >= 5) from public.demand_aggregate()),
  'every demand_aggregate group has signal_count >= 5'
);

-- authenticated still cannot read the raw signals
select is(
  (select count(*)::int from public.demand_signals),
  0,
  'authenticated cannot read raw demand_signals'
);

-- anon cannot execute the aggregate function
select tests.as_anon();
select throws_ok(
  $$ select * from public.demand_aggregate() $$,
  '42501',
  null,
  'anon cannot execute demand_aggregate()'
);
select is(
  (select count(*)::int from public.demand_signals),
  0,
  'anon cannot read raw demand_signals'
);

select * from finish();
rollback;
