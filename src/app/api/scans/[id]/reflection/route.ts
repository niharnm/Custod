import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getScanStore } from "@/lib/storage/scans";
import { requireOwner, unauthorized } from "@/lib/owner";
import { reflectionRequestSchema, zodErrorMessage } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const owner = await requireOwner(request);
    if (!owner) return unauthorized();
    const parsed = reflectionRequestSchema.parse(await request.json().catch(() => ({})));
    const reflection = await getScanStore().addReflection(id, parsed, owner);
    if (!reflection) return NextResponse.json({ error: "Scan not found." }, { status: 404 });
    return NextResponse.json({ reflection });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }
    return NextResponse.json({ error: "Reflection could not be saved." }, { status: 500 });
  }
}
