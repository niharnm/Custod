import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getScanStore } from "@/lib/storage/scans";
import { deleteDataRequestSchema, zodErrorMessage } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const deviceId = request.headers.get("X-Custod-Device") ?? new URL(request.url).searchParams.get("deviceId") ?? undefined;
    deleteDataRequestSchema.parse(await request.json().catch(() => ({})));
    const deleted = await getScanStore().deleteData(deviceId);
    return NextResponse.json({ deleted });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }
    return NextResponse.json({ error: "Data could not be deleted." }, { status: 500 });
  }
}
