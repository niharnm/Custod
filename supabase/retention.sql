-- Custod retention cleanup.
--
-- Run on a schedule from Supabase cron or another trusted server-side job.
-- These tables are intentionally written only by the backend service role.

delete from public.scan_private_payloads
where expires_at is not null
  and expires_at < now();

delete from public.share_links
where expires_at is not null
  and expires_at < now();
