import { NextResponse } from "next/server";
import { scanToMarkdown } from "@/lib/privacy";
import { getScanStore } from "@/lib/storage/scans";
import { resolveOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const owner = await resolveOwner(request);
  const scan = await getScanStore().getScan(id, owner);
  if (!scan) return NextResponse.json({ error: "Scan not found." }, { status: 404 });

  const format = url.searchParams.get("format");
  if (format === "md" || format === "markdown") {
    return new Response(scanToMarkdown(scan), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="custod-scan-${id}.md"`,
      },
    });
  }

  return NextResponse.json({ scan });
}
