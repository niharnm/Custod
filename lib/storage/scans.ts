import "server-only";

import type {
  Achievement,
  AnalyzeBurnoutResponse,
  Device,
  DevicePlatform,
  PrivacySettings,
  Reflection,
  ReflectionRequest,
  Scan,
  ScanEvent,
} from "@/lib/types";
import type { Owner } from "@/lib/owner";
import { deriveProgress, unlockedAfterReset } from "@/lib/gamification";
import {
  DEFAULT_PRIVACY_SETTINGS,
  aggregateTabs,
  publicScan,
  responseToScan,
} from "@/lib/privacy";
import { getSupabaseAdminIfConfigured } from "@/lib/supabase";
import { generateId, shareUrl } from "@/lib/utils";

type ShareRecord = {
  slug: string;
  scanId: string;
  userId?: string;
  deviceId?: string;
  expiresAt: string;
  includeRawTabs: boolean;
  revokedAt?: string;
};

type DataExport = {
  storage: "supabase" | "memory-dev";
  exportedAt: string;
  privacy: PrivacySettings;
  scans: Scan[];
  events: ScanEvent[];
};

type ScanStore = {
  mode: "supabase" | "memory-dev";
  registerDevice(input: { deviceId?: string; platform: DevicePlatform; label?: string; userId?: string }): Promise<Device>;
  createScan(response: AnalyzeBurnoutResponse, owner?: Owner): Promise<Scan>;
  getScan(id: string, owner?: Owner): Promise<Scan | null>;
  listScans(owner?: Owner, limit?: number): Promise<Scan[]>;
  addReflection(scanId: string, input: ReflectionRequest, owner?: Owner): Promise<Reflection | null>;
  completeReset(scanId: string, completedSteps?: string[], owner?: Owner): Promise<{ resetStreak: ReturnType<typeof deriveProgress>["streaks"][number]; unlocked: Achievement[] } | null>;
  getEvents(owner?: Owner): Promise<ScanEvent[]>;
  getPrivacy(owner?: Owner): Promise<PrivacySettings>;
  updatePrivacy(patch: Partial<PrivacySettings>, owner?: Owner): Promise<PrivacySettings>;
  createShare(scanId: string, options: { includeRawTabs?: boolean; expiresInHours?: number }, owner?: Owner): Promise<{ slug: string; url: string; expiresAt: string } | null>;
  getSharedScan(slug: string): Promise<Scan | null>;
  revokeShare(slug: string, owner?: Owner): Promise<boolean>;
  exportData(owner?: Owner): Promise<DataExport>;
  deleteData(owner?: Owner): Promise<{ scans: number; reflections: number; shares: number }>;
  /** Re-parent anonymous device rows to a user after sign-in. */
  claimDevice(userId: string, deviceId: string): Promise<{ scans: number }>;
};

let memoryStore: MemoryScanStore | null = null;

export function getScanStore(): ScanStore {
  const supabase = getSupabaseAdminIfConfigured();
  if (supabase) return new SupabaseScanStore(supabase as unknown as SupabaseLike);
  memoryStore ??= new MemoryScanStore();
  return memoryStore;
}

// ── Owner helpers ───────────────────────────────────────────────────────────
// Precedence: a signed-in user (userId) scopes by account; otherwise scope by
// the anonymous deviceId. An empty owner matches everything (used for public
// shared-scan reads).

function hasOwner(owner?: Owner): boolean {
  return Boolean(owner?.userId || owner?.deviceId);
}

function ownerKey(owner?: Owner): string {
  if (owner?.userId) return `u:${owner.userId}`;
  if (owner?.deviceId) return `d:${owner.deviceId}`;
  return "";
}

function scanOwner(scan: Scan): Owner {
  return { userId: scan.userId, deviceId: scan.deviceId };
}

function ownsOwner(scan: Scan, owner?: Owner): boolean {
  if (!hasOwner(owner)) return true;
  if (owner?.userId) return scan.userId === owner.userId;
  return scan.deviceId === owner?.deviceId;
}

class MemoryScanStore implements ScanStore {
  mode = "memory-dev" as const;
  private devices = new Map<string, Device>();
  private scans = new Map<string, Scan>();
  private events: ScanEvent[] = [];
  private reflections = new Map<string, Reflection>();
  private privacy = new Map<string, PrivacySettings>();
  private shares = new Map<string, ShareRecord>();

  async registerDevice(input: { deviceId?: string; platform: DevicePlatform; label?: string; userId?: string }) {
    const now = new Date().toISOString();
    const id = input.deviceId || generateId();
    const device: Device = {
      id,
      platform: input.platform,
      label: input.label,
      createdAt: this.devices.get(id)?.createdAt ?? now,
      lastSeenAt: now,
      syncEnabled: this.privacy.get(ownerKey({ deviceId: id }))?.syncEnabled ?? false,
    };
    this.devices.set(id, device);
    return device;
  }

  async createScan(response: AnalyzeBurnoutResponse, owner?: Owner) {
    const scan = responseToScan(response, owner);
    this.scans.set(scan.id, scan);
    this.events.push(event("scan_created", scan.id, owner, { score: scan.score, status: scan.status }));
    return scan;
  }

  async getScan(id: string, owner?: Owner) {
    const scan = this.scans.get(id);
    if (!scan || !ownsOwner(scan, owner)) return null;
    return withReflection(scan, this.reflections.get(id));
  }

  async listScans(owner?: Owner, limit = 30) {
    return Array.from(this.scans.values())
      .filter((scan) => ownsOwner(scan, owner))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async addReflection(scanId: string, input: ReflectionRequest, owner?: Owner) {
    const scan = await this.getScan(scanId, owner);
    if (!scan) return null;
    const reflection: Reflection = {
      scanId,
      text: input.text ?? "",
      accuracy: input.accuracy,
      helpfulAction: input.helpfulAction,
      createdAt: new Date().toISOString(),
    };
    this.reflections.set(scanId, reflection);
    this.events.push(event("reflection_added", scanId, scanOwner(scan), { accuracy: input.accuracy ?? null }));
    return reflection;
  }

  async completeReset(scanId: string, completedSteps?: string[], owner?: Owner) {
    const scan = await this.getScan(scanId, owner);
    if (!scan) return null;
    this.events.push(event("reset_complete", scanId, scanOwner(scan), { completedSteps: completedSteps?.length ?? 0 }));
    const scans = await this.listScans(scanOwner(scan), 500);
    const events = await this.getEvents(scanOwner(scan));
    const progress = deriveProgress(scans, events);
    return {
      resetStreak: progress.streaks.find((streak) => streak.type === "reset") ?? progress.streaks[1],
      unlocked: unlockedAfterReset(scans, events).filter((achievement) => achievement.id === "reset_completed" || achievement.id === "focus_recovered"),
    };
  }

  async getEvents(owner?: Owner) {
    if (!hasOwner(owner)) return this.events;
    return this.events.filter((item) => ownsOwner({ deviceId: item.deviceId, userId: item.userId } as Scan, owner));
  }

  async getPrivacy(owner?: Owner) {
    const key = ownerKey(owner);
    if (!key) return DEFAULT_PRIVACY_SETTINGS;
    const settings = this.privacy.get(key) ?? DEFAULT_PRIVACY_SETTINGS;
    this.privacy.set(key, settings);
    return settings;
  }

  async updatePrivacy(patch: Partial<PrivacySettings>, owner?: Owner) {
    const current = await this.getPrivacy(owner);
    const next = { ...current, ...patch };
    const key = ownerKey(owner);
    if (key) this.privacy.set(key, next);
    return next;
  }

  async createShare(scanId: string, options: { includeRawTabs?: boolean; expiresInHours?: number }, owner?: Owner) {
    const scan = await this.getScan(scanId, owner);
    if (!scan) return null;
    const slug = generateId().replace(/-/g, "").slice(0, 12);
    const expiresAt = new Date(Date.now() + (options.expiresInHours ?? 72) * 60 * 60 * 1000).toISOString();
    this.shares.set(slug, { slug, scanId, userId: scan.userId, deviceId: scan.deviceId, expiresAt, includeRawTabs: Boolean(options.includeRawTabs) });
    this.events.push(event("share_created", scanId, scanOwner(scan), { includeRawTabs: Boolean(options.includeRawTabs) }));
    return { slug, url: shareUrl(slug), expiresAt };
  }

  async getSharedScan(slug: string) {
    const share = this.shares.get(slug);
    if (!share || share.revokedAt || new Date(share.expiresAt).getTime() < Date.now()) return null;
    const scan = this.scans.get(share.scanId);
    return scan ? publicScan(scan, share.includeRawTabs) : null;
  }

  async revokeShare(slug: string, owner?: Owner) {
    const share = this.shares.get(slug);
    if (!share) return false;
    if (hasOwner(owner) && !ownsOwner({ userId: share.userId, deviceId: share.deviceId } as Scan, owner)) return false;
    this.shares.set(slug, { ...share, revokedAt: new Date().toISOString() });
    return true;
  }

  async exportData(owner?: Owner) {
    return {
      storage: this.mode,
      exportedAt: new Date().toISOString(),
      privacy: await this.getPrivacy(owner),
      scans: await this.listScans(owner, 1000),
      events: await this.getEvents(owner),
    };
  }

  async deleteData(owner?: Owner) {
    const scanIds = Array.from(this.scans.values())
      .filter((scan) => ownsOwner(scan, owner))
      .map((scan) => scan.id);
    for (const id of scanIds) {
      this.scans.delete(id);
      this.reflections.delete(id);
    }
    let shares = 0;
    for (const [slug, share] of this.shares) {
      if (scanIds.includes(share.scanId)) {
        this.shares.delete(slug);
        shares += 1;
      }
    }
    this.events = this.events.filter((item) => !scanIds.includes(item.scanId ?? ""));
    return { scans: scanIds.length, reflections: scanIds.length, shares };
  }

  async claimDevice(userId: string, deviceId: string) {
    let claimed = 0;
    for (const [id, scan] of this.scans) {
      if (scan.deviceId === deviceId && !scan.userId) {
        this.scans.set(id, { ...scan, userId });
        claimed += 1;
      }
    }
    for (let i = 0; i < this.events.length; i += 1) {
      const ev = this.events[i];
      if (ev.deviceId === deviceId && !ev.userId) this.events[i] = { ...ev, userId };
    }
    for (const [slug, share] of this.shares) {
      if (share.deviceId === deviceId && !share.userId) this.shares.set(slug, { ...share, userId });
    }
    const deviceKey = ownerKey({ deviceId });
    const settings = this.privacy.get(deviceKey);
    if (settings) this.privacy.set(ownerKey({ userId }), settings);
    return { scans: claimed };
  }
}

type SupabaseLike = {
  from(table: string): DbBuilder;
};

type DbBuilder = PromiseLike<QueryResult> & {
  select(columns?: string): DbBuilder;
  insert(values: unknown): DbBuilder;
  upsert(values: unknown): DbBuilder;
  update(values: unknown): DbBuilder;
  delete(): DbBuilder;
  eq(column: string, value: unknown): DbBuilder;
  is(column: string, value: unknown): DbBuilder;
  in(column: string, values: unknown[]): DbBuilder;
  order(column: string, options?: { ascending?: boolean }): DbBuilder;
  limit(count: number): DbBuilder;
  maybeSingle(): DbBuilder;
};

/** Apply owner scoping to a query: user_id when signed in, else device_id. */
function ownerEq(builder: DbBuilder, owner?: Owner): DbBuilder {
  if (owner?.userId) return builder.eq("user_id", owner.userId);
  if (owner?.deviceId) return builder.eq("device_id", owner.deviceId);
  return builder;
}

class SupabaseScanStore implements ScanStore {
  mode = "supabase" as const;
  constructor(private supabase: SupabaseLike) {}

  async registerDevice(input: { deviceId?: string; platform: DevicePlatform; label?: string; userId?: string }) {
    const now = new Date().toISOString();
    const id = input.deviceId || generateId();
    const row = {
      id,
      user_id: input.userId ?? null,
      platform: input.platform,
      label: input.label ?? null,
      last_seen_at: now,
      sync_enabled: Boolean(input.userId),
    };
    const { data, error } = await query(
      this.supabase.from("devices").upsert(row).select("*").maybeSingle()
    );
    if (error) throw new Error(error.message);
    return rowToDevice(data ?? { ...row, created_at: now });
  }

  async createScan(response: AnalyzeBurnoutResponse, owner?: Owner) {
    const scan = responseToScan(response, owner);
    const aggregate = aggregateTabs(response.tabGroups.flatMap((group) => group.tabs));
    const { error } = await query(
      this.supabase.from("scans").insert({
        id: scan.id,
        user_id: owner?.userId ?? null,
        device_id: owner?.deviceId ?? null,
        created_at: scan.createdAt,
        status: scan.status,
        status_label: scan.statusLabel,
        score: scan.score,
        main_pattern: scan.mainPattern,
        tab_count: aggregate.tabCount,
        domain_count: aggregate.domainCount,
        goal: scan.goal ?? null,
        mood_check_in: scan.moodCheckIn ?? null,
        time_remaining: scan.timeRemaining ?? null,
        analysis: response,
        tab_groups: response.tabGroups,
      })
    );
    if (error) throw new Error(error.message);
    await Promise.all([
      query(this.supabase.from("risk_scores").insert(riskRow(scan.id, scan.riskBreakdown))),
      query(
        this.supabase.from("reset_plans").insert({
          scan_id: scan.id,
          immediate_action: scan.resetPlan?.immediateAction,
          three_minute_reset: scan.resetPlan?.threeMinuteReset,
          twenty_minute_focus: scan.resetPlan?.twentyMinuteFocusBlock,
          close_or_save: scan.resetPlan?.closeOrSave ?? [],
          ignore_for_now: scan.resetPlan?.ignoreForNow ?? [],
        })
      ),
      this.insertEvent("scan_created", scan.id, owner, { score: scan.score, status: scan.status }),
    ]);
    return scan;
  }

  async getScan(id: string, owner?: Owner) {
    const builder = ownerEq(this.supabase.from("scans").select("*").eq("id", id), owner);
    const { data, error } = await query(builder.maybeSingle());
    if (error) throw new Error(error.message);
    return data ? rowToScan(data) : null;
  }

  async listScans(owner?: Owner, limit = 30) {
    const builder = ownerEq(
      this.supabase.from("scans").select("*").order("created_at", { ascending: false }).limit(limit),
      owner
    );
    const { data, error } = await query(builder);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as DbRow[];
    return rows.map((row) => rowToScan(row));
  }

  async addReflection(scanId: string, input: ReflectionRequest, owner?: Owner) {
    const scan = await this.getScan(scanId, owner);
    if (!scan) return null;
    const reflection: Reflection = {
      scanId,
      text: input.text ?? "",
      accuracy: input.accuracy,
      helpfulAction: input.helpfulAction,
      createdAt: new Date().toISOString(),
    };
    const { error } = await query(
      this.supabase.from("reflections").insert({
        scan_id: scanId,
        user_id: scan.userId ?? null,
        text: reflection.text,
        metadata: { accuracy: input.accuracy ?? null, helpfulAction: input.helpfulAction ?? null },
        created_at: reflection.createdAt,
      })
    );
    if (error) throw new Error(error.message);
    await this.insertEvent("reflection_added", scanId, scanOwner(scan), { accuracy: input.accuracy ?? null });
    return reflection;
  }

  async completeReset(scanId: string, completedSteps?: string[], owner?: Owner) {
    const scan = await this.getScan(scanId, owner);
    if (!scan) return null;
    await this.insertEvent("reset_complete", scanId, scanOwner(scan), { completedSteps: completedSteps?.length ?? 0 });
    const scans = await this.listScans(scanOwner(scan), 500);
    const events = await this.getEvents(scanOwner(scan));
    const progress = deriveProgress(scans, events);
    return {
      resetStreak: progress.streaks.find((streak) => streak.type === "reset") ?? progress.streaks[1],
      unlocked: unlockedAfterReset(scans, events).filter((achievement) => achievement.unlockedAt),
    };
  }

  async getEvents(owner?: Owner) {
    const builder = ownerEq(this.supabase.from("scan_events").select("*").order("created_at", { ascending: false }), owner);
    const { data, error } = await query(builder);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as DbRow[];
    return rows.map((row) => rowToEvent(row));
  }

  async getPrivacy(owner?: Owner) {
    if (!hasOwner(owner)) return DEFAULT_PRIVACY_SETTINGS;
    const { data, error } = await query(
      ownerEq(this.supabase.from("privacy_settings").select("*"), owner).maybeSingle()
    );
    if (error) throw new Error(error.message);
    return data ? rowToPrivacy(data) : DEFAULT_PRIVACY_SETTINGS;
  }

  async updatePrivacy(patch: Partial<PrivacySettings>, owner?: Owner) {
    if (!hasOwner(owner)) return { ...DEFAULT_PRIVACY_SETTINGS, ...patch };
    const row = privacyToRow({ ...(await this.getPrivacy(owner)), ...patch }, owner);
    const { data, error } = await query(this.supabase.from("privacy_settings").upsert(row).select("*").maybeSingle());
    if (error) throw new Error(error.message);
    return rowToPrivacy(data ?? row);
  }

  async createShare(scanId: string, options: { includeRawTabs?: boolean; expiresInHours?: number }, owner?: Owner) {
    const scan = await this.getScan(scanId, owner);
    if (!scan) return null;
    const slug = generateId().replace(/-/g, "").slice(0, 12);
    const expiresAt = new Date(Date.now() + (options.expiresInHours ?? 72) * 60 * 60 * 1000).toISOString();
    const { error } = await query(
      this.supabase.from("share_links").insert({
        slug,
        scan_id: scanId,
        user_id: scan.userId ?? null,
        device_id: scan.deviceId ?? null,
        expires_at: expiresAt,
        include_raw_tabs: Boolean(options.includeRawTabs),
      })
    );
    if (error) throw new Error(error.message);
    await this.insertEvent("share_created", scanId, scanOwner(scan), { includeRawTabs: Boolean(options.includeRawTabs) });
    return { slug, url: shareUrl(slug), expiresAt };
  }

  async getSharedScan(slug: string) {
    const { data, error } = await query(this.supabase.from("share_links").select("*").eq("slug", slug).maybeSingle());
    if (error) throw new Error(error.message);
    if (!data || data.revoked_at || (data.expires_at && new Date(data.expires_at).getTime() < Date.now())) return null;
    const scan = await this.getScan(data.scan_id);
    return scan ? publicScan(scan, Boolean(data.include_raw_tabs)) : null;
  }

  async revokeShare(slug: string, owner?: Owner) {
    const builder = ownerEq(this.supabase.from("share_links").update({ revoked_at: new Date().toISOString() }).eq("slug", slug), owner);
    const { error } = await query(builder);
    if (error) throw new Error(error.message);
    return true;
  }

  async exportData(owner?: Owner) {
    return {
      storage: this.mode,
      exportedAt: new Date().toISOString(),
      privacy: await this.getPrivacy(owner),
      scans: await this.listScans(owner, 1000),
      events: await this.getEvents(owner),
    };
  }

  async deleteData(owner?: Owner) {
    const scans = await this.listScans(owner, 1000);
    const ids = scans.map((scan) => scan.id);
    if (ids.length) {
      await query(this.supabase.from("share_links").delete().in("scan_id", ids));
      await query(this.supabase.from("scan_events").delete().in("scan_id", ids));
      await query(this.supabase.from("scans").delete().in("id", ids));
    }
    return { scans: ids.length, reflections: ids.length, shares: 0 };
  }

  async claimDevice(userId: string, deviceId: string) {
    // Re-parent the device's anonymous rows to the user (only rows not yet owned).
    const tables = ["scans", "scan_events", "share_links", "reflections", "privacy_settings", "devices"];
    let scans = 0;
    for (const table of tables) {
      const builder = this.supabase
        .from(table)
        .update({ user_id: userId })
        .eq("device_id", deviceId)
        .is("user_id", null)
        .select("id");
      const { data, error } = await query(builder);
      if (error) continue; // table may lack device_id/user_id in some envs; skip
      if (table === "scans") scans = (data as DbRow[] | null)?.length ?? 0;
    }
    return { scans };
  }

  private async insertEvent(type: ScanEvent["type"], scanId: string, owner: Owner | undefined, metadata: Record<string, unknown>) {
    const { error } = await query(
      this.supabase.from("scan_events").insert({
        scan_id: scanId,
        user_id: owner?.userId ?? null,
        device_id: owner?.deviceId ?? null,
        event_type: type,
        metadata,
      })
    );
    if (error) throw new Error(error.message);
  }
}

function event(type: ScanEvent["type"], scanId: string, owner: Owner | undefined, metadata: Record<string, unknown>): ScanEvent {
  return { id: generateId(), scanId, deviceId: owner?.deviceId, userId: owner?.userId, type, metadata, createdAt: new Date().toISOString() };
}

function withReflection(scan: Scan, reflection?: Reflection): Scan {
  return reflection ? { ...scan, reflection } : scan;
}

function rowToDevice(row: DbRow): Device {
  return {
    id: row.id,
    platform: row.platform,
    label: row.label ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    lastSeenAt: row.last_seen_at ?? new Date().toISOString(),
    syncEnabled: Boolean(row.sync_enabled),
  };
}

function rowToScan(row: DbRow): Scan {
  if (row.analysis) return responseToScan(row.analysis, { userId: row.user_id ?? undefined, deviceId: row.device_id ?? undefined });
  return {
    id: row.id,
    deviceId: row.device_id ?? undefined,
    userId: row.user_id ?? undefined,
    createdAt: row.created_at,
    status: row.status,
    score: Number(row.score),
    statusLabel: row.status_label,
    mainPattern: row.main_pattern,
    tabCount: Number(row.tab_count ?? 0),
    domainCount: Number(row.domain_count ?? 0),
    goal: row.goal ?? undefined,
    moodCheckIn: row.mood_check_in ?? undefined,
    timeRemaining: row.time_remaining ?? undefined,
    riskBreakdown: row.risk_breakdown ?? {
      tabOverload: 0,
      contextSwitching: 0,
      distractionPull: 0,
      goalFragmentation: 0,
      timePressure: 0,
      recoverySignal: 0,
    },
  };
}

function rowToEvent(row: DbRow): ScanEvent {
  return {
    id: row.id,
    scanId: row.scan_id ?? undefined,
    deviceId: row.device_id ?? undefined,
    userId: row.user_id ?? undefined,
    type: row.event_type,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function rowToPrivacy(row: DbRow): PrivacySettings {
  return {
    storeRawTabs: Boolean(row.store_raw_tabs),
    retentionDays: Number(row.retention_days ?? 30),
    syncEnabled: Boolean(row.sync_enabled),
    shareDefaultsIncludeRaw: Boolean(row.share_defaults_include_raw),
  };
}

function privacyToRow(settings: PrivacySettings, owner?: Owner) {
  return {
    user_id: owner?.userId ?? null,
    device_id: owner?.deviceId ?? null,
    store_raw_tabs: settings.storeRawTabs,
    retention_days: settings.retentionDays,
    sync_enabled: settings.syncEnabled,
    share_defaults_include_raw: settings.shareDefaultsIncludeRaw,
  };
}

function riskRow(scanId: string, risk: Scan["riskBreakdown"]) {
  return {
    scan_id: scanId,
    tab_overload: risk.tabOverload,
    context_switching: risk.contextSwitching,
    distraction_pull: risk.distractionPull,
    goal_fragmentation: risk.goalFragmentation,
    time_pressure: risk.timePressure,
    recovery_signal: risk.recoverySignal,
  };
}

// Dynamic rows returned by the Supabase query shim; values are validated/coerced at each rowTo* boundary.
/* eslint-disable @typescript-eslint/no-explicit-any */
type DbRow = Record<string, any>;
type QueryResult = { data: any; error: { message: string } | null };
/* eslint-enable @typescript-eslint/no-explicit-any */

async function query(value: DbBuilder): Promise<QueryResult> {
  return value;
}
