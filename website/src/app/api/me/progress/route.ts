import { NextResponse } from "next/server";
import { deriveProgress } from "@/lib/product/gamification";
import { getScanStore } from "@/lib/product/storage/scans";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const deviceId = request.headers.get("X-Custod-Device") ?? new URL(request.url).searchParams.get("deviceId") ?? undefined;
  const store = getScanStore();
  const scans = await store.listScans(deviceId, 500);
  const events = await store.getEvents(deviceId);
  return NextResponse.json(deriveProgress(scans, events));
}
