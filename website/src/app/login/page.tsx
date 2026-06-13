"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

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
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Authentication isn't configured yet. Add Supabase keys to enable login.");
      return;
    }
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
          <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <span className="size-3 rounded-full bg-custod-status-green" />
          </span>
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
