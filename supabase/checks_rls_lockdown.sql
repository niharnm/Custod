-- Lock down the legacy public.checks table used by pre-scans compatibility routes.
--
-- Context:
-- Supabase security advisors flagged unrestricted INSERT/UPDATE policies on
-- public.checks. Custod's anonymous MVP should write through trusted server API
-- routes only, using SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY. Browser
-- clients and extensions must not write directly to this table.
--
-- Run in the Supabase SQL editor for project vdzugcxkqzfauaywiria, then rerun
-- the Supabase security advisor.

alter table public.checks enable row level security;

drop policy if exists "public insert" on public.checks;
drop policy if exists "public update" on public.checks;
drop policy if exists "public select" on public.checks;
drop policy if exists "public delete" on public.checks;
drop policy if exists "service role only" on public.checks;

revoke all on table public.checks from anon;
revoke all on table public.checks from authenticated;

grant select, insert, update, delete on table public.checks to service_role;

create policy "service role only" on public.checks
  for all
  to service_role
  using (true)
  with check (true);
