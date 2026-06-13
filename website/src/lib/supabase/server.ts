import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Session-aware Supabase client for server components, route handlers, and
// middleware. Reads/writes the auth cookie so the user's session survives
// across requests. Uses the public anon key (RLS-respecting); privileged
// writes still go through the service-role client in `lib/supabase.ts`.

// The publishable key is the new public-client key; the anon key is the legacy
// name. Accept either so a project configured with just one of them works.
function anonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

export function hasSupabaseAuthEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && anonKey());
}

/** Server client bound to the current request's cookies (App Router). */
export async function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = anonKey();
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `set` throws in Server Components (read-only cookies). The session
          // is refreshed in middleware instead, so this is safe to ignore.
        }
      },
    },
  });
}
