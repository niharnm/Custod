import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getScanStore } from "@/lib/storage/scans";
import { requireOwner, unauthorized } from "@/lib/owner";
import { shareRequestSchema, zodErrorMessage } from "@/lib/validation/schemas";
import { clientKey, rateLimit } from "@/lib/http-guards";

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
    const owner = await requireOwner(request);
    if (!owner) return unauthorized();
    const parsed = shareRequestSchema.parse(await request.json().catch(() => ({})));
    const share = await getScanStore().createShare(parsed.scanId, parsed, owner);
    if (!share) return NextResponse.json({ error: "Scan not found." }, { status: 404 });
    return NextResponse.json(share);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }
    return NextResponse.json({ error: "Share link could not be created." }, { status: 500 });
  }
}
