import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Json = boolean | number | string | null | { [key: string]: Json | undefined } | Json[];
type Table<Row extends Record<string, Json | undefined>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; created_at: string; display_name: string | null }>;
      devices: Table<{
        id: string;
        user_id: string | null;
        platform: "chrome" | "web" | "ios" | "macos";
        label: string | null;
        created_at: string;
        last_seen_at: string;
        sync_enabled: boolean;
      }>;
      scans: Table<{
        id: string;
        user_id: string | null;
        device_id: string | null;
        created_at: string;
        status: "green" | "yellow" | "red";
        status_label: "Stable" | "Strained" | "At Risk";
        score: number;
        main_pattern: string;
        tab_count: number;
        domain_count: number;
        goal: string | null;
        mood_check_in: "calm" | "stressed" | "overwhelmed" | "numb" | "skip" | null;
        time_remaining: string | null;
        analysis: Json;
        tab_groups: Json;
      }>;
      scan_events: Table<{
        id: string;
        scan_id: string | null;
        user_id: string | null;
        device_id: string | null;
        event_type: "scan_created" | "reflection_added" | "reset_complete" | "share_created";
        metadata: Json;
        created_at: string;
      }>;
      risk_scores: Table<{
        scan_id: string;
        tab_overload: number;
        context_switching: number;
        distraction_pull: number;
        goal_fragmentation: number;
        time_pressure: number;
        recovery_signal: number;
      }>;
      reset_plans: Table<{
        scan_id: string;
        immediate_action: string;
        three_minute_reset: string;
        twenty_minute_focus: string;
        close_or_save: Json;
        ignore_for_now: Json;
      }>;
      reflections: Table<{
        id: string;
        scan_id: string | null;
        user_id: string | null;
        text: string;
        metadata: Json;
        created_at: string;
      }>;
      share_links: Table<{
        slug: string;
        scan_id: string;
        user_id: string | null;
        device_id: string | null;
        created_at: string;
        expires_at: string | null;
        revoked_at: string | null;
        include_raw_tabs: boolean;
      }>;
      privacy_settings: Table<{
        id: string;
        user_id: string | null;
        device_id: string | null;
        store_raw_tabs: boolean;
        retention_days: number;
        sync_enabled: boolean;
        share_defaults_include_raw: boolean;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type SupabaseAdminClient = SupabaseClient<Database>;

let cachedClient: SupabaseAdminClient | null = null;

export function hasSupabaseAdminEnv(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function getSupabaseAdmin(): SupabaseAdminClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!key) {
    throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY for server-side Supabase access.");
  }

  cachedClient = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return cachedClient;
}

export function getSupabaseAdminIfConfigured(): SupabaseAdminClient | null {
  return hasSupabaseAdminEnv() ? getSupabaseAdmin() : null;
}
