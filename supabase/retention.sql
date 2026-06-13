-- Custod retention cleanup.
-- Deletes expired share links and expired private payloads. Schedule this with
-- Supabase pg_cron (or call it from a scheduled Edge Function) — it is idempotent
-- and safe to run frequently.
--
-- One-time enable of pg_cron + schedule (run in the Supabase SQL editor):
--   create extension if not exists pg_cron;
--   select cron.schedule('custod-retention', '0 * * * *', $$ select custod_retention_cleanup(); $$);

create or replace function custod_retention_cleanup()
returns void
language plpgsql
security definer
as $$
begin
  -- Expired or revoked share links: stop resolving them.
  update share_links
     set revoked_at = now()
   where revoked_at is null
     and expires_at is not null
     and expires_at < now();

  -- Hard-delete private payloads past their expiry.
  delete from scan_private_payloads
   where expires_at is not null
     and expires_at < now();

  -- Enforce per-device retention windows: drop scans older than the device's
  -- retention_days setting (defaults to 30 when no row exists).
  delete from scans s
   using privacy_settings p
   where s.device_id = p.device_id
     and s.created_at < now() - make_interval(days => coalesce(p.retention_days, 30));
end;
$$;
