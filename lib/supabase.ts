import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Json = boolean | number | string | null | { [key: string]: Json | undefined } | Json[];

type Database = {
  public: {
    Tables: {
      checks: {
        Row: {
          id: string;
          created_at: string;
          raw_tabs: Json;
          mood: Json;
          analysis: Json;
          share_slug: string | null;
        };
        Insert: {
          id: string;
          created_at: string;
          raw_tabs: Json;
          mood?: Json;
          analysis: Json;
          share_slug?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          raw_tabs?: Json;
          mood?: Json;
          analysis?: Json;
          share_slug?: string | null;
        };
        Relationships: [];
      };
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
