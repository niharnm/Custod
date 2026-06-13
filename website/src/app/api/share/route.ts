import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getScanStore } from "@/lib/product/storage/scans";
import { shareRequestSchema, zodErrorMessage } from "@/lib/product/validation/schemas";
import { clientKey, rateLimit } from "@/lib/product/http-guards";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request, "share"), 20, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many share links created. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }
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
