import { NextResponse } from "next/server";
import { getScanStore } from "@/lib/storage/scans";
import { resolveOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const owner = await resolveOwner(request);
  const scans = await getScanStore().listScans(owner, 500);
  const points = scans
    .slice()
    .reverse()
    .map((scan) => ({
      date: scan.createdAt,
      status: scan.status,
      score: scan.score,
    }));
  const patternCounts = new Map<string, number>();
  for (const scan of scans) patternCounts.set(scan.mainPattern, (patternCounts.get(scan.mainPattern) ?? 0) + 1);
  const commonTriggers = Array.from(patternCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([pattern, count]) => ({ pattern, count }));

  return NextResponse.json({
    averageScore: scans.length ? Math.round(scans.reduce((sum, scan) => sum + scan.score, 0) / scans.length) : 0,
    mostCommonPattern: commonTriggers[0]?.pattern ?? "No scans yet",
    scoreChangesOverTime: points,
    commonTriggers,
    recoveryStreak: consecutiveGreenDays(scans),
    points,
    summary: {
      greenDays: scans.filter((scan) => scan.status === "green").length,
      yellowDays: scans.filter((scan) => scan.status === "yellow").length,
      redDays: scans.filter((scan) => scan.status === "red").length,
      topPattern: commonTriggers[0]?.pattern ?? "No scans yet",
    },
  });
}

function consecutiveGreenDays(scans: Awaited<ReturnType<ReturnType<typeof getScanStore>["listScans"]>>) {
  let streak = 0;
  for (const scan of scans) {
    if (scan.status !== "green") break;
    streak += 1;
  }
  return streak;
}
