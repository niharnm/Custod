import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getScanStore } from "@/lib/storage/scans";
import { requireOwner, unauthorized } from "@/lib/owner";
import { privacySettingsPatchSchema, zodErrorMessage } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const owner = await requireOwner(request);
  if (!owner) return unauthorized();
  const privacy = await getScanStore().getPrivacy(owner);
  return NextResponse.json({ privacy });
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireOwner(request);
    if (!owner) return unauthorized();
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
