-- Clearline — Journey 2 schema + RLS (P2.2, ERD §3). Managed-service tables.
-- Server-only writes for eligibility.partnered, corridors.committed_count, partner_domains.
-- No money in the pilot: bookings.billing_on defaults false and clients can never set it true.

-- ---------------------------------------------------------------------------
-- partner_domains — offline-maintained partnered list. SERVER-ONLY (read by the
-- eligibility Edge Function via service_role). RLS enabled, no client policies.
-- ---------------------------------------------------------------------------
create table if not exists public.partner_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  employer_name text not null,
  corridor_id uuid,
  created_at timestamptz not null default now()
);
alter table public.partner_domains enable row level security;
-- intentionally NO policies: clients cannot read the partnered list (avoids enumeration).

-- ---------------------------------------------------------------------------
-- corridors — reference (public read). committed_count + status server-written only.
-- ---------------------------------------------------------------------------
create table if not exists public.corridors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trunk_type text not null default 'ac_shuttle' check (trunk_type in ('ac_shuttle')),
  threshold integer not null default 250,
  committed_count integer not null default 0,
  status text not null default 'waitlisted' check (status in ('waitlisted','open')),
  demo boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.corridors enable row level security;
create policy corridors_public_read on public.corridors
  for select to anon, authenticated using (true);
-- no client writes → committed_count/status only move via service_role.

-- ---------------------------------------------------------------------------
-- eligibility — owner may READ own; NEVER client-writable (partnered is derived
-- server-side by /api/eligibility). Employee ID captured, not verified.
-- ---------------------------------------------------------------------------
create table if not exists public.eligibility (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  employee_id text,          -- captured, NOT verified
  company text,
  work_email text,
  domain text,
  partnered boolean not null default false,  -- server-derived only
  created_at timestamptz not null default now(),
  unique (user_id)
);
alter table public.eligibility enable row level security;
create index eligibility_user_id_idx on public.eligibility (user_id);
create policy eligibility_owner_read on public.eligibility
  for select to authenticated
  using ((select auth.uid()) = user_id);
-- no insert/update/delete policies → client cannot forge `partnered`; server writes it.

-- ---------------------------------------------------------------------------
-- commitments — owner-only. Drives committed_count (recomputed server-side).
-- ---------------------------------------------------------------------------
create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  corridor_id uuid not null references public.corridors(id) on delete cascade,
  committed_at timestamptz not null default now(),
  unique (user_id, corridor_id)
);
alter table public.commitments enable row level security;
create index commitments_user_id_idx on public.commitments (user_id);
create index commitments_corridor_id_idx on public.commitments (corridor_id);
create policy commitments_owner_all on public.commitments
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- managed_setups — owner-only (home/tower sensitive). Prefill from profile_fields.
-- ---------------------------------------------------------------------------
create table if not exists public.managed_setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  corridor_id uuid references public.corridors(id) on delete set null,
  home text,
  tower text,
  arrive_by timestamptz,
  return_after timestamptz,
  days text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.managed_setups enable row level security;
create index managed_setups_user_id_idx on public.managed_setups (user_id);
create policy managed_setups_owner_all on public.managed_setups
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- managed_plans — owned via the parent setup. Client read-only (planner writes server-side).
-- ---------------------------------------------------------------------------
create table if not exists public.managed_plans (
  id uuid primary key default gen_random_uuid(),
  setup_id uuid not null references public.managed_setups(id) on delete cascade,
  legs jsonb not null default '[]'::jsonb,   -- all contracted (.mgd)
  door_to_door_min integer,
  transfers integer,
  walk_m integer,
  per_day_fare integer,
  monthly_fare integer,
  committed_window text,
  created_at timestamptz not null default now()
);
alter table public.managed_plans enable row level security;
create index managed_plans_setup_id_idx on public.managed_plans (setup_id);
create policy managed_plans_owner_read on public.managed_plans
  for select to authenticated
  using (exists (
    select 1 from public.managed_setups s
    where s.id = managed_plans.setup_id and s.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- bookings — reserve only, no money. billing_on can never be set true by a client.
-- Owned via the parent setup.
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  setup_id uuid not null references public.managed_setups(id) on delete cascade,
  trip_type text check (trip_type in ('round','morning')),
  plan_type text check (plan_type in ('per_day','monthly')),
  price integer,
  billing_on boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
create index bookings_setup_id_idx on public.bookings (setup_id);
-- Owner may read + reserve (insert), but ONLY with billing_on = false (no money in pilot).
create policy bookings_owner_read on public.bookings
  for select to authenticated
  using (exists (
    select 1 from public.managed_setups s
    where s.id = bookings.setup_id and s.user_id = (select auth.uid())
  ));
create policy bookings_owner_reserve on public.bookings
  for insert to authenticated
  with check (
    billing_on = false
    and exists (
      select 1 from public.managed_setups s
      where s.id = bookings.setup_id and s.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- managed_trips — Realtime source (screen 22). Owned via booking→setup. Client read-only.
-- ---------------------------------------------------------------------------
create table if not exists public.managed_trips (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  date date,
  steps jsonb not null default '[]'::jsonb,   -- done|now|upcoming
  driver text,
  vehicle text,
  eta_min integer,
  share_link text,
  status text,
  created_at timestamptz not null default now()
);
alter table public.managed_trips enable row level security;
create index managed_trips_booking_id_idx on public.managed_trips (booking_id);
create policy managed_trips_owner_read on public.managed_trips
  for select to authenticated
  using (exists (
    select 1
    from public.bookings b
    join public.managed_setups s on s.id = b.setup_id
    where b.id = managed_trips.booking_id and s.user_id = (select auth.uid())
  ));
