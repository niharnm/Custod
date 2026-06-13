import { NextResponse } from "next/server";
import { scanToMarkdown } from "@/lib/product/privacy";
import { getScanStore } from "@/lib/product/storage/scans";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const deviceId = request.headers.get("X-Custod-Device") ?? url.searchParams.get("deviceId") ?? undefined;
  const scan = await getScanStore().getScan(id, deviceId);
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
