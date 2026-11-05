import "server-only";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
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

const DEVICE_ID_RE = /^[A-Za-z0-9_-]{8,120}$/;

/**
 * The anonymous device id the client reports. Header only: ids in URLs leak
 * through logs, referrers and history, so the `?deviceId=` query form is not
 * accepted. Malformed values are ignored.
 */
export function deviceIdFromRequest(request: Request): string | undefined {
  const raw = request.headers.get("X-Custod-Device")?.trim();
  return raw && DEVICE_ID_RE.test(raw) ? raw : undefined;
}

/**
 * Resolve who is making this request, in priority order:
 *  1. `Authorization: Bearer <token>` → verify with Supabase admin (extension/macOS).
 *  2. Supabase session cookie → signed-in web user.
 *  3. `X-Custod-Device` header → anonymous device fallback.
 * The result can be empty (no user, no device); owner-scoped routes must use
 * `requireOwner` so an empty owner is rejected instead of matching every row.
 */
export async function resolveOwner(request: Request): Promise<Owner> {
  const deviceId = deviceIdFromRequest(request);

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

/** Resolve the owner, or null when the request has neither a user nor a device id. */
export async function requireOwner(request: Request): Promise<Owner | null> {
  const owner = await resolveOwner(request);
  return owner.userId || owner.deviceId ? owner : null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Sign in or send a device id to use this endpoint." }, { status: 401 });
}
