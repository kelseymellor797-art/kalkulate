-- KALKULATE shared public demo history.
-- Apply only to the approved KALKULATE project after reviewing the target.
-- RLS remains enabled; this adds DELETE only. UPDATE stays denied.
grant delete on table public.calculations to anon;

create policy calculations_anon_delete on public.calculations
  for delete to anon using (true);
