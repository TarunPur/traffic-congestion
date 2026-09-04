-- Clearline — seed data (P2.3). Idempotent (on conflict do nothing). The canonical sample only.
-- HONESTY: committed_count starts at 0 (real). The mockup's "168/250" is a design placeholder;
-- seeding fake commitments would be fabricated traction (ERD §0 non-negotiable), so we don't.
-- Real counts grow as real test users commit. (Flagged in PARKED.md for Tarun to confirm.)

-- Places: the locked sample OD + a few for the type-ahead to work.
insert into public.places (id, name, sub_label, type, lat, lng, source) values
  ('a0000000-0000-4000-8000-000000000001', 'Hauz Khas Enclave', 'Area · South Delhi', 'area', 28.5494, 77.2065, 'seed'),
  ('a0000000-0000-4000-8000-000000000002', 'DLF Cyber Hub, Building 10', 'Office hub · Gurgaon', 'office_hub', 28.4949, 77.0889, 'seed'),
  ('a0000000-0000-4000-8000-000000000003', 'Hauz Khas Metro', 'Yellow / Magenta', 'metro', 28.5433, 77.2066, 'seed'),
  ('a0000000-0000-4000-8000-000000000004', 'Sikanderpur Metro', 'Yellow / Rapid Metro', 'metro', 28.4817, 77.0947, 'seed'),
  ('a0000000-0000-4000-8000-000000000005', 'DLF Cyber City', 'Office district · Gurgaon', 'office_hub', 28.4941, 77.0870, 'seed'),
  ('a0000000-0000-4000-8000-000000000006', 'Green Park', 'Area · South Delhi', 'area', 28.5590, 77.2050, 'seed')
on conflict (id) do nothing;

-- The one demo corridor (Hauz Khas ↔ Cyber Hub), threshold 250, real count 0, waitlisted.
insert into public.corridors (id, name, trunk_type, threshold, committed_count, status, demo) values
  ('c0000000-0000-4000-8000-000000000001', 'Hauz Khas ↔ DLF Cyber Hub', 'ac_shuttle', 250, 0, 'waitlisted', true)
on conflict (id) do nothing;

-- Placeholder partner domain (clearly demo; the real list is maintained offline).
insert into public.partner_domains (id, domain, employer_name, corridor_id) values
  ('d0000000-0000-4000-8000-000000000001', 'demo-employer.example', 'Demo Employer Pvt Ltd', 'c0000000-0000-4000-8000-000000000001')
on conflict (domain) do nothing;
