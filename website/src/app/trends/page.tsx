"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Flame, LineChart, Loader2, Zap } from "lucide-react";
import type { Achievement, BurnoutStatus, Streak } from "@/lib/product/types";
import { apiFetch } from "@/lib/product/device";
import { cn } from "@/lib/product/utils";
import { Header } from "@/components/product/Header";

type TrendPoint = { date: string; status: BurnoutStatus; score: number };
type Trends = {
  averageScore: number;
  mostCommonPattern: string;
  points: TrendPoint[];
  commonTriggers: { pattern: string; count: number }[];
  summary: { greenDays: number; yellowDays: number; redDays: number; topPattern: string };
};
type Progress = {
  streaks: Streak[];
  achievements: Achievement[];
  weeklyConsistency: number;
  stabilityTrend: number;
};

function barColor(status: BurnoutStatus) {
  return status === "red" ? "bg-danger" : status === "yellow" ? "bg-warning" : "bg-ok";
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trends | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [t, p] = await Promise.all([
          apiFetch("/api/trends").then((r) => r.json()),
          apiFetch("/api/me/progress").then((r) => r.json()),
        ]);
        if (!active) return;
        setTrends(t);
        setProgress(p);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const hasData = trends && trends.points.length > 0;

  return (
    <main>
      <Header />
      <section className="shell py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your trend</h1>
          <p className="caption mt-1">Patterns over time, not a daily grade. Private to this browser.</p>
        </div>

        {!loaded ? (
          <div className="flex items-center gap-2 py-20 text-[hsl(var(--muted-foreground))]">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : !hasData ? (
          <div className="panel flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--surface-2))]">
              <Zap className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-sm font-medium">No trend yet</p>
            <p className="caption mt-1">Run a few checks over time and your pattern shows up here.</p>
            <Link href="/" className="button-primary mt-5 text-sm">Run a check</Link>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Average score", value: `${trends!.averageScore}/100` },
                { label: "Most common pattern", value: trends!.mostCommonPattern },
                { label: "Stable days this week", value: String(progress?.weeklyConsistency ?? 0) },
              ].map((s) => (
                <div key={s.label} className="panel p-5">
                  <p className="caption">{s.label}</p>
                  <p className="mt-1 text-lg font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Score over time */}
            <div className="panel p-6 space-y-4">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-[hsl(var(--primary))]" />
                <h2 className="text-base font-semibold tracking-tight">Status over time</h2>
              </div>
              <div className="flex h-36 items-end gap-1 border-b border-l border-[hsl(var(--border))] px-1">
                {trends!.points.slice(-40).map((p, i) => (
                  <div
                    key={i}
                    className={cn("min-w-[3px] flex-1 rounded-t-sm transition-all hover:brightness-125", barColor(p.status))}
                    style={{ height: `${Math.max(6, p.score)}%` }}
                    title={`${p.score}/100 · ${p.status}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ok" /> {trends!.summary.greenDays} green</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> {trends!.summary.yellowDays} yellow</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> {trends!.summary.redDays} red</span>
              </div>
            </div>

            {/* Streaks */}
            <div className="grid gap-3 sm:grid-cols-2">
              {(progress?.streaks ?? []).map((s) => (
                <div key={s.type} className="panel flex items-center gap-4 p-5">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[hsl(var(--primary)/0.1)]">
                    <Flame className="h-6 w-6 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.current}<span className="text-sm font-normal text-[hsl(var(--muted-foreground))]"> day{s.current === 1 ? "" : "s"}</span></p>
                    <p className="caption capitalize">{s.type === "checkin" ? "Check-in" : "Reset"} streak · best {s.longest}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="caption">Miss a day and a streak just pauses — it never scolds you or resets to zero with guilt.</p>

            {/* Achievements */}
            <div className="panel p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[hsl(var(--primary))]" />
                <h2 className="text-base font-semibold tracking-tight">Milestones</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(progress?.achievements ?? []).map((a) => {
                  const earned = Boolean(a.unlockedAt);
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "panel-inner flex items-center gap-3 p-4",
                        earned ? "border-[hsl(var(--primary)/0.3)]" : "opacity-55"
                      )}
                    >
                      <div className={cn("grid h-9 w-9 place-items-center rounded-lg", earned ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]" : "bg-[hsl(var(--surface-3))] text-[hsl(var(--muted-foreground))]")}>
                        <Award className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{a.name}</p>
                        <p className="caption">{earned ? "Unlocked" : "Locked"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
