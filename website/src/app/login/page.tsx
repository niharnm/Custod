"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CustodButton,
  CustodCard,
  CustodInput,
  StatusDot,
} from "@/components/custod/ui";
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
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage("Check your inbox to confirm your email, then log in.");
        setMode("signin");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
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
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-5 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 custod-hero-gradient" />

      <Link
        href="/"
        className="absolute left-5 top-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground md:left-8"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex items-center gap-2.5 font-heading text-2xl text-foreground">
            <StatusDot status="green" />
            Custod
          </span>
          <h1 className="font-heading text-3xl tracking-tight text-foreground">
            {mode === "signin" ? "Welcome back" : "Create your Custod account"}
          </h1>
          <div className="mt-3 flex justify-center">
            <span className="custod-accent-bar" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Log in to see your status history and trend."
              : "Free forever. Your checks stay private to you."}
          </p>
        </div>

        <CustodCard className="p-6 md:p-8">
          <form onSubmit={submit} className="grid gap-4">
            {!isSupabaseConfigured && (
              <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
                Auth isn&apos;t configured in this environment yet. The form is ready — add
                Supabase keys to enable accounts.
              </p>
            )}

            <CustodInput
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
            />

            <CustodInput
              label="Password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />

            {error ? (
              <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-xl bg-primary/10 px-4 py-2.5 text-sm text-foreground">
                {message}
              </p>
            ) : null}

            <CustodButton type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "signin" ? "Log in" : "Create account"}
            </CustodButton>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? "New to Custod?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError("");
                  setMessage("");
                }}
                className="font-medium text-primary hover:underline"
              >
                {mode === "signin" ? "Create an account" : "Log in"}
              </button>
            </p>
          </form>
        </CustodCard>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Custod notices patterns. It is not medical advice or a diagnosis.
        </p>
      </div>
    </main>
  );
}
