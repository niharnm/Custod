"use client";

import { useState } from "react";
import {
  Clipboard,
  Download,
  ExternalLink,
  Gauge,
  LineChart,
  Lock,
  Share2,
  Sparkles
} from "lucide-react";
import type { BurnoutCheckRecord, BrowserTab, RiskSignal } from "@/lib/types";
import { cleanDomain, cn, formatDate, statusColor } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

function RiskCard({ risk }: { risk: RiskSignal }) {
  const tone =
    risk.level === "high"
      ? "border-danger/25 bg-danger/5"
      : risk.level === "medium"
        ? "border-warning/25 bg-warning/5"
        : "border-ok/20 bg-ok/5";

  return (
    <div className={cn("rounded-lg border p-4", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{risk.label}</h3>
          <p className="caption mt-1">{risk.explanation}</p>
        </div>
        <span className="rounded-full border bg-white px-2 py-0.5 text-xs font-semibold capitalize">
          {risk.level}
        </span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-white">
        <div
          className={cn(
            "h-2 rounded-full",
            risk.level === "high" ? "bg-danger" : risk.level === "medium" ? "bg-warning" : "bg-ok"
          )}
          style={{ width: `${Math.min(100, risk.score * 4)}%` }}
        />
      </div>
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        {risk.evidence.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function TabLine({ tab }: { tab: BrowserTab }) {
  const domain = cleanDomain(tab.url);
  const body = (
    <div className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
      <span className="h-2 w-2 shrink-0 rounded-full bg-primary/50" />
      <span className="min-w-0 flex-1 truncate text-sm">{tab.title || domain || tab.url}</span>
      {domain ? <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{domain}</span> : null}
      {tab.url ? <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
    </div>
  );

  return tab.url ? (
    <a href={tab.url} target="_blank" rel="noreferrer" className="block">
      {body}
    </a>
  ) : (
    body
  );
}

export function BurnoutDashboard({
  check,
  history = [],
  readOnly = false
}: {
  check: BurnoutCheckRecord;
  history?: BurnoutCheckRecord[];
  readOnly?: boolean;
}) {
  const [shareLink, setShareLink] = useState(check.shareSlug ? `/share/${check.shareSlug}` : "");
  const [sharing, setSharing] = useState(false);
  const analysis = check.analysis;
  const trend = history.slice(0, 8).reverse();

  async function createShare() {
    setSharing(true);
    try {
      const res = await fetch(`/api/checks/${check.id}/share`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setShareLink(data.url || `/share/${data.slug}`);
    } finally {
      setSharing(false);
    }
  }

  return (
    <section className="shell py-8">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <StatusBadge status={analysis.status} large />
              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Custod sees <span className={statusColor(analysis.status)}>{analysis.mainPattern.toLowerCase()}</span>
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                {analysis.patternExplanation}
              </p>
            </div>
            <div className="rounded-xl border bg-muted px-5 py-4 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Score</div>
              <div className={cn("mt-1 text-5xl font-semibold", statusColor(analysis.status))}>
                {analysis.score}
              </div>
              <div className="caption">out of 100</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-4">
              <Gauge className="h-5 w-5 text-primary" />
              <div className="mt-3 text-sm font-semibold">Status light</div>
              <p className="caption mt-1">Green, yellow, or red based on browser-pattern load.</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <Lock className="h-5 w-5 text-primary" />
              <div className="mt-3 text-sm font-semibold">Private by design</div>
              <p className="caption mt-1">{analysis.privacySummary}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <div className="mt-3 text-sm font-semibold">Reflection</div>
              <p className="caption mt-1">{analysis.reflectionPrompt}</p>
            </div>
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Reset plan</h2>
              <p className="caption mt-1">Short steps for regaining control before continuing.</p>
            </div>
            <span className="caption">{formatDate(check.createdAt)}</span>
          </div>
          <ol className="mt-5 space-y-3">
            {analysis.resetPlan.map((step, index) => (
              <li key={step.title} className="flex gap-3 rounded-lg border bg-white p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <div className="font-semibold">{step.title}</div>
                  <p className="caption mt-1">{step.detail}</p>
                  <div className="mt-2 text-xs font-semibold text-primary">{step.minutes} min</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={`/api/checks/${check.id}?format=md`} className="button-secondary">
              <Download className="h-4 w-4" />
              Export
            </a>
            {!readOnly ? (
              <button onClick={createShare} disabled={sharing} className="button-primary">
                <Share2 className="h-4 w-4" />
                {sharing ? "Sharing" : "Share"}
              </button>
            ) : null}
          </div>
          {shareLink ? (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <a href={shareLink} className="break-all text-primary underline-offset-2 hover:underline">
                {shareLink}
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Risk breakdown</h2>
          <div className="mt-4 grid gap-3">
            {analysis.riskBreakdown.map((risk) => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Evidence groups</h2>
          <p className="caption mt-1">
            These are the tab clusters behind the status light. Page contents are not inspected.
          </p>
          <div className="mt-4 space-y-4">
            {analysis.evidenceGroups.map((group) => (
              <details key={group.name} className="rounded-lg border bg-white p-4" open={group.tabs.length <= 4}>
                <summary className="cursor-pointer font-semibold">
                  {group.name} <span className="text-sm font-normal text-muted-foreground">({group.tabs.length})</span>
                </summary>
                <p className="caption mt-2">{group.explanation}</p>
                <div className="mt-3 space-y-1">
                  {group.tabs.map((tab, index) => (
                    <TabLine key={`${group.name}-${index}`} tab={tab} />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Trend</h2>
          </div>
          {trend.length === 0 ? (
            <p className="caption mt-4">No prior checks yet. Run Custod over time to build a real trend.</p>
          ) : (
            <div className="mt-5 flex h-32 items-end gap-2 border-b border-l px-2">
              {trend.map((item) => (
                <div key={item.id} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={cn(
                      "w-full max-w-10 rounded-t-md",
                      item.analysis.status === "red"
                        ? "bg-danger"
                        : item.analysis.status === "yellow"
                          ? "bg-warning"
                          : "bg-ok"
                    )}
                    style={{ height: `${Math.max(10, item.analysis.score)}%` }}
                    title={`${item.analysis.score}/100`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Clipboard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Reflection</h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {check.mood?.reflection
              ? check.mood.reflection
              : "No reflection was added for this check."}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border bg-white p-3">
              <div className="caption">Energy</div>
              <div className="mt-1 text-xl font-semibold">{check.mood?.energy ?? "-"}</div>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <div className="caption">Stress</div>
              <div className="mt-1 text-xl font-semibold">{check.mood?.stress ?? "-"}</div>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <div className="caption">Pressure</div>
              <div className="mt-1 text-xl font-semibold capitalize">{check.mood?.timePressure ?? "-"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
