import { NextResponse } from "next/server";
import { ensureShareSlug } from "@/lib/storage";
import { shareUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const slug = await ensureShareSlug(id);
  if (!slug) {
    return NextResponse.json({ error: "Check not found." }, { status: 404 });
  }
  return NextResponse.json({ slug, url: shareUrl(slug) });
}
