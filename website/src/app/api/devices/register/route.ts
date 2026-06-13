import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getScanStore } from "@/lib/product/storage/scans";
import { registerDeviceRequestSchema, zodErrorMessage } from "@/lib/product/validation/schemas";
import { clientKey, rateLimit } from "@/lib/product/http-guards";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request, "register"), 30, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }
    const body = await request.json().catch(() => ({}));
    const parsed = registerDeviceRequestSchema.parse(body);
    const device = await getScanStore().registerDevice(parsed);
    return NextResponse.json({ device });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }
    return NextResponse.json({ error: "Device could not be registered." }, { status: 500 });
  }
}
