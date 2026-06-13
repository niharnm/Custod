"use client";

import { createBrowserClient } from "@supabase/ssr";

// Session-aware Supabase client for client components / browser code.
// Uses the public anon key — safe to ship to the browser. Distinct from the
// service-role admin client in `lib/supabase.ts`, which is server-only.

let cached: ReturnType<typeof createBrowserClient> | null = null;

function anonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = anonKey();
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  cached ??= createBrowserClient(url, key);
  return cached;
}

export function hasSupabaseBrowserEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && anonKey());
}
