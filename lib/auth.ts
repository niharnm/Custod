import "server-only";

import { getSupabaseServer, hasSupabaseAuthEnv } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email?: string;
};

/**
 * Returns the signed-in user from the request's session cookie, or null when
 * anonymous (or when auth env isn't configured). Safe to call from server
 * components and route handlers.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!hasSupabaseAuthEnv()) return null;
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? undefined };
  } catch {
    return null;
  }
}
