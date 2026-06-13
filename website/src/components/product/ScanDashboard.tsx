"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  ExternalLink,
  Info,
  Loader2,
  Lock,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type {
  Achievement,
  BurnoutStatus,
  RiskBreakdown,
  Scan,
  Streak,
  TabGroup,
} from "@/lib/product/types";
import { cleanDomain, cn, formatDate, statusColor } from "@/lib/product/utils";
import { apiFetch } from "@/lib/product/device";
import { StatusBadge } from "@/components/product/StatusBadge";

const RISK_LABELS: { key: keyof RiskBreakdown; label: string; help: string }[] = [
  { key: "tabOverload", label: "Tab overload", help: "How many open loops the browser is carrying." },
  { key: "contextSwitching", label: "Context switching", help: "Different work modes open at once." },
  { key: "distractionPull", label: "Distraction pull", help: "Entertainment tabs mixed into the workspace." },
  { key: "goalFragmentation", label: "Goal fragmentation", help: "Competing surfaces pulling at one focus block." },
  { key: "timePressure", label: "Time pressure", help: "Deadlines, time left, and how you said you feel." },
];

function tone(value: number) {
  if (value >= 60) return { bar: "bg-danger", text: "text-danger", level: "high" };
  if (value >= 35) return { bar: "bg-warning", text: "text-warning", level: "medium" };
  return { bar: "bg-ok", text: "text-ok", level: "low" };
}

function ScoreRing({ score, status }: { score: number; status: BurnoutStatus }) {
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
        <div className={`text-3xl font-bold ${statusColor(status)}`}>{score}</div>
        <div className="caption text-[10px]">/ 100</div>
      </div>
    </div>
  );
}

function RiskBar({ label, help, value }: { label: string; help: string; value: number }) {
  const t = tone(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn("text-xs font-semibold capitalize", t.text)}>{t.level} · {value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[hsl(var(--surface-3))]">
        <div className={cn("h-1.5 rounded-full transition-all", t.bar)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <p className="caption">{help}</p>
    </div>
  );
}

function actionCopy(group: TabGroup) {
  switch (group.action) {
    case "keep":
      return { verb: "Keep open", tone: "border-ok/20 bg-ok/5 text-ok" };
    case "close":
      return { verb: "Park & save — don't lose these", tone: "border-warning/25 bg-warning/5 text-warning" };
    case "save":
      return { verb: "Save for later", tone: "border-[hsl(var(--primary)/0.25)] bg-[hsl(var(--primary)/0.06)] text-[hsl(var(--primary))]" };
    default:
      return { verb: "Ignore for now", tone: "border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-foreground))]" };
  }
}

function TabLine({ tab }: { tab: { title: string; url: string } }) {
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

export function ScanDashboard({ scan, readOnly = false }: { scan: Scan; readOnly?: boolean }) {
  const resetPlan = scan.resetPlan;
  const steps = useMemo(() => {
    if (!resetPlan) return [] as { id: string; title: string; detail: string }[];
    return [
      { id: "immediate", title: "Right now", detail: resetPlan.immediateAction },
      { id: "three", title: "3-minute reset", detail: resetPlan.threeMinuteReset },
      { id: "twenty", title: "Next 20 minutes", detail: resetPlan.twentyMinuteFocusBlock },
    ];
  }, [resetPlan]);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [resetSaving, setResetSaving] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);

  const [reflectText, setReflectText] = useState(scan.reflection?.text ?? "");
  const [accuracy, setAccuracy] = useState<"accurate" | "partly" | "off" | "">(scan.reflection?.accuracy ?? "");
  const [reflectSaving, setReflectSaving] = useState(false);
  const [reflectSaved, setReflectSaved] = useState(Boolean(scan.reflection));

  const [shareLink, setShareLink] = useState("");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function completeReset() {
    setResetSaving(true);
    try {
      const completedSteps = steps.filter((s) => checked[s.id]).map((s) => s.id);
      const res = await apiFetch(`/api/scans/${scan.id}/reset-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedSteps }),
      });
      const data = await res.json();
      if (res.ok && data.progress) {
        setResetDone(true);
        setStreak(data.progress.resetStreak ?? null);
        setUnlocked(data.progress.unlocked ?? []);
      }
    } finally {
      setResetSaving(false);
    }
  }

  async function saveReflection() {
    setReflectSaving(true);
    try {
      const res = await apiFetch(`/api/scans/${scan.id}/reflection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reflectText, accuracy: accuracy || undefined }),
      });
      if (res.ok) setReflectSaved(true);
    } finally {
      setReflectSaving(false);
    }
  }

  async function createShare() {
    setSharing(true);
    try {
      const res = await apiFetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: scan.id, includeRawTabs: false }),
      });
      const data = await res.json();
      if (res.ok && data.slug) setShareLink(data.url || `/share/${data.slug}`);
    } finally {
      setSharing(false);
    }
  }

  async function copyShare() {
    const full = shareLink.startsWith("http") ? shareLink : window.location.origin + shareLink;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const recovery = scan.riskBreakdown.recoverySignal;
  const topSignals = RISK_LABELS
    .map((r) => ({ ...r, value: scan.riskBreakdown[r.key] }))
    .filter((r) => r.value >= 35)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--bg)/0.8)] backdrop-blur-xl">
        <div className="shell flex min-h-[56px] items-center justify-between gap-4">
          <Link href="/" className="button-ghost text-xs gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <span className="caption">{formatDate(scan.createdAt)}</span>
        </div>
      </div>

      <div className="shell py-8 space-y-5">
        {/* Hero */}
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="panel p-6 space-y-5">
            <StatusBadge status={scan.status} large />
            <div className="flex items-start gap-6">
              <ScoreRing score={scan.score} status={scan.status} />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Custod sees{" "}
                  <span className={statusColor(scan.status)}>{scan.mainPattern.toLowerCase()}</span>
                </h1>
                <p className="mt-3 leading-7 text-[hsl(var(--muted-foreground))]">
                  {scan.patternExplanation ?? scan.oneSentenceExplanation}
                </p>
              </div>
            </div>

            {/* Honest framing */}
            <div className="flex items-start gap-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--primary))]" />
              <p className="caption leading-5">
                This is a check-engine light, not a diagnosis. It reads the pattern of your tabs and
                optional check-in — nothing about page content. A yellow or red just means it might be
                a good moment to reset.
              </p>
            </div>
          </div>

          {/* Why this status — explainability */}
          <div className="panel p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h2 className="text-base font-semibold tracking-tight">Why this status</h2>
            </div>
            {topSignals.length === 0 ? (
              <p className="caption leading-6">
                No single signal stood out. {scan.tabCount} tab{scan.tabCount === 1 ? "" : "s"} across{" "}
                {scan.domainCount} site{scan.domainCount === 1 ? "" : "s"}, with nothing pulling hard at your focus.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {topSignals.map((s) => (
                  <li key={s.key} className="flex items-start gap-2.5">
                    <TrendingUp className={cn("mt-0.5 h-4 w-4 shrink-0", tone(s.value).text)} />
                    <div>
                      <span className="text-sm font-medium">{s.label}</span>
                      <p className="caption leading-5">{s.help}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {recovery >= 35 && (
              <div className="flex items-start gap-2.5 rounded-xl border border-ok/20 bg-ok/5 p-3">
                <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                <div>
                  <span className="text-sm font-medium text-ok">Recovery signal present</span>
                  <p className="caption leading-5">Some of your tabs point at focus or rest — that pulled the score down.</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 border-t border-[hsl(var(--border))] pt-3 text-xs text-[hsl(var(--muted-foreground))]">
              <span>{scan.tabCount} tabs</span>
              <span className="opacity-40">·</span>
              <span>{scan.domainCount} sites</span>
              {scan.moodCheckIn && scan.moodCheckIn !== "skip" && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="capitalize">feeling {scan.moodCheckIn}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Risk breakdown + Reset plan */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="panel p-6 space-y-5">
            <h2 className="text-base font-semibold tracking-tight">Risk breakdown</h2>
            <div className="space-y-4">
              {RISK_LABELS.map((r) => (
                <RiskBar key={r.key} label={r.label} help={r.help} value={scan.riskBreakdown[r.key]} />
              ))}
            </div>
          </div>

          {resetPlan && (
            <div className="panel p-6 space-y-4">
              <h2 className="text-base font-semibold tracking-tight">Reset plan</h2>
              <ol className="space-y-2.5">
                {steps.map((step, i) => (
                  <li key={step.id}>
                    <label className="flex cursor-pointer gap-3 panel-inner p-3.5 transition-colors hover:bg-[hsl(var(--surface-3))]">
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={Boolean(checked[step.id])}
                        onChange={(e) => setChecked((c) => ({ ...c, [step.id]: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--primary))]">{step.title}</div>
                        <p className="mt-0.5 text-sm leading-6">{step.detail}</p>
                      </div>
                      <span className="ml-auto text-xs font-bold text-[hsl(var(--muted-foreground))]">{i + 1}</span>
                    </label>
                  </li>
                ))}
              </ol>

              {resetPlan.closeOrSave.length > 0 && (
                <div className="panel-inner p-3.5">
                  <p className="text-xs font-semibold text-warning">Park & save these (so you don&apos;t lose them)</p>
                  <ul className="mt-1.5 space-y-1">
                    {resetPlan.closeOrSave.slice(0, 8).map((t) => (
                      <li key={t} className="caption truncate">• {t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!readOnly && (
                resetDone ? (
                  <div className="rounded-xl border border-ok/25 bg-ok/10 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ok">
                      <Check className="h-4 w-4" /> Reset logged
                    </div>
                    {streak && streak.current > 0 && (
                      <p className="caption">Reset streak: {streak.current} day{streak.current === 1 ? "" : "s"}. No pressure to keep it — it just picks back up when you do.</p>
                    )}
                    {unlocked.length > 0 && (
                      <p className="caption text-[hsl(var(--primary))]">Unlocked: {unlocked.map((a) => a.name).join(", ")}</p>
                    )}
                  </div>
                ) : (
                  <button onClick={completeReset} disabled={resetSaving} className="button-primary w-full justify-center text-sm">
                    {resetSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    I did this reset
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Tab groups */}
        {scan.tabGroups && scan.tabGroups.length > 0 && (
          <div className="panel p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Tab groups</h2>
              <p className="caption mt-1">Grouped as evidence behind the status. Closing anything? Park &amp; save it first — never lose a tab.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {scan.tabGroups.map((group) => {
                const a = actionCopy(group);
                return (
                  <details key={group.name} className="panel-inner overflow-hidden" open={group.tabs.length <= 4}>
                    <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold select-none hover:bg-[hsl(var(--surface-3))] transition-colors">
                      <span className="flex-1">{group.name}</span>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", a.tone)}>{a.verb}</span>
                      <span className="caption">({group.tabs.length})</span>
                    </summary>
                    <div className="px-4 pb-3 pt-1">
                      <p className="caption mb-2">{group.explanation}</p>
                      <div className="space-y-0.5">
                        {group.tabs.map((tab, i) => <TabLine key={i} tab={tab} />)}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        )}

        {/* Reflection + actions */}
        <div className="grid gap-5 lg:grid-cols-2">
          {!readOnly && (
            <div className="panel p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Reflection</h2>
                <p className="caption mt-1">Optional, ~5 seconds. Stored only for you. Did this read true?</p>
              </div>
              <div className="flex gap-2">
                {(["accurate", "partly", "off"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAccuracy(v)}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition-all",
                      accuracy === v
                        ? "border-[hsl(var(--primary)/0.6)] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.3)]"
                    )}
                  >
                    {v === "off" ? "Not really" : v}
                  </button>
                ))}
              </div>
              <textarea
                value={reflectText}
                onChange={(e) => { setReflectText(e.target.value); setReflectSaved(false); }}
                rows={3}
                maxLength={500}
                className="input resize-none"
                placeholder="What feels stuck or urgent right now? (optional)"
              />
              <button onClick={saveReflection} disabled={reflectSaving || (!reflectText && !accuracy)} className="button-secondary text-sm">
                {reflectSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : reflectSaved ? <Check className="h-4 w-4" /> : null}
                {reflectSaved ? "Saved" : "Save reflection"}
              </button>
            </div>
          )}

          <div className="panel p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h2 className="text-base font-semibold tracking-tight">Export &amp; share</h2>
            </div>
            <p className="caption leading-6">
              Export is just for you. A share link is public to anyone who has it and may include tab
              titles — review before sharing.
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={`/api/scans/${scan.id}?format=md`} className="button-secondary text-sm">
                <Download className="h-4 w-4" /> Export Markdown
              </a>
              {!readOnly && (
                <button onClick={createShare} disabled={sharing} className="button-primary text-sm">
                  <Share2 className="h-4 w-4" />
                  {sharing ? "Creating…" : "Create share link"}
                </button>
              )}
            </div>
            {shareLink && (
              <button
                onClick={copyShare}
                className="w-full rounded-xl border border-[hsl(var(--primary)/0.25)] bg-[hsl(var(--primary)/0.08)] p-3 text-left transition-all hover:bg-[hsl(var(--primary)/0.12)]"
              >
                <p className="caption mb-1">{copied ? "Copied!" : "Click to copy — expires in 3 days"}</p>
                <span className="text-xs text-[hsl(var(--primary))] break-all">{shareLink}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
