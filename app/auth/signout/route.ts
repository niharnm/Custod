import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

// Clears the Supabase session cookie. Called by the header sign-out button.
export async function POST() {
  try {
    const supabase = await getSupabaseServer();
    await supabase.auth.signOut();
  } catch {
    // best-effort
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
