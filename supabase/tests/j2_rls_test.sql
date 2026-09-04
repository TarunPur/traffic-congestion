-- Clearline — Journey 2 RLS tests (P2.2, ERD §8). Run with `supabase test db` (pgTAP).
-- Proves: owner isolation; eligibility.partnered not client-forgeable; corridors read-only;
-- partner_domains not client-readable; bookings can never be created with billing_on = true.

begin;
select plan(10);

create schema if not exists tests;

insert into auth.users (id, email) values
  ('31111111-1111-1111-1111-111111111111', 'j2u1@test.dev'),
  ('32222222-2222-2222-2222-222222222222', 'j2u2@test.dev');

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

-- corridor from seed.sql
-- c0000000-0000-4000-8000-000000000001

-- u1 builds a managed setup + reserves a booking (no money)
select tests.as_user('31111111-1111-1111-1111-111111111111');

insert into public.managed_setups (id, user_id, corridor_id, home, tower, days)
  values ('50000000-0000-4000-8000-000000000001', '31111111-1111-1111-1111-111111111111',
          'c0000000-0000-4000-8000-000000000001', 'secret-home', 'Tower A', '{Mon,Tue}');

-- reserve with billing OFF succeeds
select lives_ok(
  $$ insert into public.bookings (setup_id, trip_type, plan_type, price, billing_on)
     values ('50000000-0000-4000-8000-000000000001','round','monthly',0,false) $$,
  'owner can reserve a booking with billing_on = false');

-- reserving with billing ON is blocked (no money in the pilot)
select throws_ok(
  $$ insert into public.bookings (setup_id, trip_type, plan_type, price, billing_on)
     values ('50000000-0000-4000-8000-000000000001','round','monthly',999,true) $$,
  '42501', null,
  'a client can NEVER create a booking with billing_on = true');

-- client cannot write eligibility at all (partnered is server-derived) → forging blocked
select throws_ok(
  $$ insert into public.eligibility (user_id, work_email, partnered)
     values ('31111111-1111-1111-1111-111111111111','me@corp.com',true) $$,
  '42501', null,
  'a client cannot insert eligibility (cannot forge partnered)');

-- client cannot write corridors (committed_count server-only): the UPDATE matches 0 rows
-- under RLS (no update policy) rather than erroring, so committed_count must stay unchanged.
update public.corridors set committed_count = 999 where demo = true;
select is(
  (select committed_count from public.corridors where demo = true),
  0,
  'a client cannot bump committed_count (RLS no-op)');

-- u1 commits to the corridor (owner-only)
insert into public.commitments (user_id, corridor_id)
  values ('31111111-1111-1111-1111-111111111111','c0000000-0000-4000-8000-000000000001');
select is((select count(*) from public.commitments)::int, 1, 'u1 sees own commitment');

-- corridors are publicly readable
select ok((select count(*) from public.corridors) > 0, 'corridors are readable');

-- partner_domains is NOT client-readable (no enumeration)
select is((select count(*) from public.partner_domains)::int, 0, 'client cannot read partner_domains');

-- u2 sees NONE of u1's J2 rows
select tests.as_user('32222222-2222-2222-2222-222222222222');
select is((select count(*) from public.managed_setups)::int, 0, 'u2 cannot read u1 managed setup (home hidden)');
select is((select count(*) from public.bookings)::int, 0, 'u2 cannot read u1 bookings');
select is((select count(*) from public.commitments)::int, 0, 'u2 cannot read u1 commitments');

select * from finish();
rollback;
