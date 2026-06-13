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
  registerDevice(input: { deviceId?: string; platform: DevicePlatform; label?: string }): Promise<Device>;
  createScan(response: AnalyzeBurnoutResponse, deviceId?: string): Promise<Scan>;
  getScan(id: string, deviceId?: string): Promise<Scan | null>;
  listScans(deviceId?: string, limit?: number): Promise<Scan[]>;
  addReflection(scanId: string, input: ReflectionRequest, deviceId?: string): Promise<Reflection | null>;
  completeReset(scanId: string, completedSteps?: string[], deviceId?: string): Promise<{ resetStreak: ReturnType<typeof deriveProgress>["streaks"][number]; unlocked: Achievement[] } | null>;
  getEvents(deviceId?: string): Promise<ScanEvent[]>;
  getPrivacy(deviceId?: string): Promise<PrivacySettings>;
  updatePrivacy(patch: Partial<PrivacySettings>, deviceId?: string): Promise<PrivacySettings>;
  createShare(scanId: string, options: { includeRawTabs?: boolean; expiresInHours?: number }, deviceId?: string): Promise<{ slug: string; url: string; expiresAt: string } | null>;
  getSharedScan(slug: string): Promise<Scan | null>;
  exportData(deviceId?: string): Promise<DataExport>;
  deleteData(deviceId?: string): Promise<{ scans: number; reflections: number; shares: number }>;
};

let memoryStore: MemoryScanStore | null = null;

export function getScanStore(): ScanStore {
  const supabase = getSupabaseAdminIfConfigured();
  if (supabase) return new SupabaseScanStore(supabase as unknown as SupabaseLike);
  memoryStore ??= new MemoryScanStore();
  return memoryStore;
}

class MemoryScanStore implements ScanStore {
  mode = "memory-dev" as const;
  private devices = new Map<string, Device>();
  private scans = new Map<string, Scan>();
  private events: ScanEvent[] = [];
  private reflections = new Map<string, Reflection>();
  private privacy = new Map<string, PrivacySettings>();
  private shares = new Map<string, ShareRecord>();

  async registerDevice(input: { deviceId?: string; platform: DevicePlatform; label?: string }) {
    const now = new Date().toISOString();
    const id = input.deviceId || generateId();
    const device: Device = {
      id,
      platform: input.platform,
      label: input.label,
      createdAt: this.devices.get(id)?.createdAt ?? now,
      lastSeenAt: now,
      syncEnabled: this.privacy.get(id)?.syncEnabled ?? false,
    };
    this.devices.set(id, device);
    this.privacy.set(id, this.privacy.get(id) ?? DEFAULT_PRIVACY_SETTINGS);
    return device;
  }

  async createScan(response: AnalyzeBurnoutResponse, deviceId?: string) {
    const scan = responseToScan(response, deviceId);
    this.scans.set(scan.id, scan);
    this.events.push(event("scan_created", scan.id, deviceId, { score: scan.score, status: scan.status }));
    return scan;
  }

  async getScan(id: string, deviceId?: string) {
    const scan = this.scans.get(id);
    if (!scan || !ownsDevice(scan, deviceId)) return null;
    return withReflection(scan, this.reflections.get(id));
  }

  async listScans(deviceId?: string, limit = 30) {
    return Array.from(this.scans.values())
      .filter((scan) => ownsDevice(scan, deviceId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async addReflection(scanId: string, input: ReflectionRequest, deviceId?: string) {
    const scan = await this.getScan(scanId, deviceId);
    if (!scan) return null;
    const reflection: Reflection = {
      scanId,
      text: input.text ?? "",
      accuracy: input.accuracy,
      helpfulAction: input.helpfulAction,
      createdAt: new Date().toISOString(),
    };
    this.reflections.set(scanId, reflection);
    this.events.push(event("reflection_added", scanId, scan.deviceId, { accuracy: input.accuracy ?? null }));
    return reflection;
  }

  async completeReset(scanId: string, completedSteps?: string[], deviceId?: string) {
    const scan = await this.getScan(scanId, deviceId);
    if (!scan) return null;
    this.events.push(event("reset_complete", scanId, scan.deviceId, { completedSteps: completedSteps?.length ?? 0 }));
    const scans = await this.listScans(scan.deviceId, 500);
    const events = await this.getEvents(scan.deviceId);
    const progress = deriveProgress(scans, events);
    return {
      resetStreak: progress.streaks.find((streak) => streak.type === "reset") ?? progress.streaks[1],
      unlocked: unlockedAfterReset(scans, events).filter((achievement) => achievement.id === "reset_completed" || achievement.id === "focus_recovered"),
    };
  }

  async getEvents(deviceId?: string) {
    return this.events.filter((item) => !deviceId || item.deviceId === deviceId);
  }

  async getPrivacy(deviceId?: string) {
    if (!deviceId) return DEFAULT_PRIVACY_SETTINGS;
    const settings = this.privacy.get(deviceId) ?? DEFAULT_PRIVACY_SETTINGS;
    this.privacy.set(deviceId, settings);
    return settings;
  }

  async updatePrivacy(patch: Partial<PrivacySettings>, deviceId?: string) {
    const current = await this.getPrivacy(deviceId);
    const next = { ...current, ...patch };
    if (deviceId) this.privacy.set(deviceId, next);
    return next;
  }

  async createShare(scanId: string, options: { includeRawTabs?: boolean; expiresInHours?: number }, deviceId?: string) {
    const scan = await this.getScan(scanId, deviceId);
    if (!scan) return null;
    const slug = generateId().replace(/-/g, "").slice(0, 12);
    const expiresAt = new Date(Date.now() + (options.expiresInHours ?? 72) * 60 * 60 * 1000).toISOString();
    this.shares.set(slug, { slug, scanId, deviceId: scan.deviceId, expiresAt, includeRawTabs: Boolean(options.includeRawTabs) });
    this.events.push(event("share_created", scanId, scan.deviceId, { includeRawTabs: Boolean(options.includeRawTabs) }));
    return { slug, url: shareUrl(slug), expiresAt };
  }

  async getSharedScan(slug: string) {
    const share = this.shares.get(slug);
    if (!share || share.revokedAt || new Date(share.expiresAt).getTime() < Date.now()) return null;
    const scan = this.scans.get(share.scanId);
    return scan ? publicScan(scan, share.includeRawTabs) : null;
  }

  async exportData(deviceId?: string) {
    return {
      storage: this.mode,
      exportedAt: new Date().toISOString(),
      privacy: await this.getPrivacy(deviceId),
      scans: await this.listScans(deviceId, 1000),
      events: await this.getEvents(deviceId),
    };
  }

  async deleteData(deviceId?: string) {
    const scanIds = Array.from(this.scans.values())
      .filter((scan) => ownsDevice(scan, deviceId))
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
  in(column: string, values: unknown[]): DbBuilder;
  order(column: string, options?: { ascending?: boolean }): DbBuilder;
  limit(count: number): DbBuilder;
  maybeSingle(): DbBuilder;
};

class SupabaseScanStore implements ScanStore {
  mode = "supabase" as const;
  constructor(private supabase: SupabaseLike) {}

  async registerDevice(input: { deviceId?: string; platform: DevicePlatform; label?: string }) {
    const now = new Date().toISOString();
    const id = input.deviceId || generateId();
    const row = {
      id,
      platform: input.platform,
      label: input.label ?? null,
      last_seen_at: now,
      sync_enabled: false,
    };
    const { data, error } = await query(
      this.supabase.from("devices").upsert(row).select("*").maybeSingle()
    );
    if (error) throw new Error(error.message);
    return rowToDevice(data ?? { ...row, created_at: now });
  }

  async createScan(response: AnalyzeBurnoutResponse, deviceId?: string) {
    const scan = responseToScan(response, deviceId);
    const aggregate = aggregateTabs(response.tabGroups.flatMap((group) => group.tabs));
    const { error } = await query(
      this.supabase.from("scans").insert({
        id: scan.id,
        device_id: deviceId ?? null,
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
      this.insertEvent("scan_created", scan.id, deviceId, { score: scan.score, status: scan.status }),
    ]);
    return scan;
  }

  async getScan(id: string, deviceId?: string) {
    let builder = this.supabase.from("scans").select("*").eq("id", id);
    if (deviceId) builder = builder.eq("device_id", deviceId);
    const { data, error } = await query(builder.maybeSingle());
    if (error) throw new Error(error.message);
    return data ? rowToScan(data) : null;
  }

  async listScans(deviceId?: string, limit = 30) {
    let builder = this.supabase.from("scans").select("*").order("created_at", { ascending: false }).limit(limit);
    if (deviceId) builder = builder.eq("device_id", deviceId);
    const { data, error } = await query(builder);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as DbRow[];
    return rows.map((row) => rowToScan(row));
  }

  async addReflection(scanId: string, input: ReflectionRequest, deviceId?: string) {
    const scan = await this.getScan(scanId, deviceId);
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
        text: reflection.text,
        metadata: { accuracy: input.accuracy ?? null, helpfulAction: input.helpfulAction ?? null },
        created_at: reflection.createdAt,
      })
    );
    if (error) throw new Error(error.message);
    await this.insertEvent("reflection_added", scanId, scan.deviceId, { accuracy: input.accuracy ?? null });
    return reflection;
  }

  async completeReset(scanId: string, completedSteps?: string[], deviceId?: string) {
    const scan = await this.getScan(scanId, deviceId);
    if (!scan) return null;
    await this.insertEvent("reset_complete", scanId, scan.deviceId, { completedSteps: completedSteps?.length ?? 0 });
    const scans = await this.listScans(scan.deviceId, 500);
    const events = await this.getEvents(scan.deviceId);
    const progress = deriveProgress(scans, events);
    return {
      resetStreak: progress.streaks.find((streak) => streak.type === "reset") ?? progress.streaks[1],
      unlocked: unlockedAfterReset(scans, events).filter((achievement) => achievement.unlockedAt),
    };
  }

  async getEvents(deviceId?: string) {
    let builder = this.supabase.from("scan_events").select("*").order("created_at", { ascending: false });
    if (deviceId) builder = builder.eq("device_id", deviceId);
    const { data, error } = await query(builder);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as DbRow[];
    return rows.map((row) => rowToEvent(row));
  }

  async getPrivacy(deviceId?: string) {
    if (!deviceId) return DEFAULT_PRIVACY_SETTINGS;
    const { data, error } = await query(
      this.supabase.from("privacy_settings").select("*").eq("device_id", deviceId).maybeSingle()
    );
    if (error) throw new Error(error.message);
    return data ? rowToPrivacy(data) : DEFAULT_PRIVACY_SETTINGS;
  }

  async updatePrivacy(patch: Partial<PrivacySettings>, deviceId?: string) {
    if (!deviceId) return { ...DEFAULT_PRIVACY_SETTINGS, ...patch };
    const row = privacyToRow({ ...(await this.getPrivacy(deviceId)), ...patch }, deviceId);
    const { data, error } = await query(this.supabase.from("privacy_settings").upsert(row).select("*").maybeSingle());
    if (error) throw new Error(error.message);
    return rowToPrivacy(data ?? row);
  }

  async createShare(scanId: string, options: { includeRawTabs?: boolean; expiresInHours?: number }, deviceId?: string) {
    const scan = await this.getScan(scanId, deviceId);
    if (!scan) return null;
    const slug = generateId().replace(/-/g, "").slice(0, 12);
    const expiresAt = new Date(Date.now() + (options.expiresInHours ?? 72) * 60 * 60 * 1000).toISOString();
    const { error } = await query(
      this.supabase.from("share_links").insert({
        slug,
        scan_id: scanId,
        device_id: scan.deviceId ?? null,
        expires_at: expiresAt,
        include_raw_tabs: Boolean(options.includeRawTabs),
      })
    );
    if (error) throw new Error(error.message);
    await this.insertEvent("share_created", scanId, scan.deviceId, { includeRawTabs: Boolean(options.includeRawTabs) });
    return { slug, url: shareUrl(slug), expiresAt };
  }

  async getSharedScan(slug: string) {
    const { data, error } = await query(this.supabase.from("share_links").select("*").eq("slug", slug).maybeSingle());
    if (error) throw new Error(error.message);
    if (!data || data.revoked_at || (data.expires_at && new Date(data.expires_at).getTime() < Date.now())) return null;
    const scan = await this.getScan(data.scan_id);
    return scan ? publicScan(scan, Boolean(data.include_raw_tabs)) : null;
  }

  async exportData(deviceId?: string) {
    return {
      storage: this.mode,
      exportedAt: new Date().toISOString(),
      privacy: await this.getPrivacy(deviceId),
      scans: await this.listScans(deviceId, 1000),
      events: await this.getEvents(deviceId),
    };
  }

  async deleteData(deviceId?: string) {
    const scans = await this.listScans(deviceId, 1000);
    const ids = scans.map((scan) => scan.id);
    if (ids.length) {
      await query(this.supabase.from("share_links").delete().in("scan_id", ids));
      await query(this.supabase.from("scan_events").delete().in("scan_id", ids));
      await query(this.supabase.from("scans").delete().in("id", ids));
    }
    return { scans: ids.length, reflections: ids.length, shares: 0 };
  }

  private async insertEvent(type: ScanEvent["type"], scanId: string, deviceId: string | undefined, metadata: Record<string, unknown>) {
    const { error } = await query(
      this.supabase.from("scan_events").insert({
        scan_id: scanId,
        device_id: deviceId ?? null,
        event_type: type,
        metadata,
      })
    );
    if (error) throw new Error(error.message);
  }
}

function event(type: ScanEvent["type"], scanId: string, deviceId: string | undefined, metadata: Record<string, unknown>): ScanEvent {
  return { id: generateId(), scanId, deviceId, type, metadata, createdAt: new Date().toISOString() };
}

function ownsDevice(scan: Scan, deviceId?: string): boolean {
  return !deviceId || scan.deviceId === deviceId;
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
  if (row.analysis) return responseToScan(row.analysis, row.device_id ?? undefined);
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

function privacyToRow(settings: PrivacySettings, deviceId: string) {
  return {
    device_id: deviceId,
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

type DbRow = Record<string, any>;
type QueryResult = { data: any; error: { message: string } | null };

async function query(value: DbBuilder): Promise<QueryResult> {
  return value;
}
