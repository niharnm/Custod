"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import type { PrivacySettings } from "@/lib/types";
import { apiFetch, clearDeviceId, getDeviceId } from "@/lib/device";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--surface-3))]"
      )}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export default function SettingsPage() {
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletedMsg, setDeletedMsg] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch("/api/me/privacy");
        const data = await res.json();
        if (active && res.ok) setPrivacy(data.privacy);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function patch(next: Partial<PrivacySettings>) {
    setSaving(true);
    setPrivacy((p) => (p ? { ...p, ...next } : p));
    try {
      const res = await apiFetch("/api/me/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (res.ok) setPrivacy(data.privacy);
    } finally {
      setSaving(false);
    }
  }

  async function exportData(format: "json" | "md") {
    const res = await apiFetch(`/api/export?format=${format}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custod-export.${format === "md" ? "md" : "json"}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAll() {
    setDeleting(true);
    try {
      const res = await apiFetch("/api/me/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeletedMsg(`Deleted ${data.deleted?.scans ?? 0} scan(s). A fresh anonymous id was issued.`);
        clearDeviceId();
        getDeviceId();
        setConfirmDelete(false);
      }
    } finally {
      setDeleting(false);
    }
  }

  const rows: { key: keyof PrivacySettings; title: string; body: string }[] = [
    { key: "storeRawTabs", title: "Store raw tab titles & URLs", body: "Off by default. When off, only aggregate signals (counts, status, scores) are kept — never your actual tab titles or URLs." },
    { key: "syncEnabled", title: "Sync across devices", body: "Off by default. Anonymous and device-scoped until you turn this on." },
    { key: "shareDefaultsIncludeRaw", title: "Share links include raw tabs", body: "Off by default. When off, shared links redact tab titles to domains only." },
  ];

  return (
    <main>
      <Header />
      <section className="shell max-w-3xl py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings &amp; privacy</h1>
          <p className="caption mt-1">You control everything. No account, no tracking, no data brokers.</p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-ok/20 bg-ok/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
          <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Custod only ever reads tab titles, URLs, and your optional check-in — never page content,
            cookies, passwords, or browsing history. Only you can see your data, and you can export or
            delete all of it here at any time.
          </p>
        </div>

        {/* Privacy toggles */}
        <div className="panel divide-y divide-[hsl(var(--border))] p-0">
          {!loaded || !privacy ? (
            <div className="flex items-center gap-2 p-6 text-[hsl(var(--muted-foreground))]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
            </div>
          ) : (
            <>
              {rows.map((r) => (
                <div key={r.key} className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="caption mt-1 leading-5">{r.body}</p>
                  </div>
                  <Toggle on={Boolean(privacy[r.key])} disabled={saving} onClick={() => patch({ [r.key]: !privacy[r.key] } as Partial<PrivacySettings>)} />
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm font-semibold">Keep history for</p>
                  <p className="caption mt-1">Older scans are pruned past this window.</p>
                </div>
                <select
                  value={privacy.retentionDays}
                  disabled={saving}
                  onChange={(e) => patch({ retentionDays: Number(e.target.value) })}
                  className="input w-auto"
                >
                  {[7, 30, 90, 180, 365].map((d) => (
                    <option key={d} value={d}>{d} days</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Export */}
        <div className="panel p-6 space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Export your data</h2>
          <p className="caption">Download everything stored for this device. It belongs to you.</p>
          <div className="flex gap-2">
            <button onClick={() => exportData("json")} className="button-secondary text-sm">
              <Download className="h-4 w-4" /> JSON
            </button>
            <button onClick={() => exportData("md")} className="button-secondary text-sm">
              <Download className="h-4 w-4" /> Markdown
            </button>
          </div>
        </div>

        {/* Delete */}
        <div className="panel border-danger/20 p-6 space-y-3">
          <h2 className="text-base font-semibold tracking-tight text-danger">Delete everything</h2>
          <p className="caption">Permanently removes all scans, reflections, events, and share links for this device. This cannot be undone.</p>
          {deletedMsg ? (
            <p className="rounded-xl border border-ok/20 bg-ok/10 px-4 py-2.5 text-sm text-ok">{deletedMsg}</p>
          ) : confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={deleteAll} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Yes, delete all my data
              </button>
              <button onClick={() => setConfirmDelete(false)} className="button-ghost text-sm">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/15">
              <Trash2 className="h-4 w-4" /> Delete all my data
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
