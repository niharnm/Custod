import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getScanStore } from "@/lib/storage/scans";
import { shareRequestSchema, zodErrorMessage } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const deviceId = request.headers.get("X-Custod-Device") ?? undefined;
    const parsed = shareRequestSchema.parse(await request.json().catch(() => ({})));
    const share = await getScanStore().createShare(parsed.scanId, parsed, deviceId);
    if (!share) return NextResponse.json({ error: "Scan not found." }, { status: 404 });
    return NextResponse.json(share);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }
    return NextResponse.json({ error: "Share link could not be created." }, { status: 500 });
  }
}
