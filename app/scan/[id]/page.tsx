"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Scan } from "@/lib/types";
import { apiFetch } from "@/lib/device";
import { Header } from "@/components/Header";
import { ScanDashboard } from "@/components/ScanDashboard";

export default function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scan, setScan] = useState<Scan | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/scans/${id}`);
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.scan) {
          setScan(data.scan);
          setState("ready");
        } else {
          setState("missing");
        }
      } catch {
        if (active) setState("missing");
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (state === "loading") {
    return (
      <main>
        <Header />
        <div className="shell flex flex-col items-center justify-center py-32 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--primary))]" />
          <p className="caption mt-3">Loading scan…</p>
        </div>
      </main>
    );
  }

  if (state === "missing" || !scan) {
    return (
      <main>
        <Header />
        <div className="shell flex flex-col items-center justify-center py-32 text-center">
          <p className="text-sm font-medium">This scan isn&apos;t available on this device.</p>
          <p className="caption mt-1">Scans are private to the browser that created them.</p>
          <Link href="/" className="button-primary mt-5 text-sm">Run a new check</Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <ScanDashboard scan={scan} />
    </main>
  );
}
