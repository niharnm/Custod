import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth";

// Lightweight client used only to verify a Bearer JWT via the Auth server.
// `auth.getUser(token)` works with the public anon key — no service-role key
// required — so the extension/macOS bearer path works even before the
// service-role key is configured for the database.
let verifier: ReturnType<typeof createClient> | null = null;

function getTokenVerifier() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  verifier ??= createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return verifier;
}

/**
 * The identity that owns a row. When signed in (web cookie OR extension/macOS
 * bearer token) we scope by `userId`; otherwise we fall back to the anonymous
 * `deviceId`. Exactly one is normally set, but both can be present when a
 * signed-in client also reports its device (kept for provenance).
 */
export type Owner = { userId?: string; deviceId?: string };

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") || request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

/**
 * Resolve who is making this request, in priority order:
 *  1. `Authorization: Bearer <token>` → verify with Supabase admin (extension/macOS).
 *  2. Supabase session cookie → signed-in web user.
 *  3. `X-Custod-Device` header → anonymous device fallback.
 */
export async function resolveOwner(request: Request): Promise<Owner> {
  let deviceId = request.headers.get("X-Custod-Device") || undefined;
  if (!deviceId) {
    // Some GET routes pass the anonymous id as a query param instead of a header.
    try {
      deviceId = new URL(request.url).searchParams.get("deviceId") || undefined;
    } catch {
      // non-absolute URL; ignore
    }
  }

  // 1. Bearer token (cross-origin clients that can't send cookies).
  const token = bearerToken(request);
  if (token) {
    const client = getTokenVerifier();
    if (client) {
      try {
        const { data, error } = await client.auth.getUser(token);
        if (!error && data.user) return { userId: data.user.id, deviceId };
      } catch {
        // fall through to other strategies
      }
    }
  }

  // 2. Web session cookie.
  const user = await getCurrentUser();
  if (user) return { userId: user.id, deviceId };

  // 3. Anonymous device.
  return { deviceId };
}
