"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Activity, Flame } from "lucide-react";
import { apiFetch } from "@/lib/device";

type Trends = {
  averageScore: number;
  mostCommonPattern: string;
  recoveryStreak: number;
  points: { date: string; status: "green" | "yellow" | "red"; score: number }[];
  commonTriggers: { pattern: string; count: number }[];
  summary: { greenDays: number; yellowDays: number; redDays: number; topPattern: string };
};

const BAR: Record<string, string> = {
  green: "bg-custod-status-green",
  yellow: "bg-amber-400",
  red: "bg-red-500",
};

export function TrendView() {
  const [data, setData] = useState<Trends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch("/api/trends")
      .then((r) => r.json())
      .then((d: Trends) => {
        if (active) setData(d);
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="grid place-items-center py-24"><span className="size-4 animate-pulse rounded-full bg-custod-status-green" /></div>;
  }

  const points = data?.points ?? [];
  const hasData = points.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Your trend</h1>
        <p className="mt-1 text-sm text-custod-muted">How your browser strain has moved over time.</p>
      </div>

      {!hasData ? (
        <div className="rounded-3xl border border-dashed border-[#e2e8f0] bg-white py-16 text-center">
          <p className="text-sm font-medium">No trend yet</p>
          <p className="mt-1 text-sm text-custod-muted">Run a few checks and your trend will build here.</p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Stat icon={Activity} label="Average score" value={String(data?.averageScore ?? 0)} hint="lower is calmer" />
            <Stat icon={Flame} label="Recovery streak" value={String(data?.recoveryStreak ?? 0)} hint="green checks in a row" />
            <Stat icon={TrendingUp} label="Most common" value={data?.summary.topPattern ?? "—"} hint="recurring pattern" small />
          </section>

          <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-lg font-semibold">Score over time</h2>
            <p className="mt-1 text-xs text-custod-muted">Each bar is a check — taller and redder means more strain.</p>
            <div className="mt-6 flex h-40 items-end gap-1.5">
              {points.slice(-40).map((p, i) => (
                <div
                  key={i}
                  className="group relative flex-1"
                  title={`${new Date(p.date).toLocaleDateString()} · ${p.score}`}
                >
                  <div
                    className={`w-full rounded-t ${BAR[p.status] ?? "bg-custod-primary"} transition-all`}
                    style={{ height: `${Math.max(4, Math.min(100, p.score))}%` }}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6">
              <h2 className="text-lg font-semibold">Status mix</h2>
              <div className="mt-4 space-y-3">
                <Meter label="Steady" color="bg-custod-status-green" value={data?.summary.greenDays ?? 0} total={points.length} />
                <Meter label="Worth a pause" color="bg-amber-400" value={data?.summary.yellowDays ?? 0} total={points.length} />
                <Meter label="Time for a reset" color="bg-red-500" value={data?.summary.redDays ?? 0} total={points.length} />
              </div>
            </div>
            <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6">
              <h2 className="text-lg font-semibold">Common triggers</h2>
              <ul className="mt-4 space-y-2.5">
                {(data?.commonTriggers ?? []).slice(0, 5).map((t) => (
                  <li key={t.pattern} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-3">{t.pattern}</span>
                    <span className="shrink-0 rounded-full bg-[#f6f8f7] px-2 py-0.5 text-xs font-semibold text-custod-muted">{t.count}×</span>
                  </li>
                ))}
                {(data?.commonTriggers ?? []).length === 0 ? (
                  <li className="text-sm text-custod-muted">No patterns yet.</li>
                ) : null}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, small }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint: string; small?: boolean }) {
  return (
    <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-custod-muted">
        <Icon className="size-4" /> {label}
      </div>
      <p className={`mt-3 font-bold ${small ? "text-lg" : "text-4xl"}`}>{value}</p>
      <p className="mt-1 text-xs text-custod-muted">{hint}</p>
    </div>
  );
}

function Meter({ label, color, value, total }: { label: string; color: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-custod-muted">{value} · {pct}%</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-[#f6f8f7]">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
