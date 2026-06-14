import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { applyOptionalAiWording } from "@/lib/ai";
import { analyzeWithRules } from "@/lib/scoring";
import { getScanStore } from "@/lib/storage/scans";
import { resolveOwner } from "@/lib/owner";
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

    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (idempotencyKey) {
      const cached = getIdempotent<AnalyzeBurnoutResponse>(`scans:${idempotencyKey}`);
      if (cached) return NextResponse.json(cached);
    }

    const owner = await resolveOwner(request);
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

    if (idempotencyKey) setIdempotent(`scans:${idempotencyKey}`, analysis);

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
  const owner = await resolveOwner(request);
  // Signed-in users can narrow to a single device with ?device=<id>; omitted = all devices combined.
  const deviceFilter = owner.userId ? url.searchParams.get("device") ?? undefined : undefined;
  const scans = await getScanStore().listScans(owner, limit, deviceFilter);
  return NextResponse.json({ scans });
}
