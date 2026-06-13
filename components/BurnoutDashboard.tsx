"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Clipboard,
  Download,
  ExternalLink,
  LineChart,
  Lock,
  Share2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { BurnoutCheckRecord, BrowserTab, RiskSignal } from "@/lib/types";
import { cleanDomain, cn, formatDate, statusColor } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

function ScoreRing({ score, status }: { score: number; status: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color =
    status === "red" ? "hsl(var(--danger))" : status === "yellow" ? "hsl(var(--warning))" : "hsl(var(--ok))";
  const glow =
    status === "red"
      ? "drop-shadow(0 0 12px hsl(var(--danger)/0.7))"
      : status === "yellow"
        ? "drop-shadow(0 0 12px hsl(var(--warning)/0.7))"
        : "drop-shadow(0 0 12px hsl(var(--ok)/0.7))";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90" style={{ filter: glow }}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="hsl(var(--surface-3))" strokeWidth="8" />
        <circle
          cx="64" cy="64" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={circ - filled}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={`text-3xl font-bold ${statusColor(status as "green" | "yellow" | "red")}`}>{score}</div>
        <div className="caption text-[10px]">/ 100</div>
      </div>
    </div>
  );
}

function RiskCard({ risk }: { risk: RiskSignal }) {
  const tone =
    risk.level === "high"
      ? { border: "border-danger/20", bg: "bg-danger/5", bar: "bg-danger", badge: "bg-danger/15 text-danger" }
      : risk.level === "medium"
        ? { border: "border-warning/20", bg: "bg-warning/5", bar: "bg-warning", badge: "bg-warning/15 text-warning" }
        : { border: "border-ok/20", bg: "bg-ok/5", bar: "bg-ok", badge: "bg-ok/15 text-ok" };

  return (
    <div className={cn("rounded-xl border p-4 space-y-3", tone.border, tone.bg)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{risk.label}</h3>
          <p className="caption mt-0.5">{risk.explanation}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", tone.badge)}>
          {risk.level}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[hsl(var(--surface-3))]">
        <div
          className={cn("h-1.5 rounded-full transition-all", tone.bar)}
          style={{ width: `${Math.min(100, risk.score * 4)}%` }}
        />
      </div>
      <ul className="space-y-1">
        {risk.evidence.map((item) => (
          <li key={item} className="flex items-start gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--muted-foreground)/0.5)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabLine({ tab }: { tab: BrowserTab }) {
  const domain = cleanDomain(tab.url);
  const body = (
    <div className="flex min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[hsl(var(--surface-3))] transition-colors">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--primary)/0.6)]" />
      <span className="min-w-0 flex-1 truncate text-sm">{tab.title || domain || tab.url}</span>
      {domain && <span className="hidden shrink-0 text-xs text-[hsl(var(--muted-foreground))] sm:inline">{domain}</span>}
      {tab.url && <ExternalLink className="h-3 w-3 shrink-0 text-[hsl(var(--muted-foreground)/0.5)]" />}
    </div>
  );
  return tab.url ? (
    <a href={tab.url} target="_blank" rel="noreferrer" className="block">{body}</a>
  ) : body;
}

export function BurnoutDashboard({
  check,
  history = [],
  readOnly = false,
}: {
  check: BurnoutCheckRecord;
  history?: BurnoutCheckRecord[];
  readOnly?: boolean;
}) {
  const [shareLink, setShareLink] = useState(check.shareSlug ? `/share/${check.shareSlug}` : "");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const a = check.analysis;
  const trend = history.slice(0, 8).reverse();

  async function createShare() {
    setSharing(true);
    try {
      const res = await fetch(`/api/checks/${check.id}/share`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setShareLink(data.url || `/share/${data.slug}`);
    } finally { setSharing(false); }
  }

  async function copyShare() {
    const full = window.location.origin + shareLink;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--bg)/0.8)] backdrop-blur-xl">
        <div className="shell flex min-h-[56px] items-center justify-between gap-4">
          <Link href="/" className="button-ghost text-xs gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <span className="caption">{formatDate(check.createdAt)}</span>
        </div>
      </div>

      <div className="shell py-8 space-y-5">
        {/* Hero row */}
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Main status */}
          <div className="panel p-6 space-y-5">
            <StatusBadge status={a.status} large />
            <div className="flex items-start gap-6">
              <ScoreRing score={a.score} status={a.status} />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Custod sees{" "}
                  <span className={statusColor(a.status)}>{a.mainPattern.toLowerCase()}</span>
                </h1>
                <p className="mt-3 leading-7 text-[hsl(var(--muted-foreground))]">{a.patternExplanation}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 pt-1">
              {[
                { icon: Lock, title: "Privacy", body: a.privacySummary },
                { icon: Sparkles, title: "Reflection prompt", body: a.reflectionPrompt },
                { icon: TrendingUp, title: "Pattern score", body: `${a.score}/100 — ${a.status} zone` },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="panel-inner p-4 space-y-2">
                  <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
                  <div className="text-sm font-semibold">{title}</div>
                  <p className="caption leading-5">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reset plan */}
          <div className="panel p-5 space-y-4">
            <h2 className="text-base font-semibold tracking-tight">Reset plan</h2>
            <ol className="space-y-3">
              {a.resetPlan.map((step, i) => (
                <li key={step.title} className="flex gap-3 panel-inner p-3.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[hsl(var(--primary))] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{step.title}</div>
                    <p className="caption mt-0.5 leading-5">{step.detail}</p>
                    <div className="mt-1.5 text-xs font-semibold text-[hsl(var(--primary))]">{step.minutes} min</div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap gap-2 pt-1">
              <a href={`/api/checks/${check.id}?format=md`} className="button-secondary text-xs px-3 py-2">
                <Download className="h-3.5 w-3.5" /> Export
              </a>
              {!readOnly && (
                <button onClick={createShare} disabled={sharing} className="button-primary text-xs px-3 py-2">
                  <Share2 className="h-3.5 w-3.5" />
                  {sharing ? "Sharing…" : "Share"}
                </button>
              )}
            </div>

            {shareLink && (
              <button
                onClick={copyShare}
                className="w-full rounded-xl border border-[hsl(var(--primary)/0.25)] bg-[hsl(var(--primary)/0.08)] p-3 text-left transition-all hover:bg-[hsl(var(--primary)/0.12)]"
              >
                <p className="caption mb-1">{copied ? "Copied!" : "Click to copy link"}</p>
                <span className="text-xs text-[hsl(var(--primary))] break-all">{shareLink}</span>
              </button>
            )}
          </div>
        </div>

        {/* Risk + Evidence */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="panel p-5 space-y-4">
            <h2 className="text-base font-semibold tracking-tight">Risk breakdown</h2>
            <div className="space-y-3">
              {a.riskBreakdown.map((risk) => <RiskCard key={risk.id} risk={risk} />)}
            </div>
          </div>

          <div className="panel p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Evidence groups</h2>
              <p className="caption mt-1">Tab clusters behind the status light. Page contents not inspected.</p>
            </div>
            <div className="space-y-2">
              {a.evidenceGroups.map((group) => (
                <details key={group.name} className="panel-inner overflow-hidden" open={group.tabs.length <= 4}>
                  <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 font-semibold text-sm select-none hover:bg-[hsl(var(--surface-3))] transition-colors">
                    <span className="flex-1">{group.name}</span>
                    <span className="caption">({group.tabs.length})</span>
                  </summary>
                  <div className="px-4 pb-3 pt-1">
                    <p className="caption mb-2">{group.explanation}</p>
                    <div className="space-y-0.5">
                      {group.tabs.map((tab, i) => <TabLine key={i} tab={tab} />)}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Trend + Mood */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="panel p-5 space-y-4">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h2 className="text-base font-semibold tracking-tight">Score trend</h2>
            </div>
            {trend.length === 0 ? (
              <p className="caption py-4">No prior checks yet. Run Custod over time to build a trend.</p>
            ) : (
              <div className="flex h-28 items-end gap-1.5 border-b border-l border-[hsl(var(--border))] px-1">
                {trend.map((item) => (
                  <Link key={item.id} href={`/check/${item.id}`} className="flex flex-1 flex-col items-center gap-1 group">
                    <div
                      className={cn(
                        "w-full max-w-8 rounded-t-md transition-all group-hover:brightness-125",
                        item.analysis.status === "red" ? "bg-danger" : item.analysis.status === "yellow" ? "bg-warning" : "bg-ok"
                      )}
                      style={{ height: `${Math.max(8, item.analysis.score)}%` }}
                      title={`${item.analysis.score}/100`}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="panel p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clipboard className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h2 className="text-base font-semibold tracking-tight">Mood check-in</h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Energy", val: check.mood?.energy },
                { label: "Stress", val: check.mood?.stress },
                { label: "Pressure", val: check.mood?.timePressure },
              ].map(({ label, val }) => (
                <div key={label} className="panel-inner p-3 text-center">
                  <p className="caption">{label}</p>
                  <p className="mt-1 text-xl font-bold capitalize">{val ?? "—"}</p>
                </div>
              ))}
            </div>

            <div className="panel-inner p-4">
              <p className="caption mb-1.5">Reflection</p>
              <p className="text-sm leading-7 text-[hsl(var(--foreground))]">
                {check.mood?.reflection || "No reflection added for this check."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
