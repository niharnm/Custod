"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import type { Scan } from "@/lib/types";
import { apiFetch } from "@/lib/device";
import { formatDate, statusColor } from "@/lib/utils";

export function RecentScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch("/api/scans?limit=8");
        const data = await res.json();
        if (active && res.ok) setScans(data.scans ?? []);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loaded && scans.length === 0) {
    return (
      <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] py-12 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--surface-2))]">
          <Zap className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
        </div>
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">No checks yet</p>
        <p className="caption mt-1">Run your first check above to start building a trend.</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel-inner h-32 animate-pulse bg-[hsl(var(--surface-2))]" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {scans.map((scan) => (
        <Link
          key={scan.id}
          href={`/scan/${scan.id}`}
          className="group panel-inner flex flex-col gap-3 p-4 transition-all hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--surface-3))]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-bold uppercase tracking-widest ${statusColor(scan.status)}`}>
              {scan.status}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className={`text-3xl font-bold ${statusColor(scan.status)}`}>
            {scan.score}
            <span className="text-base font-normal text-[hsl(var(--muted-foreground))]">/100</span>
          </div>
          <p className="caption line-clamp-2">{scan.mainPattern}</p>
          <span className="caption mt-auto">{formatDate(scan.createdAt)}</span>
        </Link>
      ))}
    </div>
  );
}
