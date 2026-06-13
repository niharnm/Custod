import { NextResponse } from "next/server";
import { getScanStore } from "@/lib/storage/scans";
import { getCheckBySlug } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const scan = await getScanStore().getSharedScan(slug);
  if (scan) return NextResponse.json({ scan });

  const check = await getCheckBySlug(slug);
  if (!check) {
    return NextResponse.json({ error: "Shared scan not found." }, { status: 404 });
  }
  return NextResponse.json({ check });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const deviceId = request.headers.get("X-Custod-Device") ?? undefined;
  const revoked = await getScanStore().revokeShare(slug, deviceId);
  if (!revoked) return NextResponse.json({ error: "Share link not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
