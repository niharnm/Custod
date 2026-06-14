"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { claimAnonymousHistory } from "@/lib/device";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowser();
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: unknown | null } }) => {
        if (data.session) router.replace("/dashboard");
      });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!isSupabaseConfigured) {
      setError("Authentication isn't configured yet. Add Supabase keys to enable login.");
      return;
    }
    const supabase = getSupabaseBrowser();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your inbox to confirm your email, then log in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await claimAnonymousHistory().catch(() => undefined);
        router.replace("/dashboard");
        router.refresh();
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function googleSignIn() {
    setError("");
    if (!isSupabaseConfigured) {
      setError("Authentication isn't configured yet.");
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Google sign-in.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 custod-hero-gradient" />

      <Link
        href="/"
        className="absolute left-5 top-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 transition hover:text-white md:left-8"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center text-white">
          <Image
            src="/logo.png"
            alt=""
            width={56}
            height={56}
            className="mb-4 size-14 rounded-2xl bg-white"
            priority
          />
          <h1 className="font-heading text-3xl tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your Custod account"}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            {mode === "signin"
              ? "Log in to see your status history and trend."
              : "Free forever. Your checks stay private to you."}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-xl md:p-8"
        >
          {!isSupabaseConfigured && (
            <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Auth isn&apos;t configured in this environment yet. The form is ready — add
              Supabase keys to enable accounts.
            </p>
          )}

          <button
            type="button"
            onClick={googleSignIn}
            disabled={loading}
            className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-white px-5 py-3 text-sm font-medium text-[#0f172a] transition hover:bg-[#f8fafc] disabled:opacity-60"
          >
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
            </svg>
            Continue with Google
          </button>

          <div className="mb-5 flex items-center gap-3 text-xs text-custod-muted">
            <span className="h-px flex-1 bg-[#e2e8f0]" /> or <span className="h-px flex-1 bg-[#e2e8f0]" />
          </div>

          <label className="mb-4 block">
            <span className="text-sm font-medium text-[#0f172a]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm outline-none transition focus:border-custod-primary focus:bg-white"
              placeholder="you@school.edu"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#0f172a]">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm outline-none transition focus:border-custod-primary focus:bg-white"
              placeholder="At least 6 characters"
            />
          </label>

          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
          {message && <p className="mt-4 rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="custod-primary-button mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Log in" : "Create account"}
          </button>

          <p className="mt-5 text-center text-sm text-custod-muted">
            {mode === "signin" ? "New to Custod?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
                setMessage("");
              }}
              className="font-medium text-custod-primary hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Log in"}
            </button>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-custod-muted">
          Custod notices patterns. It is not medical advice or a diagnosis.
        </p>
      </div>
    </main>
  );
}
