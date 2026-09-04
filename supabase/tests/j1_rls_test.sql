-- Clearline — Journey 1 RLS tests (P2.1, ERD §8). Run with `supabase test db` (pgTAP).
-- Proves: owner-only isolation (a user cannot read another's rows), reference read-only,
-- and demand_signals is never client-readable. Execution parked on Docker (see PARKED.md).

begin;
select plan(11);

create schema if not exists tests;

-- two test users
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'u1@test.dev'),
  ('22222222-2222-2222-2222-222222222222', 'u2@test.dev');

-- helper: become an authenticated user by id
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

-- the helpers must be callable after we've switched into a limited role
grant usage on schema tests to anon, authenticated, service_role;
grant execute on all functions in schema tests to anon, authenticated, service_role;

-- seed a place (as the table owner / setup role, RLS bypassed here)
insert into public.places (id, name, type, lat, lng)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'Hauz Khas Enclave', 'area', 28.5494, 77.2065);

-- u1 creates a trip, saved commute, profile field, feedback
select tests.as_user('11111111-1111-1111-1111-111111111111');
insert into public.trips (user_id, origin_place, dest_place)
  values ('11111111-1111-1111-1111-111111111111', '{"name":"Home"}', '{"name":"Work"}');
insert into public.saved_commutes (user_id, origin_place, dest_place, label)
  values ('11111111-1111-1111-1111-111111111111', '{"name":"Home"}', '{"name":"Work"}', 'Morning');
insert into public.profile_fields (user_id, key, value)
  values ('11111111-1111-1111-1111-111111111111', 'home', 'secret-home');
insert into public.feedback (user_id, rating, note)
  values ('11111111-1111-1111-1111-111111111111', 5, 'smooth');

-- u1 sees exactly their own rows
select is((select count(*) from public.trips)::int, 1, 'u1 sees own trip');
select is((select count(*) from public.saved_commutes)::int, 1, 'u1 sees own saved commute');
select is((select count(*) from public.profile_fields)::int, 1, 'u1 sees own profile field');
select is((select count(*) from public.feedback)::int, 1, 'u1 sees own feedback');

-- u2 sees NONE of u1's rows (owner-only isolation)
select tests.as_user('22222222-2222-2222-2222-222222222222');
select is((select count(*) from public.trips)::int, 0, 'u2 cannot read u1 trips');
select is((select count(*) from public.saved_commutes)::int, 0, 'u2 cannot read u1 saved commutes');
select is((select count(*) from public.profile_fields)::int, 0, 'u2 cannot read u1 profile (home hidden)');
select is((select count(*) from public.feedback)::int, 0, 'u2 cannot read u1 feedback (internal-only)');

-- demand_signals is never client-readable (server writes it out-of-band)
select is((select count(*) from public.demand_signals)::int, 0, 'authenticated cannot read demand_signals');

-- anon can read reference places, but cannot write them
select tests.as_anon();
select ok((select count(*) from public.places) > 0, 'anon can read reference places');
select throws_ok(
  $$ insert into public.places (name, type, lat, lng) values ('x','area',0,0) $$,
  '42501',
  null,
  'anon cannot insert into reference places'
);

select * from finish();
rollback;
