"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/device";

type Privacy = {
  storeRawTabs: boolean;
  retentionDays: number;
  syncEnabled: boolean;
  shareDefaultsIncludeRaw: boolean;
};

const TOGGLES: { key: keyof Privacy; label: string; hint: string }[] = [
  { key: "syncEnabled", label: "Sync across devices", hint: "Keep your history in step on every device you sign in on." },
  { key: "storeRawTabs", label: "Store raw tab titles & URLs", hint: "Off by default — Custod keeps only aggregate signals unless you opt in." },
  { key: "shareDefaultsIncludeRaw", label: "Include raw tabs in share links", hint: "When you share a check, include the underlying tabs (off keeps shares aggregate-only)." },
];

export function SettingsView() {
  const [privacy, setPrivacy] = useState<Privacy | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch("/api/me/privacy")
      .then((r) => r.json())
      .then((d: { privacy: Privacy }) => active && setPrivacy(d.privacy))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function patch(patch: Partial<Privacy>) {
    if (!privacy) return;
    setSaving(true);
    setNote("");
    const next = { ...privacy, ...patch };
    setPrivacy(next); // optimistic
    try {
      const res = await apiFetch("/api/me/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const d = await res.json();
      if (d.privacy) setPrivacy(d.privacy);
      setNote("Saved");
    } catch {
      setNote("Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  }

  function exportData() {
    // Same-origin link carries the session cookie, so the server scopes it to you.
    window.open("/api/export?format=json", "_blank");
  }

  async function deleteAll() {
    if (!confirm("Delete all your Custod checks and history? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await apiFetch("/api/me/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      setNote("All data deleted.");
    } catch {
      setNote("Couldn't delete — try again");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-custod-muted">Control what Custod stores and syncs. {note ? <span className="text-custod-primary">· {note}</span> : null}</p>
      </div>

      <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6">
        <h2 className="text-lg font-semibold">Privacy</h2>
        <div className="mt-4 divide-y divide-[#e2e8f0]">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="mt-0.5 text-xs text-custod-muted">{t.hint}</p>
              </div>
              <Switch on={Boolean(privacy?.[t.key])} disabled={!privacy || saving} onChange={(v) => patch({ [t.key]: v } as Partial<Privacy>)} />
            </div>
          ))}

          <div className="flex items-center justify-between gap-4 py-4 last:pb-0">
            <div>
              <p className="text-sm font-medium">Retention</p>
              <p className="mt-0.5 text-xs text-custod-muted">How long to keep your history.</p>
            </div>
            <select
              value={privacy?.retentionDays ?? 30}
              disabled={!privacy || saving}
              onChange={(e) => patch({ retentionDays: Number(e.target.value) })}
              className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6">
        <h2 className="text-lg font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-custod-muted">Export everything Custod has, or delete it all.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={exportData} className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-[#f8fafc]">
            <Download className="size-4" /> Export my data
          </button>
          <button onClick={deleteAll} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60">
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete all data
          </button>
        </div>
      </section>
    </div>
  );
}

function Switch({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${on ? "bg-custod-primary" : "bg-[#cbd5e1]"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
