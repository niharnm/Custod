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
import { CustodButton, CustodCard, StatusDot, StatusLamp } from "@/components/custod/ui";
import { StatusBadge } from "@/components/product/StatusBadge";
import { LINKS } from "@/lib/custod-links";
import { apiFetch } from "@/lib/product/device";
import type { BurnoutStatus, Scan, Streak } from "@/lib/product/types";
import { formatDate } from "@/lib/product/utils";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import type { StatusLevel } from "@/types/custod";

const SIGNALS = [
  { label: "Tab overload", hint: "How many open loops you're carrying" },
  { label: "Context switching", hint: "How many modes you're juggling" },
  { label: "Distraction pull", hint: "Entertainment mixed with work" },
  { label: "Goal fragmentation", hint: "Competing tasks open at once" },
  { label: "Time pressure", hint: "Deadlines and urgency" },
  { label: "Recovery signal", hint: "Signs you're already resetting" },
];

const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, active: true },
  { label: "Trend", href: "/trends", icon: TrendingUp, active: false },
  { label: "Privacy", href: "/settings", icon: ShieldCheck, active: false },
  { label: "Settings", href: "/settings", icon: Settings, active: false },
];

function toStatusLevel(status: BurnoutStatus): StatusLevel {
  return status;
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [scans, setScans] = useState<Scan[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setEmail(data.session.user.email ?? null);
      setReady(true);
    });
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    (async () => {
      try {
        const [scansRes, progressRes] = await Promise.all([
          apiFetch("/api/scans?limit=5"),
          apiFetch("/api/me/progress"),
        ]);
        const scansData = await scansRes.json();
        const progressData = await progressRes.json();
        if (!active) return;
        if (scansRes.ok) setScans(scansData.scans ?? []);
        if (progressRes.ok) setStreak(progressData.streak ?? null);
      } catch {
        /* dashboard still renders empty state */
      }
    })();
    return () => {
      active = false;
    };
  }, [ready]);

  async function signOut() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    router.replace("/");
  }

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <StatusLamp status="green" size="sm" />
      </main>
    );
  }

  const firstName = email ? email.split("@")[0] : "there";
  const latest = scans[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-6 md:flex">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2.5 px-2 font-heading text-2xl font-semibold tracking-tight"
          >
            <StatusDot status="green" />
            Custod
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map(({ label, href, icon: Icon, active }) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <button
            onClick={signOut}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
          >
            <LogOut className="size-4" />
            {isSupabaseConfigured ? "Sign out" : "Back to site"}
          </button>
        </aside>

        <main className="flex-1 px-5 py-8 md:px-10">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl tracking-tight">Hi, {firstName}</h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="custod-accent-bar" />
                <p className="text-sm text-muted-foreground">
                  Here&apos;s your strain at a glance.
                </p>
              </div>
            </div>
            <CustodButton href={LINKS.check} size="md">
              <Puzzle className="size-4" />
              Run a new check
            </CustodButton>
          </header>

          <section className="mt-8 grid gap-4 lg:grid-cols-3">
            <CustodCard className="p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Gauge className="size-4" /> Current status
              </div>
              <div className="mt-4 flex items-center gap-4">
                {latest ? (
                  <>
                    <StatusLamp status={toStatusLevel(latest.status)} size="md" />
                    <div>
                      <p className="text-lg font-semibold">{latest.score}/100</p>
                      <StatusBadge status={latest.status} />
                      <p className="mt-1 text-sm text-muted-foreground">{latest.mainPattern}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <StatusLamp status="green" size="md" />
                    <div>
                      <p className="text-lg font-semibold">No check yet</p>
                      <p className="text-sm text-muted-foreground">
                        Run your first check to see a status.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CustodCard>

            <CustodCard className="p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Flame className="size-4" /> Check-in streak
              </div>
              <p className="custod-stat-value mt-4">{streak?.current ?? 0}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {streak?.current
                  ? `days in a row — keep it up`
                  : "days in a row — start today"}
              </p>
            </CustodCard>

            <CustodCard className="p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="size-4" /> Privacy
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Custod only reads tab titles and URLs. Page contents, cookies, and history
                are never collected.
              </p>
            </CustodCard>
          </section>

          <CustodCard className="mt-6 p-6">
            <h2 className="text-lg font-semibold">The six signals Custod tracks</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SIGNALS.map((s) => (
                <div key={s.label} className="rounded-2xl bg-secondary p-4">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-border">
                    <div className="h-1.5 w-0 rounded-full bg-primary" />
                  </div>
                </div>
              ))}
            </div>
          </CustodCard>

          <CustodCard className="mt-6 p-6">
            <h2 className="text-lg font-semibold">Recent checks</h2>
            {scans.length === 0 ? (
              <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/50 py-12 text-center">
                <span className="mb-3 grid size-10 place-items-center rounded-full bg-card">
                  <Puzzle className="size-5 text-muted-foreground" />
                </span>
                <p className="text-sm font-medium">No checks yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Add the Chrome extension and run a check during a messy work session.
                </p>
                <CustodButton href={LINKS.check} variant="ghost" className="mt-4">
                  <Puzzle className="size-4" /> Run a check
                </CustodButton>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {scans.map((scan) => (
                  <Link
                    key={scan.id}
                    href={`/scan/${scan.id}`}
                    className="panel-inner flex flex-col gap-2 p-4 transition hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={scan.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(scan.createdAt)}
                      </span>
                    </div>
                    <p className="font-semibold">{scan.score}/100</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {scan.mainPattern}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CustodCard>
        </main>
      </div>
    </div>
  );
}
