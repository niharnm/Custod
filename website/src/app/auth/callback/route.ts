import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

// OAuth / PKCE callback: exchange the `code` for a session (cookies are set by
// the server client), then redirect to `next` (defaults to the dashboard).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (code) {
    try {
      const supabase = await getSupabaseServer();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
      }
    } catch {
      return NextResponse.redirect(new URL("/login?error=auth", url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
