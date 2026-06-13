"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ScanLine, Plug } from "lucide-react";
import { parseTabsInput } from "@/lib/utils";
import { apiFetch, ensureDeviceRegistered } from "@/lib/device";
import type { BrowserTab, MoodCheckInValue } from "@/lib/types";

const WEB_SOURCE = "custod-web";
const EXTENSION_SOURCE = "custod-extension";
const REQUEST_CURRENT_TABS = "CUSTOD_REQUEST_CURRENT_TABS";
const CURRENT_TABS_RESPONSE = "CUSTOD_CURRENT_TABS_RESPONSE";

type ExtensionResponse = {
  source?: string;
  type?: string;
  requestId?: string;
  ok?: boolean;
  tabs?: BrowserTab[];
  error?: string;
};

const MOODS: { value: MoodCheckInValue; label: string }[] = [
  { value: "calm", label: "Calm" },
  { value: "stressed", label: "Stressed" },
  { value: "overwhelmed", label: "Overwhelmed" },
  { value: "numb", label: "Numb" },
  { value: "skip", label: "Skip" },
];

function requestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function formatTabs(tabs: BrowserTab[]) {
  return tabs.map((t) => `${t.title || t.url}${t.url ? ` - ${t.url}` : ""}`).join("\n");
}

export function BrowserCaptureForm() {
  const router = useRouter();
  const [rawTabs, setRawTabs] = useState("");
  const [mood, setMood] = useState<MoodCheckInValue>("skip");
  const [goal, setGoal] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const parsedTabs = useMemo(() => parseTabsInput(rawTabs), [rawTabs]);

  async function importFromExtension() {
    setError("");
    setMessage("Waiting for the Custod extension...");
    setImporting(true);
    const id = requestId();
    try {
      const tabs = await new Promise<BrowserTab[]>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          cleanup();
          reject(new Error("Extension did not respond. Paste tabs manually or load the extension."));
        }, 2500);
        function cleanup() {
          window.clearTimeout(timeout);
          window.removeEventListener("message", onMessage);
        }
        function onMessage(event: MessageEvent<ExtensionResponse>) {
          if (event.source !== window) return;
          const d = event.data;
          if (d?.source !== EXTENSION_SOURCE || d.type !== CURRENT_TABS_RESPONSE || d.requestId !== id) return;
          cleanup();
          if (!d.ok) { reject(new Error(d.error || "Extension could not read this window.")); return; }
          resolve(d.tabs ?? []);
        }
        window.addEventListener("message", onMessage);
        window.postMessage({ source: WEB_SOURCE, type: REQUEST_CURRENT_TABS, requestId: id }, window.location.origin);
      });
      if (tabs.length === 0) { setMessage("No http/https tabs found in this window."); return; }
      setRawTabs(formatTabs(tabs));
      setMessage(`Imported ${tabs.length} tab${tabs.length === 1 ? "" : "s"}.`);
    } catch (e) {
      setMessage("");
      setError(e instanceof Error ? e.message : "Unable to import tabs.");
    } finally {
      setImporting(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (parsedTabs.length === 0) { setError("Add at least one tab title or URL."); return; }
    setLoading(true);
    try {
      await ensureDeviceRegistered();
      const res = await apiFetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabs: parsedTabs,
          moodCheckIn: mood,
          goal: goal.trim() || undefined,
          timeRemaining: timeRemaining.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      router.push(`/scan/${data.scanId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Run a burnout check</h2>
          <p className="caption mt-0.5">Paste tabs or pull from the extension. No page content is ever read.</p>
        </div>
        <button type="button" onClick={importFromExtension} disabled={importing || loading} className="button-ghost shrink-0 text-xs">
          {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
          Import tabs
        </button>
      </div>

      {/* Tabs textarea */}
      <div>
        <label className="label mb-2 block">Browser tabs</label>
        <textarea
          value={rawTabs}
          onChange={(e) => setRawTabs(e.target.value)}
          rows={8}
          className="input resize-y font-mono text-xs leading-relaxed"
          placeholder={"One tab per line:\nCanvas — Assignments\nhttps://mail.google.com\nYouTube - how to study better"}
        />
        <p className="caption mt-1.5">
          {parsedTabs.length > 0
            ? <span className="text-[hsl(var(--primary))]">{parsedTabs.length} tab{parsedTabs.length === 1 ? "" : "s"} detected</span>
            : "No tabs yet"}
        </p>
      </div>

      {/* Mood check-in */}
      <div>
        <label className="label mb-2 block">How are you feeling? <span className="caption font-normal">(optional, ~5s)</span></label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                mood === m.value
                  ? "border-[hsl(var(--primary)/0.6)] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.3)]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Goal + time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label mb-2 block">What are you working on? <span className="caption font-normal">(optional)</span></label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            maxLength={240}
            className="input"
            placeholder="e.g. finish history essay"
          />
        </div>
        <div>
          <label className="label mb-2 block">Time left <span className="caption font-normal">(optional)</span></label>
          <input
            value={timeRemaining}
            onChange={(e) => setTimeRemaining(e.target.value)}
            maxLength={80}
            className="input"
            placeholder="e.g. 2h, 30m"
          />
        </div>
      </div>

      {message && (
        <p className="rounded-xl border border-ok/20 bg-ok/10 px-4 py-2.5 text-sm text-ok">{message}</p>
      )}
      {error && (
        <p className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>
      )}

      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="caption max-w-xs">A signal, not a diagnosis. Pattern detection only.</p>
        <button type="submit" disabled={loading} className="button-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
          Run check
        </button>
      </div>
    </form>
  );
}
