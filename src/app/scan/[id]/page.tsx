"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import type { Scan } from "@/lib/types";
import { apiFetch } from "@/lib/device";

const STATUS = {
  green: { dot: "bg-custod-status-green", label: "Steady" },
  yellow: { dot: "bg-amber-400", label: "Worth a pause" },
  red: { dot: "bg-red-500", label: "Time for a reset" },
} as const;

const SIGNAL_LABELS: { key: keyof Scan["riskBreakdown"]; label: string }[] = [
  { key: "tabOverload", label: "Tab overload" },
  { key: "contextSwitching", label: "Context switching" },
  { key: "distractionPull", label: "Distraction pull" },
  { key: "goalFragmentation", label: "Goal fragmentation" },
  { key: "timePressure", label: "Time pressure" },
  { key: "recoverySignal", label: "Recovery signal" },
];

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scan, setScan] = useState<Scan | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let active = true;
    apiFetch(`/api/scans/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.scan) {
          setScan(d.scan);
          setState("ready");
        } else setState("missing");
      })
      .catch(() => active && setState("missing"));
    return () => {
      active = false;
    };
  }, [id]);

  if (state === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f8f7]">
        <Loader2 className="size-6 animate-spin text-custod-primary" />
      </main>
    );
  }

  if (state === "missing" || !scan) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f8f7] px-5 text-center">
        <div>
          <p className="text-sm font-medium">This check isn&apos;t available on your account.</p>
          <Link href="/dashboard" className="custod-primary-button mt-5 inline-flex rounded-xl px-5 py-2.5 text-sm font-medium text-white">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const s = STATUS[scan.status];
  const plan = scan.resetPlan;

  return (
    <main className="min-h-screen bg-[#f6f8f7] text-[#0f172a]">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-custod-muted transition hover:text-[#0f172a]">
          <ArrowLeft className="size-4" /> Dashboard
        </Link>

        {/* Status header */}
        <div className="mt-6 flex items-center gap-5 rounded-3xl border border-[#e2e8f0] bg-white p-6">
          <span className={`grid size-20 place-items-center rounded-2xl text-3xl font-bold text-white ${s.dot}`}>{scan.score}</span>
          <div>
            <p className="text-xl font-semibold">{scan.statusLabel ?? s.label}</p>
            <p className="mt-1 text-sm font-medium text-custod-muted">{scan.mainPattern}</p>
            {scan.oneSentenceExplanation ? <p className="mt-2 text-sm leading-relaxed text-[#475569]">{scan.oneSentenceExplanation}</p> : null}
          </div>
        </div>

        {/* Reset plan */}
        {plan ? (
          <section className="mt-6 rounded-3xl border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-lg font-semibold">Your reset plan</h2>
            <div className="mt-4 space-y-3">
              {[
                { t: "Right now", b: plan.immediateAction },
                { t: "3-minute reset", b: plan.threeMinuteReset },
                { t: "20-minute focus", b: plan.twentyMinuteFocusBlock },
              ].filter((x) => x.b).map((x) => (
                <div key={x.t} className="flex gap-3 rounded-2xl bg-[#f6f8f7] p-4">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-custod-primary" />
                  <div>
                    <p className="text-sm font-semibold">{x.t}</p>
                    <p className="mt-0.5 text-sm text-[#475569]">{x.b}</p>
                  </div>
                </div>
              ))}
            </div>
            {(plan.closeOrSave?.length || plan.ignoreForNow?.length) ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {plan.closeOrSave?.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-custod-muted">Close or save</p>
                    <ul className="mt-2 space-y-1 text-sm">{plan.closeOrSave.map((t, i) => <li key={i} className="truncate">· {t}</li>)}</ul>
                  </div>
                ) : null}
                {plan.ignoreForNow?.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-custod-muted">Ignore for now</p>
                    <ul className="mt-2 space-y-1 text-sm">{plan.ignoreForNow.map((t, i) => <li key={i} className="truncate">· {t}</li>)}</ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Signals */}
        <section className="mt-6 rounded-3xl border border-[#e2e8f0] bg-white p-6">
          <h2 className="text-lg font-semibold">Signal breakdown</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {SIGNAL_LABELS.map(({ key, label }) => {
              const v = Math.max(0, Math.min(100, Number(scan.riskBreakdown?.[key] ?? 0)));
              const recovery = key === "recoverySignal";
              const bar = recovery ? "bg-custod-status-green" : v >= 66 ? "bg-red-500" : v >= 33 ? "bg-amber-400" : "bg-custod-primary";
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="tabular-nums text-custod-muted">{v}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-[#f6f8f7]"><div className={`h-2 rounded-full ${bar}`} style={{ width: `${v}%` }} /></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tab groups */}
        {scan.tabGroups?.length ? (
          <section className="mt-6 rounded-3xl border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-lg font-semibold">What was open</h2>
            <div className="mt-4 space-y-4">
              {scan.tabGroups.map((g, gi) => (
                <div key={gi}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{g.name}</p>
                    <span className="rounded-full bg-[#f6f8f7] px-2 py-0.5 text-xs font-medium text-custod-muted">{g.tabs.length} tabs</span>
                  </div>
                  {g.explanation ? <p className="mt-0.5 text-xs text-custod-muted">{g.explanation}</p> : null}
                  <ul className="mt-2 space-y-1">
                    {g.tabs.slice(0, 8).map((t, ti) => (
                      <li key={ti} className="truncate text-sm text-[#475569]">{t.title || t.url}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
