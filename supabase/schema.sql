-- KALKULATE shared public demo history. Run ONLY in the approved project.
-- One-time, transactional setup: deliberately fails if calculations exists;
-- do not overwrite or silently reuse another application's table.
-- All visitors can read all rows and submit new calculations. No accounts.
begin;

create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  expression text not null check (char_length(btrim(expression)) between 1 and 256),
  result text not null check (char_length(btrim(result)) between 1 and 64),
  created_at timestamptz not null default now()
);
create index calculations_newest_idx on public.calculations (created_at desc, id desc);
alter table public.calculations enable row level security;

-- Remove Supabase default table grants before granting the minimum privileges.
revoke all on table public.calculations from public, anon, authenticated;
grant select on table public.calculations to anon;
-- Column-level INSERT prevents anonymous callers from supplying timestamps/IDs.
grant insert (expression, result) on public.calculations to anon;

create policy calculations_anon_select on public.calculations
  for select to anon using (true);
create policy calculations_anon_insert on public.calculations
  for insert to anon with check (true);

-- No UPDATE/DELETE grants or policies, no functions, and no auth dependencies.
commit;
