import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn(async () => null) }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminIfConfigured: () => null }));

import { getCurrentUser } from "@/lib/auth";
import { deviceIdFromRequest, resolveOwner } from "@/lib/owner";
import { OwnerRequiredError, getScanStore, ownerEq } from "@/lib/storage/scans";
import { analyzeWithRules } from "@/lib/scoring";

const DEVICE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DEVICE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const call = (path: string, init: RequestInit = {}) => new Request(`http://localhost${path}`, init);

async function seed(deviceId: string) {
  const analysis = analyzeWithRules({ tabs: [{ title: "Docs", url: "https://example.com/a" }] } as never);
  return getScanStore().createScan(analysis, { deviceId });
}

beforeEach(() => {
  vi.mocked(getCurrentUser).mockResolvedValue(null as never);
});

describe("owner resolution", () => {
  it("ignores the deviceId query parameter", async () => {
    expect(await resolveOwner(call(`/api/scans?deviceId=${DEVICE_A}`))).toEqual({ deviceId: undefined });
  });
  it("reads a well-formed device header only", () => {
    expect(deviceIdFromRequest(call("/", { headers: { "X-Custod-Device": DEVICE_A } }))).toBe(DEVICE_A);
    expect(deviceIdFromRequest(call("/", { headers: { "X-Custod-Device": "x y;drop" } }))).toBeUndefined();
  });
});

describe("storage fails closed without an owner", () => {
  it("ownerEq throws instead of returning an unfiltered query", () => {
    const builder = { eq: vi.fn() } as never;
    expect(() => ownerEq(builder, {})).toThrow(OwnerRequiredError);
    expect(() => ownerEq(builder, undefined)).toThrow(OwnerRequiredError);
  });
  it("owner-scoped store methods reject an empty owner", async () => {
    await seed(DEVICE_A);
    const store = getScanStore();
    for (const owner of [undefined, {}, { deviceId: undefined }]) {
      await expect(store.listScans(owner)).rejects.toThrow(OwnerRequiredError);
      await expect(store.exportData(owner)).rejects.toThrow(OwnerRequiredError);
      await expect(store.getEvents(owner)).rejects.toThrow(OwnerRequiredError);
      await expect(store.deleteData(owner)).rejects.toThrow(OwnerRequiredError);
      await expect(store.revokeShare("any", owner)).rejects.toThrow(OwnerRequiredError);
    }
    expect((await store.listScans({ deviceId: DEVICE_A })).length).toBeGreaterThan(0);
  });
  it("one device cannot see or delete another device's data", async () => {
    await seed(DEVICE_A);
    const store = getScanStore();
    expect(await store.listScans({ deviceId: DEVICE_B })).toEqual([]);
    expect((await store.deleteData({ deviceId: DEVICE_B })).scans).toBe(0);
    expect((await store.listScans({ deviceId: DEVICE_A })).length).toBeGreaterThan(0);
  });
});

describe("routes reject requests with no identity (401)", () => {
  it("GET /api/export, /api/scans, /api/trends, /api/me/*", async () => {
    await seed(DEVICE_A);
    const exp = await import("@/app/api/export/route");
    const scans = await import("@/app/api/scans/route");
    const trends = await import("@/app/api/trends/route");
    const progress = await import("@/app/api/me/progress/route");
    const privacy = await import("@/app/api/me/privacy/route");
    const data = await import("@/app/api/me/data/route");
    const share = await import("@/app/api/share/[slug]/route");
    const results = await Promise.all([
      exp.GET(call("/api/export")),
      scans.GET(call("/api/scans")),
      scans.GET(call(`/api/scans?deviceId=${DEVICE_A}`)),
      trends.GET(call("/api/trends")),
      progress.GET(call("/api/me/progress")),
      privacy.GET(call("/api/me/privacy")),
      data.DELETE(call("/api/me/data", { method: "DELETE", body: "{}" })),
      share.DELETE(call("/api/share/x", { method: "DELETE" }), { params: Promise.resolve({ slug: "x" }) }),
    ]);
    for (const res of results) expect(res.status).toBe(401);
    // and nothing was deleted
    expect((await getScanStore().listScans({ deviceId: DEVICE_A })).length).toBeGreaterThan(0);
  });
  it("still serves a request that carries its own device header", async () => {
    const scans = await import("@/app/api/scans/route");
    const res = await scans.GET(call("/api/scans", { headers: { "X-Custod-Device": DEVICE_A } }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/me/claim", () => {
  it("requires sign-in", async () => {
    const claim = await import("@/app/api/me/claim/route");
    const res = await claim.POST(call("/api/me/claim", { method: "POST", headers: { "X-Custod-Device": DEVICE_A } }));
    expect(res.status).toBe(401);
  });
  it("ignores a body/query deviceId and claims only the header device", async () => {
    await seed(DEVICE_A);
    await seed(DEVICE_B);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as never);
    const claim = await import("@/app/api/me/claim/route");

    const noHeader = await claim.POST(
      call(`/api/me/claim?deviceId=${DEVICE_A}`, { method: "POST", body: JSON.stringify({ deviceId: DEVICE_A }) })
    );
    expect(noHeader.status).toBe(400);
    expect(await getScanStore().listScans({ userId: "user-1" })).toEqual([]);

    const ok = await claim.POST(
      call("/api/me/claim", {
        method: "POST",
        headers: { "X-Custod-Device": DEVICE_B },
        body: JSON.stringify({ deviceId: DEVICE_A }),
      })
    );
    expect(ok.status).toBe(200);
    const mine = await getScanStore().listScans({ userId: "user-1" });
    expect(mine.every((s) => s.deviceId === DEVICE_B)).toBe(true);
    expect(mine.length).toBeGreaterThan(0);
  });
});
