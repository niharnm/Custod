import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { applyOptionalAiWording } from "@/lib/ai";
import { analyzeWithRules } from "@/lib/scoring";
import { getScanStore } from "@/lib/storage/scans";
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

    const body = await request.json().catch(() => ({}));
    const parsed = analyzeBurnoutRequestSchema.parse({
      ...body,
      deviceId: body?.deviceId ?? request.headers.get("X-Custod-Device") ?? undefined,
    });

    if (parsed.tabs.length === 0) {
      return NextResponse.json({ error: "Submit at least one tab title or URL." }, { status: 400 });
    }

    const rules = analyzeWithRules(parsed);
    const analysis = await applyOptionalAiWording(parsed, rules);
    await getScanStore().createScan(analysis, parsed.deviceId);

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
  const deviceId = request.headers.get("X-Custod-Device") ?? url.searchParams.get("deviceId") ?? undefined;
  const scans = await getScanStore().listScans(deviceId, limit);
  return NextResponse.json({ scans });
}
