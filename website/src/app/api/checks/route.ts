import { NextResponse } from "next/server";
import { listChecks } from "@/lib/product/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = await listChecks(30);
  return NextResponse.json({ checks });
}
