import { NextResponse } from "next/server";
import { scanToMarkdown } from "@/lib/privacy";
import { getScanStore } from "@/lib/storage/scans";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const deviceId = request.headers.get("X-Custod-Device") ?? url.searchParams.get("deviceId") ?? undefined;
  const format = url.searchParams.get("format") ?? "json";
  const data = await getScanStore().exportData(deviceId);

  if (format === "md" || format === "markdown") {
    const body = [
      "# Custod data export",
      "",
      `Exported: ${data.exportedAt}`,
      `Storage: ${data.storage}`,
      "",
      ...data.scans.flatMap((scan) => [scanToMarkdown(scan), ""]),
    ].join("\n");
    return new Response(body, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"custod-export.md\"",
      },
    });
  }

  return NextResponse.json(data, {
    headers: { "Content-Disposition": "attachment; filename=\"custod-export.json\"" },
  });
}
