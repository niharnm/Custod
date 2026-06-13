"use client";

// Cookie-based SSR browser client (so the server can read the session for
// owner-scoped API calls). Re-exported here because existing pages import
// `getSupabaseBrowser` / `isSupabaseConfigured` from "@/lib/supabase".
export { getSupabaseBrowser, hasSupabaseBrowserEnv } from "./supabase/browser";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
);
