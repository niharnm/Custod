import { NextResponse } from "next/server";
import { deriveProgress } from "@/lib/gamification";
import { getScanStore } from "@/lib/storage/scans";
import { requireOwner, unauthorized } from "@/lib/owner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const owner = await requireOwner(request);
  if (!owner) return unauthorized();
  const store = getScanStore();
  const scans = await store.listScans(owner, 500);
  const events = await store.getEvents(owner);
  return NextResponse.json(deriveProgress(scans, events));
}
