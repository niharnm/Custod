import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getScanStore } from "@/lib/storage/scans";
import { resolveOwner } from "@/lib/owner";
import { privacySettingsPatchSchema, zodErrorMessage } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const owner = await resolveOwner(request);
  const privacy = await getScanStore().getPrivacy(owner);
  return NextResponse.json({ privacy });
}

export async function PATCH(request: Request) {
  try {
    const owner = await resolveOwner(request);
    const patch = privacySettingsPatchSchema.parse(await request.json().catch(() => ({})));
    const privacy = await getScanStore().updatePrivacy(patch, owner);
    return NextResponse.json({ privacy });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }
    return NextResponse.json({ error: "Privacy settings could not be updated." }, { status: 500 });
  }
}
