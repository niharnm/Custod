import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getScanStore } from "@/lib/storage/scans";
import { resetCompleteRequestSchema, zodErrorMessage } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deviceId = request.headers.get("X-Custod-Device") ?? undefined;
    const parsed = resetCompleteRequestSchema.parse(await request.json().catch(() => ({})));
    const progress = await getScanStore().completeReset(id, parsed.completedSteps, deviceId);
    if (!progress) return NextResponse.json({ error: "Scan not found." }, { status: 404 });
    return NextResponse.json({ ok: true, progress });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }
    return NextResponse.json({ error: "Reset completion could not be saved." }, { status: 500 });
  }
}
