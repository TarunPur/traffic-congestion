-- Clearline — Journey 1 schema + RLS (P2.1, ERD §3).
-- Every user-owned table: RLS enabled, owner-only. Reference tables: public read, no client writes.
-- demand_signals: server-write-only, never client-readable (exposed later via a k-anon N>=5 view, P7.6).
-- Conventions: snake_case; id uuid pk default gen_random_uuid(); created_at timestamptz default now()
-- (ERD §3). RLS policies wrap auth.uid() in a subselect (perf, per Supabase best practices) and target
-- the `authenticated` role. Indexes on every RLS filter column.

-- ---------------------------------------------------------------------------
-- Reference: places (public read, no client writes)
-- ---------------------------------------------------------------------------
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sub_label text,
  type text not null check (type in ('area','metro','bus_stop','office_hub','landmark')),
  lat double precision not null,
  lng double precision not null,
  source text,
  created_at timestamptz not null default now()
);
alter table public.places enable row level security;

create policy places_public_read on public.places
  for select to anon, authenticated using (true);
-- no insert/update/delete policies → clients cannot write; only service_role (bypasses RLS) seeds it.

-- ---------------------------------------------------------------------------
-- trips (owner-only). origin/dest stored as place snapshots (jsonb) so arbitrary
-- GPS points + saved home work without a hard FK. Home is sensitive.
-- ---------------------------------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origin_place jsonb not null,
  dest_place jsonb not null,
  arrive_by timestamptz,
  created_at timestamptz not null default now()
);
alter table public.trips enable row level security;
create index trips_user_id_idx on public.trips (user_id);

create policy trips_owner_all on public.trips
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- plans (cached planner output; owned via the parent trip)
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null check (name in ('fastest','recommended','cheapest','greenest')),
  total_min integer not null,
  fare integer,
  time_vs_car_min integer,
  co2_vs_car numeric,
  legs jsonb not null default '[]'::jsonb,
  projected_arrival timestamptz,
  on_time boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.plans enable row level security;
create index plans_trip_id_idx on public.plans (trip_id);

-- Read plans only for trips you own. Writes go through the server (service_role) after planning.
create policy plans_owner_read on public.plans
  for select to authenticated
  using (exists (
    select 1 from public.trips t
    where t.id = plans.trip_id and t.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- saved_commutes (owner-only; home is sensitive)
-- ---------------------------------------------------------------------------
create table if not exists public.saved_commutes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origin_place jsonb not null,
  dest_place jsonb not null,
  preferred_mode text,
  arrive_by timestamptz,
  label text,
  created_at timestamptz not null default now()
);
alter table public.saved_commutes enable row level security;
create index saved_commutes_user_id_idx on public.saved_commutes (user_id);

create policy saved_commutes_owner_all on public.saved_commutes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- profile_fields (progressive profile; home/work sensitive; owner-only)
-- ---------------------------------------------------------------------------
create table if not exists public.profile_fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (key in ('home','work','arrival','return','preferred_mode')),
  value text,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);
alter table public.profile_fields enable row level security;
create index profile_fields_user_id_idx on public.profile_fields (user_id);

create policy profile_fields_owner_all on public.profile_fields
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- feedback (internal-only; a user may write + read only their own rows)
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
create index feedback_user_id_idx on public.feedback (user_id);

create policy feedback_owner_insert on public.feedback
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy feedback_owner_read on public.feedback
  for select to authenticated
  using ((select auth.uid()) = user_id);
-- no update/delete for clients; no cross-user read (internal-only).

-- ---------------------------------------------------------------------------
-- demand_prefs (owner-only; opt-out of anonymised demand contribution)
-- ---------------------------------------------------------------------------
create table if not exists public.demand_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  contribute_anonymised boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.demand_prefs enable row level security;

create policy demand_prefs_owner_all on public.demand_prefs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- demand_signals (aggregation source; SERVER-WRITE-ONLY, never client-readable).
-- RLS enabled with NO client policies → anon/authenticated get zero access.
-- Only service_role (bypasses RLS) writes it. Home is never stored identifiably.
-- The k-anon N>=5 aggregate VIEW is added in P7.6.
-- ---------------------------------------------------------------------------
create table if not exists public.demand_signals (
  id uuid primary key default gen_random_uuid(),
  od_pair text not null,
  mode text,
  time_window text,
  preferred_route text,
  created_at timestamptz not null default now()
);
alter table public.demand_signals enable row level security;
create index demand_signals_od_pair_idx on public.demand_signals (od_pair);
-- intentionally NO policies: clients cannot select/insert/update/delete.
