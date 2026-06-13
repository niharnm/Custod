import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getScanStore } from "@/lib/storage/scans";
import { privacySettingsPatchSchema, zodErrorMessage } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const deviceId = request.headers.get("X-Custod-Device") ?? new URL(request.url).searchParams.get("deviceId") ?? undefined;
  const privacy = await getScanStore().getPrivacy(deviceId);
  return NextResponse.json({ privacy });
}

export async function PATCH(request: Request) {
  try {
    const deviceId = request.headers.get("X-Custod-Device") ?? new URL(request.url).searchParams.get("deviceId") ?? undefined;
    const patch = privacySettingsPatchSchema.parse(await request.json().catch(() => ({})));
    const privacy = await getScanStore().updatePrivacy(patch, deviceId);
    return NextResponse.json({ privacy });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }
    return NextResponse.json({ error: "Privacy settings could not be updated." }, { status: 500 });
  }
}
