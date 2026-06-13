"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";
import { getSupabaseBrowser, hasSupabaseBrowserEnv } from "@/lib/supabase/browser";

/**
 * Header auth control. Self-fetches the current user via the browser Supabase
 * client and subscribes to auth changes, so it works inside both server and
 * client pages and updates live on sign-in / sign-out.
 */
export function AuthMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(() => !hasSupabaseBrowserEnv());
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!hasSupabaseBrowserEnv()) return;
    const supabase = getSupabaseBrowser();
    supabase.auth
      .getUser()
      .then((res: UserResponse) => setEmail(res.data.user?.email ?? null))
      .catch(() => setEmail(null))
      .finally(() => setReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setEmail(session?.user?.email ?? null);
      }
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  if (!email) {
    return (
      <Link href="/login" className="button-ghost text-xs gap-1.5">
        <LogIn className="h-3.5 w-3.5" />
        Sign in
      </Link>
    );
  }

  async function signOut() {
    setSigningOut(true);
    try {
      if (hasSupabaseBrowserEnv()) await getSupabaseBrowser().auth.signOut();
      await fetch("/auth/signout", { method: "POST" });
    } catch {
      // best-effort; refresh anyway
    }
    setEmail(null);
    router.refresh();
    setSigningOut(false);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="hidden items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] sm:inline-flex">
        <User className="h-3 w-3" />
        {email}
      </span>
      <button onClick={signOut} disabled={signingOut} className="button-ghost text-xs gap-1.5">
        <LogOut className="h-3.5 w-3.5" />
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
