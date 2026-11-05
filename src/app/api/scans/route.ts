import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { applyOptionalAiWording } from "@/lib/ai";
import { analyzeWithRules } from "@/lib/scoring";
import { getScanStore } from "@/lib/storage/scans";
import { requireOwner, unauthorized } from "@/lib/owner";
import { analyzeBurnoutRequestSchema, zodErrorMessage } from "@/lib/validation/schemas";
import { clientKey, getIdempotent, rateLimit, setIdempotent } from "@/lib/http-guards";
import type { AnalyzeBurnoutResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request, "scans"), 30, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many checks in a short time. Take a breath and try again shortly." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const owner = await requireOwner(request);
    if (!owner) return unauthorized();

    // Scope the idempotency cache to the caller so a guessed key cannot return another user's result.
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const cacheKey = idempotencyKey ? `scans:${owner.userId ?? owner.deviceId}:${idempotencyKey}` : null;
    if (cacheKey) {
      const cached = getIdempotent<AnalyzeBurnoutResponse>(cacheKey);
      if (cached) return NextResponse.json(cached);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = analyzeBurnoutRequestSchema.parse({
      ...body,
      deviceId: body?.deviceId ?? owner.deviceId ?? undefined,
    });

    if (parsed.tabs.length === 0) {
      return NextResponse.json({ error: "Submit at least one tab title or URL." }, { status: 400 });
    }

    const rules = analyzeWithRules(parsed);
    const analysis = await applyOptionalAiWording(parsed, rules);
    await getScanStore().createScan(analysis, owner);

    if (cacheKey) setIdempotent(cacheKey, analysis);

    return NextResponse.json(analysis);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Custod could not analyze this browser pattern.", code: "scan_failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 30)));
  const owner = await requireOwner(request);
  if (!owner) return unauthorized();
  // Signed-in users can narrow to a single device with ?device=<id>; omitted = all devices combined.
  const deviceFilter = owner.userId ? url.searchParams.get("device") ?? undefined : undefined;
  const scans = await getScanStore().listScans(owner, limit, deviceFilter);
  return NextResponse.json({ scans });
}
