import "server-only";

import type { BurnoutAnalysis, BurnoutCheckRecord, BrowserTab, MoodCheckIn } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

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

  const { error } = await supabase.from("checks").insert({
    id: record.id,
    created_at: record.createdAt,
    raw_tabs: record.rawTabs,
    mood: record.mood ?? null,
    analysis: record.analysis,
    share_slug: null,
  });

  if (error) throw new Error(error.message);
  return record;
}

export async function getCheck(id: string): Promise<BurnoutCheckRecord | null> {
  const { data, error } = await supabase
    .from("checks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToRecord(data) : null;
}

export async function listChecks(limit = 20): Promise<BurnoutCheckRecord[]> {
  const { data, error } = await supabase
    .from("checks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToRecord);
}

export async function ensureShareSlug(id: string): Promise<string | null> {
  const { data: existing, error: fetchErr } = await supabase
    .from("checks")
    .select("share_slug")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);
  if (!existing) return null;
  if (existing.share_slug) return existing.share_slug;

  const slug = generateId().replace(/-/g, "").slice(0, 10);

  const { error: updateErr } = await supabase
    .from("checks")
    .update({ share_slug: slug })
    .eq("id", id);

  if (updateErr) throw new Error(updateErr.message);
  return slug;
}

export async function getCheckBySlug(slug: string): Promise<BurnoutCheckRecord | null> {
  const { data, error } = await supabase
    .from("checks")
    .select("*")
    .eq("share_slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToRecord(data) : null;
}

function rowToRecord(row: Record<string, unknown>): BurnoutCheckRecord {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    rawTabs: row.raw_tabs as BrowserTab[],
    mood: row.mood as MoodCheckIn | undefined,
    analysis: row.analysis as BurnoutAnalysis,
    shareSlug: row.share_slug as string | undefined,
  };
}
