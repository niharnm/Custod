"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Browser-side Supabase client for auth. Uses the publishable/anon key, which is
 * safe in the browser as long as RLS is enforced. Returns null if env is missing
 * so pages can render a friendly "auth not configured" state instead of crashing.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export const isSupabaseConfigured = Boolean(url && key);
