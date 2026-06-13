import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BrowserTab, BurnoutStatus } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function cleanDomain(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const url = new URL(rawUrl);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function statusLabel(status: BurnoutStatus): string {
  return status === "green" ? "Green" : status === "yellow" ? "Yellow" : "Red";
}

export function statusColor(status: BurnoutStatus): string {
  return status === "green"
    ? "text-ok"
    : status === "yellow"
      ? "text-warning"
      : "text-danger";
}

const URL_RE = /https?:\/\/[^\s]+/i;
const BARE_DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i;

export function parseTabsInput(text: string): BrowserTab[] {
  const tabs: BrowserTab[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(URL_RE);
    if (match) {
      const url = match[0].replace(/[)\].,]+$/, "");
      const title =
        line
          .replace(match[0], "")
          .replace(/[\s|:–—-]+$/, "")
          .replace(/^[\s|:–—-]+/, "")
          .trim() || url;
      tabs.push({ title, url, active: false });
      continue;
    }

    if (BARE_DOMAIN_RE.test(line)) {
      tabs.push({ title: line, url: `https://${line}`, active: false });
      continue;
    }

    tabs.push({ title: line, url: "", active: false });
  }
  return tabs;
}

export function shareUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return base ? `${base}/share/${slug}` : `/share/${slug}`;
}
