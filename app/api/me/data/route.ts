import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getScanStore } from "@/lib/storage/scans";
import { resolveOwner } from "@/lib/owner";
import { deleteDataRequestSchema, zodErrorMessage } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const owner = await resolveOwner(request);
    deleteDataRequestSchema.parse(await request.json().catch(() => ({})));
    const deleted = await getScanStore().deleteData(owner);
    return NextResponse.json({ deleted });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }
    return NextResponse.json({ error: "Data could not be deleted." }, { status: 500 });
  }
}
