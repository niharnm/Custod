import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import type { BurnoutAnalysis, BurnoutCheckRecord, BrowserTab, MoodCheckIn } from "@/lib/types";
import { generateId } from "@/lib/utils";

const fallbackFile = process.env.VERCEL
  ? join(tmpdir(), "custod-checks.json")
  : join(process.cwd(), ".custod-data", "checks.json");

type Store = {
  checks: Record<string, BurnoutCheckRecord>;
  shares: Record<string, string>;
};

const g = globalThis as unknown as { __custodStore?: Store };

function memory(): Store {
  if (!g.__custodStore) {
    g.__custodStore = { checks: {}, shares: {} };
  }
  return g.__custodStore;
}

async function loadStore(): Promise<void> {
  try {
    const raw = await readFile(fallbackFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    const store = memory();
    store.checks = { ...store.checks, ...(parsed.checks ?? {}) };
    store.shares = { ...store.shares, ...(parsed.shares ?? {}) };
    for (const check of Object.values(store.checks)) {
      if (check.shareSlug) store.shares[check.shareSlug] = check.id;
    }
  } catch {
    // No local store yet.
  }
}

async function flushStore(): Promise<void> {
  await mkdir(dirname(fallbackFile), { recursive: true });
  await writeFile(fallbackFile, JSON.stringify(memory()), "utf8");
}

export async function createCheck(input: {
  rawTabs: BrowserTab[];
  mood?: MoodCheckIn;
  analysis: BurnoutAnalysis;
}): Promise<BurnoutCheckRecord> {
  await loadStore();
  const record: BurnoutCheckRecord = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    rawTabs: input.rawTabs,
    mood: input.mood,
    analysis: input.analysis
  };
  memory().checks[record.id] = record;
  await flushStore();
  return record;
}

export async function getCheck(id: string): Promise<BurnoutCheckRecord | null> {
  await loadStore();
  return memory().checks[id] ?? null;
}

export async function listChecks(limit = 20): Promise<BurnoutCheckRecord[]> {
  await loadStore();
  return Object.values(memory().checks)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

export async function ensureShareSlug(id: string): Promise<string | null> {
  await loadStore();
  const check = memory().checks[id];
  if (!check) return null;
  if (check.shareSlug) return check.shareSlug;
  let slug = generateId().replace(/-/g, "").slice(0, 10);
  while (memory().shares[slug]) {
    slug = generateId().replace(/-/g, "").slice(0, 10);
  }
  check.shareSlug = slug;
  memory().shares[slug] = id;
  await flushStore();
  return slug;
}

export async function getCheckBySlug(slug: string): Promise<BurnoutCheckRecord | null> {
  await loadStore();
  const id = memory().shares[slug];
  return id ? memory().checks[id] ?? null : null;
}
