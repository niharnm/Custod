"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ScanLine } from "lucide-react";
import { parseTabsInput } from "@/lib/utils";
import type { BrowserTab } from "@/lib/types";

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

function requestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function formatTabs(tabs: BrowserTab[]) {
  return tabs.map((tab) => `${tab.title || tab.url}${tab.url ? ` - ${tab.url}` : ""}`).join("\n");
}

export function BrowserCaptureForm() {
  const router = useRouter();
  const [rawTabs, setRawTabs] = useState("");
  const [energy, setEnergy] = useState("3");
  const [stress, setStress] = useState("3");
  const [timePressure, setTimePressure] = useState<"none" | "some" | "high">("some");
  const [reflection, setReflection] = useState("");
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
          reject(new Error("The extension did not respond. Paste tabs manually or load the extension."));
        }, 2500);

        function cleanup() {
          window.clearTimeout(timeout);
          window.removeEventListener("message", onMessage);
        }

        function onMessage(event: MessageEvent<ExtensionResponse>) {
          if (event.source !== window) return;
          const data = event.data;
          if (
            data?.source !== EXTENSION_SOURCE ||
            data.type !== CURRENT_TABS_RESPONSE ||
            data.requestId !== id
          ) {
            return;
          }
          cleanup();
          if (!data.ok) {
            reject(new Error(data.error || "The extension could not read this browser window."));
            return;
          }
          resolve(data.tabs ?? []);
        }

        window.addEventListener("message", onMessage);
        window.postMessage({ source: WEB_SOURCE, type: REQUEST_CURRENT_TABS, requestId: id }, window.location.origin);
      });

      if (tabs.length === 0) {
        setMessage("No http or https tabs were available from this window.");
        return;
      }
      setRawTabs(formatTabs(tabs));
      setMessage(`Imported ${tabs.length} tab${tabs.length === 1 ? "" : "s"} from the current window.`);
    } catch (caught) {
      setMessage("");
      setError(caught instanceof Error ? caught.message : "Unable to import tabs.");
    } finally {
      setImporting(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (parsedTabs.length === 0) {
      setError("Add at least one tab title or URL before running a check.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabs: parsedTabs,
          mood: {
            energy: Number(energy),
            stress: Number(stress),
            timePressure,
            reflection
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Custod could not run this check.");
      router.push(`/check/${data.check.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Custod could not run this check.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Run a burnout pattern check</h2>
          <p className="caption mt-1">
            Paste tabs or request them from the extension. Custod never reads page bodies.
          </p>
        </div>
        <button
          type="button"
          onClick={importFromExtension}
          disabled={importing || loading}
          className="button-secondary shrink-0"
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
          Get current tabs
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <label className="block">
          <span className="label">Browser tabs</span>
          <textarea
            value={rawTabs}
            onChange={(event) => setRawTabs(event.target.value)}
            rows={11}
            className="input mt-2 resize-y font-mono text-xs leading-6"
            placeholder={"One tab per line:\nCanvas assignment - https://...\nGoogle search how to cite sources\nInbox - https://mail.google.com"}
          />
          <p className="caption mt-2">{parsedTabs.length} tab{parsedTabs.length === 1 ? "" : "s"} detected.</p>
        </label>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <label>
              <span className="label">Energy</span>
              <select value={energy} onChange={(event) => setEnergy(event.target.value)} className="input mt-2">
                <option value="1">1 - drained</option>
                <option value="2">2</option>
                <option value="3">3 - neutral</option>
                <option value="4">4</option>
                <option value="5">5 - steady</option>
              </select>
            </label>
            <label>
              <span className="label">Stress</span>
              <select value={stress} onChange={(event) => setStress(event.target.value)} className="input mt-2">
                <option value="1">1 - low</option>
                <option value="2">2</option>
                <option value="3">3 - moderate</option>
                <option value="4">4</option>
                <option value="5">5 - high</option>
              </select>
            </label>
          </div>
          <label>
            <span className="label">Time pressure</span>
            <select value={timePressure} onChange={(event) => setTimePressure(event.target.value as "none" | "some" | "high")} className="input mt-2">
              <option value="none">None right now</option>
              <option value="some">Some pressure</option>
              <option value="high">High pressure</option>
            </select>
          </label>
          <label>
            <span className="label">Optional reflection</span>
            <textarea
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              rows={4}
              className="input mt-2 resize-none"
              placeholder="What feels stuck or urgent?"
            />
          </label>
        </div>
      </div>

      {message ? <p className="mt-4 rounded-lg border border-ok/20 bg-ok/10 px-3 py-2 text-sm text-ok">{message}</p> : null}
      {error ? <p className="mt-4 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="caption max-w-xl">
          Custod flags patterns. It is not a diagnosis and should not replace support from a trusted person or professional.
        </p>
        <button type="submit" disabled={loading} className="button-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
          Run check
        </button>
      </div>
    </form>
  );
}
