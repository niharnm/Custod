"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plug, ScanLine } from "lucide-react";
import { CustodButton, CustodInput, CustodPill, CustodTextarea } from "@/components/custod/ui";
import { parseTabsInput } from "@/lib/product/utils";
import { apiFetch, ensureDeviceRegistered } from "@/lib/product/device";
import type { BrowserTab, MoodCheckInValue } from "@/lib/product/types";

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
    <form onSubmit={submit} className="custod-card space-y-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Run a burnout check</h2>
          <p className="caption mt-0.5">Paste tabs or pull from the extension. No page content is ever read.</p>
        </div>
        <CustodButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={importFromExtension}
          disabled={importing || loading}
        >
          {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Plug className="size-3.5" />}
          Import tabs
        </CustodButton>
      </div>

      <CustodTextarea
        label="Browser tabs"
        value={rawTabs}
        onChange={(e) => setRawTabs(e.target.value)}
        rows={8}
        className="font-mono text-xs leading-relaxed"
        placeholder={"One tab per line:\nCanvas — Assignments\nhttps://mail.google.com\nYouTube - how to study better"}
        hint={
          parsedTabs.length > 0
            ? `${parsedTabs.length} tab${parsedTabs.length === 1 ? "" : "s"} detected`
            : "No tabs yet"
        }
      />

      <div>
        <label className="label mb-2 block">
          How are you feeling? <span className="caption font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <CustodPill key={m.value} active={mood === m.value} onClick={() => setMood(m.value)}>
              {m.label}
            </CustodPill>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CustodInput
          label="What are you working on? (optional)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          maxLength={240}
          placeholder="e.g. finish history essay"
        />
        <CustodInput
          label="Time left (optional)"
          value={timeRemaining}
          onChange={(e) => setTimeRemaining(e.target.value)}
          maxLength={80}
          placeholder="e.g. 2h, 30m"
        />
      </div>

      {message ? (
        <p className="rounded-xl border border-custod-status-green/25 bg-custod-status-green/10 px-4 py-2.5 text-sm text-custod-status-green">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="caption max-w-xs">A signal, not a diagnosis. Pattern detection only.</p>
        <CustodButton type="submit" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
          Run check
        </CustodButton>
      </div>
    </form>
  );
}
