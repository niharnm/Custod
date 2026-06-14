import { NextResponse } from "next/server";
import { getScanStore } from "@/lib/storage/scans";
import { resolveOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

/**
 * List the devices signed into the current account (extension, macOS, iOS, web).
 * Powers the dashboard's "all devices vs. one device" picker. Requires sign-in;
 * anonymous callers get an empty list.
 */
export async function GET(request: Request) {
  const owner = await resolveOwner(request);
  if (!owner.userId) return NextResponse.json({ devices: [] });
  const devices = await getScanStore().listDevices(owner.userId);
  return NextResponse.json({ devices });
}
