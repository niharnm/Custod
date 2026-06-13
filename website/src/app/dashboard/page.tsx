"use client";

import {
  Flame,
  Gauge,
  LayoutDashboard,
  LogOut,
  Puzzle,
  Settings,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { apiFetch } from "@/lib/device";
import type { Scan } from "@/lib/types";
import { LINKS } from "@/lib/custod-links";

const STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  green: { dot: "bg-custod-status-green", label: "Stable" },
  yellow: { dot: "bg-amber-400", label: "Strained" },
  red: { dot: "bg-red-500", label: "At Risk" },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const SIGNALS = [
  { label: "Tab overload", hint: "How many open loops you're carrying" },
  { label: "Context switching", hint: "How many modes you're juggling" },
  { label: "Distraction pull", hint: "Entertainment mixed with work" },
  { label: "Goal fragmentation", hint: "Competing tasks open at once" },
  { label: "Time pressure", hint: "Deadlines and urgency" },
  { label: "Recovery signal", hint: "Signs you're already resetting" },
];

const NAV = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Trend", icon: TrendingUp, active: false },
  { label: "Privacy", icon: ShieldCheck, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [streak, setStreak] = useState(0);
  // When auth isn't configured, show the preview shell immediately.
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowser();
    let active = true;
    supabase.auth.getSession().then(async ({ data }: { data: { session: { user: { email?: string } } | null } }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      if (!active) return;
      setEmail(data.session.user.email ?? null);
      setReady(true);
      // Load this account's real history (cookie session scopes it to the user).
      try {
        const [scansRes, progRes] = await Promise.all([
          apiFetch("/api/scans?limit=8"),
          apiFetch("/api/me/progress"),
        ]);
        const scansJson = await scansRes.json().catch(() => ({ scans: [] }));
        const progJson = await progRes.json().catch(() => ({}));
        if (!active) return;
        if (Array.isArray(scansJson.scans)) setScans(scansJson.scans as Scan[]);
        const checkinStreak = progJson?.streaks?.find?.((s: { type?: string; current?: number }) => s.type === "checkin");
        if (checkinStreak?.current) setStreak(Number(checkinStreak.current));
      } catch {
        // history is best-effort; the shell still renders
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  const latest = scans[0];
  const latestStyle = latest ? STATUS_STYLE[latest.status] : null;

  async function signOut() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    router.replace("/");
  }

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center">
        <span className="size-4 animate-pulse rounded-full bg-custod-status-green" />
      </main>
    );
  }

  const firstName = email ? email.split("@")[0] : "there";

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#0f172a]">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#e2e8f0] bg-white px-4 py-6 md:flex">
          <Link href="/" className="mb-8 px-2 font-heading text-2xl font-semibold tracking-tight">
            Custod
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map(({ label, icon: Icon, active }) => (
              <button
                key={label}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-custod-primary/10 text-custod-primary"
                    : "text-custod-muted hover:bg-[#f6f8f7]"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </nav>

          <button
            onClick={signOut}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-custod-muted transition hover:bg-[#f6f8f7]"
          >
            <LogOut className="size-4" />
            {isSupabaseConfigured ? "Sign out" : "Back to site"}
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 px-5 py-8 md:px-10">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl tracking-tight">Hi, {firstName}</h1>
              <p className="mt-1 text-sm text-custod-muted">
                Here&apos;s your strain at a glance.
              </p>
            </div>
            <Link
              href={LINKS.chromeExtension}
              className="custod-primary-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
            >
              <Puzzle className="size-4" />
              Run a new check
            </Link>
          </header>

          {/* Top cards */}
          <section className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-custod-muted">
                <Gauge className="size-4" /> Current status
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className={`grid size-16 place-items-center rounded-2xl text-2xl font-bold text-white ${latestStyle ? latestStyle.dot : "bg-[#e2e8f0]"}`}>
                  {latest ? latest.score : "—"}
                </span>
                <div>
                  <p className="text-lg font-semibold">{latest ? (latest.statusLabel ?? latestStyle?.label) : "No check yet"}</p>
                  <p className="text-sm text-custod-muted">
                    {latest ? latest.mainPattern : "Run your first check to see a status."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-custod-muted">
                <Flame className="size-4" /> Check-in streak
              </div>
              <p className="mt-4 text-4xl font-bold">{streak}</p>
              <p className="mt-1 text-sm text-custod-muted">
                {streak > 0 ? "days in a row — keep it up" : "days in a row — start today"}
              </p>
            </div>

            <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-custod-muted">
                <ShieldCheck className="size-4" /> Privacy
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#475569]">
                Custod only reads tab titles and URLs. Page contents, cookies, and history
                are never collected.
              </p>
            </div>
          </section>

          {/* Signals */}
          <section className="mt-6 rounded-3xl border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-lg font-semibold">The six signals Custod tracks</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SIGNALS.map((s) => (
                <div key={s.label} className="rounded-2xl bg-[#f6f8f7] p-4">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="mt-1 text-xs text-custod-muted">{s.hint}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-[#e2e8f0]">
                    <div className="h-1.5 w-0 rounded-full bg-custod-primary" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent checks */}
          <section className="mt-6 rounded-3xl border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-lg font-semibold">Recent checks</h2>
            {scans.length > 0 ? (
              <ul className="mt-5 divide-y divide-[#e2e8f0]">
                {scans.map((scan) => {
                  const style = STATUS_STYLE[scan.status];
                  return (
                    <li key={scan.id} className="flex items-center gap-4 py-3">
                      <span className={`size-3 shrink-0 rounded-full ${style?.dot ?? "bg-[#e2e8f0]"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{scan.mainPattern || "Browser check"}</p>
                        <p className="text-xs text-custod-muted">{formatWhen(scan.createdAt)}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">{scan.score}</span>
                      <span className="shrink-0 text-xs font-medium text-custod-muted">
                        {scan.statusLabel ?? style?.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e2e8f0] py-12 text-center">
                <span className="mb-3 grid size-10 place-items-center rounded-full bg-[#f6f8f7]">
                  <Puzzle className="size-5 text-custod-muted" />
                </span>
                <p className="text-sm font-medium">No checks yet</p>
                <p className="mt-1 max-w-sm text-sm text-custod-muted">
                  Add the Chrome extension and run a check during a messy work session. Your
                  history and trend will build here.
                </p>
                <Link
                  href={LINKS.chromeExtension}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-custod-primary hover:underline"
                >
                  <Puzzle className="size-4" /> Add to Chrome
                </Link>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
