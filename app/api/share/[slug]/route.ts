import { NextResponse } from "next/server";
import { getCheckBySlug } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const check = await getCheckBySlug(slug);
  if (!check) {
    return NextResponse.json({ error: "Shared check not found." }, { status: 404 });
  }
  return NextResponse.json({ check });
}
