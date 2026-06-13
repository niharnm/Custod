import { NextResponse } from "next/server";
import { analyzeBurnout, sanitizeMood, sanitizeTabs } from "@/lib/analyzer";
import { createCheck } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const tabs = sanitizeTabs(body?.tabs);
    const mood = sanitizeMood(body?.mood);

    if (tabs.length === 0) {
      return NextResponse.json(
        { error: "Submit at least one tab title or URL." },
        { status: 400 }
      );
    }

    const analysis = analyzeBurnout({ tabs, mood });
    const record = await createCheck({ rawTabs: tabs, mood, analysis });

    return NextResponse.json({ check: record });
  } catch (error) {
    console.error("[custod] analyze failed:", error);
    return NextResponse.json(
      { error: "Custod could not analyze this browser pattern." },
      { status: 500 }
    );
  }
}
