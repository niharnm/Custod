import "server-only";

import type { BurnoutAnalysis, BurnoutCheckRecord, BrowserTab, MoodCheckIn } from "@/lib/types";
import { generateId } from "@/lib/utils";

// Compatibility store for the older /api/analyze and /api/checks routes.
// Production persistence lives in lib/storage/scans.ts against the scans schema.
const memoryChecks = new Map<string, BurnoutCheckRecord>();

export async function createCheck(input: {
  rawTabs: BrowserTab[];
  mood?: MoodCheckIn;
  analysis: BurnoutAnalysis;
}): Promise<BurnoutCheckRecord> {
  const record: BurnoutCheckRecord = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    rawTabs: input.rawTabs,
    mood: input.mood,
    analysis: input.analysis,
  };

  memoryChecks.set(record.id, record);
  return record;
}

export async function getCheck(id: string): Promise<BurnoutCheckRecord | null> {
  return memoryChecks.get(id) ?? null;
}

export async function listChecks(limit = 20): Promise<BurnoutCheckRecord[]> {
  return Array.from(memoryChecks.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function ensureShareSlug(id: string): Promise<string | null> {
  const existing = memoryChecks.get(id);
  if (!existing) return null;
  if (existing.shareSlug) return existing.shareSlug;

  const slug = generateId().replace(/-/g, "").slice(0, 10);
  memoryChecks.set(id, { ...existing, shareSlug: slug });
  return slug;
}

export async function getCheckBySlug(slug: string): Promise<BurnoutCheckRecord | null> {
  return Array.from(memoryChecks.values()).find((check) => check.shareSlug === slug) ?? null;
}
