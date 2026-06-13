"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { claimAnonymousHistory } from "@/lib/device";

type Mode = "signin" | "signup";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function afterSignedIn() {
    // Pull any pre-login anonymous history into the new account, then continue.
    await claimAnonymousHistory().catch(() => undefined);
    router.push(next);
    router.refresh();
  }

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const supabase = getSupabaseBrowser();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          // Email confirmation is enabled on the project.
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
        await afterSignedIn();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await afterSignedIn();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setError("");
    setBusy(true);
    try {
      const supabase = getSupabaseBrowser();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) throw error;
      // Redirect happens via the OAuth flow.
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start Google sign-in.");
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="mb-8 flex items-center justify-center gap-3">
        <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-white shadow-[0_0_24px_hsl(var(--primary)/0.5)]">
          <Image src="/logo.png" alt="Custod" width={40} height={40} className="h-8 w-auto" priority />
        </span>
        <span className="text-lg font-semibold tracking-tight">Custod</span>
      </Link>

      <div className="panel p-6">
        <h1 className="text-xl font-semibold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="caption mt-1">
          {mode === "signin"
            ? "Sign in to sync your burnout signals across the extension, web, and desktop."
            : "One account syncs everywhere — extension, web dashboard, and desktop."}
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={busy}
          className="button-secondary mt-6 w-full justify-center gap-2"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="h-px flex-1 bg-[hsl(var(--border))]" />
          or
          <span className="h-px flex-1 bg-[hsl(var(--border))]" />
        </div>

        <form onSubmit={submitEmail} className="space-y-3">
          <label className="block">
            <span className="caption">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input mt-1.5 w-full"
              placeholder="you@school.edu"
            />
          </label>
          <label className="block">
            <span className="caption">Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input mt-1.5 w-full"
              placeholder="••••••••"
            />
          </label>

          {error ? <p className="text-sm text-[hsl(var(--danger))]">{error}</p> : null}
          {notice ? <p className="text-sm text-[hsl(var(--ok))]">{notice}</p> : null}

          <button type="submit" disabled={busy} className="button-primary w-full justify-center">
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="caption mt-5 text-center">
          {mode === "signin" ? "New to Custod?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setNotice("");
            }}
            className="font-medium text-[hsl(var(--primary))] hover:underline"
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>

      <p className="caption mt-4 text-center">
        Prefer not to sign in?{" "}
        <Link href="/" className="font-medium text-[hsl(var(--foreground))] hover:underline">
          Continue without an account
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
