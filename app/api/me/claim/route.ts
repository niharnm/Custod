import { NextResponse } from "next/server";
import { getScanStore } from "@/lib/storage/scans";
import { resolveOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

/**
 * One-time merge: after a user signs in, re-parent the anonymous device's rows
 * (created before login) onto their account. Requires an authenticated owner;
 * the deviceId comes from the request body. Idempotent — only claims rows that
 * aren't already owned by a user.
 */
export async function POST(request: Request) {
  const owner = await resolveOwner(request);
  if (!owner.userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { deviceId?: unknown };
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : undefined;
  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId." }, { status: 400 });
  }

  try {
    const result = await getScanStore().claimDevice(owner.userId, deviceId);
    return NextResponse.json({ ok: true, claimed: result });
  } catch {
    return NextResponse.json({ error: "Could not claim history." }, { status: 500 });
  }
}
