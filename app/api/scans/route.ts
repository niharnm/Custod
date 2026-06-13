import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { applyOptionalAiWording } from "@/lib/ai";
import { analyzeWithRules } from "@/lib/scoring";
import { getScanStore } from "@/lib/storage/scans";
import { analyzeBurnoutRequestSchema, zodErrorMessage } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
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
