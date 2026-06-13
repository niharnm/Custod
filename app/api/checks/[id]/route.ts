import { NextResponse } from "next/server";
import { checkToMarkdown } from "@/lib/markdown";
import { getCheck } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await getCheck(id);
  if (!check) {
    return NextResponse.json({ error: "Check not found." }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format");
  if (format === "md" || format === "markdown") {
    return new Response(checkToMarkdown(check), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="custod-${id}.md"`
      }
    });
  }

  return NextResponse.json({ check });
}
