-- Custod — Supabase schema (source of truth for the database).
-- Apply in the Supabase SQL editor or via migrations. Designed for privacy-first,
-- aggregate-by-default storage with opt-in encrypted raw payloads.
--
-- Conventions:
--   * UUID primary keys, timestamptz timestamps (default now()).
--   * RLS ON for every user/device-scoped table.
--   * Aggregate fields are safe to store; raw tab/URL/reflection data is opt-in only.
--   * MVP is device-scoped (anonymous). user_id is nullable until Supabase Auth lands;
--     RLS policies below assume auth.uid() once accounts exist. Until then, the service
--     role (server-side only) performs writes and scopes by device_id in app code.

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── profiles (optional; only once Supabase Auth is enabled) ─────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  display_name  text
);

-- ── devices ─────────────────────────────────────────────────────────────────--
create table if not exists devices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,   -- nullable in MVP
  platform      text not null check (platform in ('chrome','web','ios','macos')),
  label         text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  sync_enabled  boolean not null default false
);
create index if not exists idx_devices_user on devices(user_id);

-- ── scans (aggregate, always-safe fields) ──────────────────────────────────────
create table if not exists scans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,   -- nullable in MVP
  device_id     uuid references devices(id) on delete set null,
  created_at    timestamptz not null default now(),
  status        text not null check (status in ('green','yellow','red')),
  status_label  text not null check (status_label in ('Stable','Strained','At Risk')),
  score         int  not null check (score between 0 and 100),
  main_pattern  text not null,
  tab_count     int  not null default 0,
  domain_count  int  not null default 0,
  goal          text,                       -- short; treat as sensitive
  mood_check_in text check (mood_check_in in ('calm','stressed','overwhelmed','numb','skip')),
  time_remaining text,
  analysis      jsonb not null default '{}'::jsonb,
  tab_groups    jsonb not null default '[]'::jsonb
);
create index if not exists idx_scans_user_created   on scans(user_id, created_at desc);
create index if not exists idx_scans_device_created on scans(device_id, created_at desc);
create index if not exists idx_scans_status         on scans(status);

-- ── scan_events (gamification + audit: check-in, reset_complete, etc.) ──────────
create table if not exists scan_events (
  id          uuid primary key default gen_random_uuid(),
  scan_id     uuid references scans(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  device_id   uuid references devices(id) on delete set null,
  event_type  text not null check (event_type in ('scan_created','reflection_added','reset_complete','share_created')),
  metadata    jsonb not null default '{}'::jsonb,   -- counts/flags only, no raw content
  created_at  timestamptz not null default now()
);
create index if not exists idx_events_user_created on scan_events(user_id, created_at desc);
create index if not exists idx_events_scan on scan_events(scan_id);

-- ── risk_scores (per-category breakdown per scan) ───────────────────────────────
create table if not exists risk_scores (
  scan_id             uuid primary key references scans(id) on delete cascade,
  tab_overload        int not null default 0,
  context_switching   int not null default 0,
  distraction_pull    int not null default 0,
  goal_fragmentation  int not null default 0,
  time_pressure       int not null default 0,
  recovery_signal     int not null default 0
);

-- ── reset_plans (generated plan per scan) ───────────────────────────────────────
create table if not exists reset_plans (
  scan_id                 uuid primary key references scans(id) on delete cascade,
  immediate_action        text not null,
  three_minute_reset      text not null,
  twenty_minute_focus     text not null,
  close_or_save           jsonb not null default '[]'::jsonb,
  ignore_for_now          jsonb not null default '[]'::jsonb
);

-- ── scan_private_payloads (opt-in, encrypted raw evidence; expiring) ────────────
-- Stores raw tabs/titles/urls/reflection ONLY when privacy_settings.store_raw_tabs is true.
-- App encrypts before insert; DB never sees plaintext. Cleaned up by retention job.
create table if not exists scan_private_payloads (
  scan_id            uuid primary key references scans(id) on delete cascade,
  user_id            uuid references profiles(id) on delete cascade,
  encrypted_payload  text not null,
  encryption_version int not null default 1,
  expires_at         timestamptz
);
create index if not exists idx_private_expires on scan_private_payloads(expires_at);

-- ── reflections (sensitive free text; opt-in) ──────────────────────────────────
create table if not exists reflections (
  id          uuid primary key default gen_random_uuid(),
  scan_id     uuid references scans(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  metadata    jsonb not null default '{}'::jsonb,
  text        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_reflections_scan on reflections(scan_id);

-- ── streaks ─────────────────────────────────────────────────────────────────--
create table if not exists streaks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  device_id   uuid references devices(id) on delete cascade,
  type        text not null check (type in ('checkin','reset')),
  current     int not null default 0,
  longest     int not null default 0,
  last_day    date,
  unique nulls not distinct (user_id, device_id, type)
);

-- ── achievements ────────────────────────────────────────────────────────────--
create table if not exists achievements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  device_id     uuid references devices(id) on delete cascade,
  key           text not null,   -- 'first_checkin','reset_completed','pattern_spotted','focus_recovered','three_stable_days','weekly_reflection'
  unlocked_at   timestamptz not null default now(),
  unique nulls not distinct (user_id, device_id, key)
);

-- ── nudges (preferences) ───────────────────────────────────────────────────────
create table if not exists nudges (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade,
  device_id       uuid references devices(id) on delete cascade,
  enabled         boolean not null default false,
  quiet_hours     jsonb,    -- { "start": "22:00", "end": "08:00" }
  unique nulls not distinct (user_id, device_id)
);

-- ── share_links (expiring, revocable, privacy-safe) ─────────────────────────────
create table if not exists share_links (
  slug              text primary key,
  scan_id           uuid not null references scans(id) on delete cascade,
  user_id           uuid references profiles(id) on delete cascade,
  device_id         uuid references devices(id) on delete set null,
  created_at        timestamptz not null default now(),
  expires_at        timestamptz,
  revoked_at        timestamptz,
  include_raw_tabs  boolean not null default false
);
create index if not exists idx_shares_scan on share_links(scan_id);
create index if not exists idx_shares_expires on share_links(expires_at);

-- ── privacy_settings ────────────────────────────────────────────────────────--
create table if not exists privacy_settings (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references profiles(id) on delete cascade,
  device_id                   uuid references devices(id) on delete cascade,
  store_raw_tabs              boolean not null default false,
  retention_days              int not null default 30,
  sync_enabled                boolean not null default false,
  share_defaults_include_raw  boolean not null default false,
  unique nulls not distinct (user_id, device_id)
);

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════════
-- Enable RLS everywhere. Policies below assume Supabase Auth (auth.uid()).
-- In anonymous MVP, the SERVER uses the service-role key (which bypasses RLS) and
-- enforces device scoping in app code. The publishable/anon key must never be used
-- for direct client writes to these tables.

alter table devices                enable row level security;
alter table scans                  enable row level security;
alter table scan_events            enable row level security;
alter table risk_scores            enable row level security;
alter table reset_plans            enable row level security;
alter table scan_private_payloads  enable row level security;
alter table reflections            enable row level security;
alter table streaks                enable row level security;
alter table achievements           enable row level security;
alter table nudges                 enable row level security;
alter table share_links            enable row level security;
alter table privacy_settings       enable row level security;
alter table profiles               enable row level security;

-- Owner-only access for user-scoped tables (active once Auth is enabled).
create policy "own profiles"   on profiles  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own devices"    on devices   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own scans"      on scans     for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Child tables: ownership derived from parent scan.
create policy "own risk_scores" on risk_scores for all
  using (exists (select 1 from scans s where s.id = scan_id and s.user_id = auth.uid()));
create policy "own reset_plans" on reset_plans for all
  using (exists (select 1 from scans s where s.id = scan_id and s.user_id = auth.uid()));
create policy "own private_payloads" on scan_private_payloads for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own reflections" on reflections for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own scan_events" on scan_events for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own streaks" on streaks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own achievements" on achievements for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own nudges" on nudges for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own privacy_settings" on privacy_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Share links: owner manages; public READ is handled server-side (service role)
-- which checks expiry/revocation and include_raw_tabs. No anon RLS read policy is
-- granted here, so raw data can never leak via the anon key.
create policy "own share_links" on share_links for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Retention helper (run on a schedule, e.g. Supabase cron / edge function) ────
-- delete from scan_private_payloads where expires_at is not null and expires_at < now();
-- delete from share_links where expires_at is not null and expires_at < now();
