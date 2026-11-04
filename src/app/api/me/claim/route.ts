import { NextResponse } from "next/server";
import { getScanStore } from "@/lib/storage/scans";
import { deviceIdFromRequest, resolveOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

/**
 * One-time merge: after a user signs in, re-parent the anonymous device's rows
 * (created before login) onto their account. Requires an authenticated owner.
 * The device being claimed is the one making this request (`X-Custod-Device`
 * header); a deviceId in the body or query string is never trusted, so a caller
 * cannot name an arbitrary device. Idempotent: only claims rows that aren't
 * already owned by a user.
 */
export async function POST(request: Request) {
  const owner = await resolveOwner(request);
  if (!owner.userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const deviceId = deviceIdFromRequest(request);
  if (!deviceId) {
    return NextResponse.json({ error: "Missing X-Custod-Device header." }, { status: 400 });
  }

  try {
    const result = await getScanStore().claimDevice(owner.userId, deviceId);
    return NextResponse.json({ ok: true, claimed: result });
  } catch {
    return NextResponse.json({ error: "Could not claim history." }, { status: 500 });
  }
}
