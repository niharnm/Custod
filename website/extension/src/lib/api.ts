import { WEB_APP_URL } from "./config";
import type { BrowserTab } from "./collectTabs";

type AnalyzeResponse = {
  check?: {
    id: string;
  };
  error?: string;
};

export async function analyzeBurnout(input: {
  tabs: BrowserTab[];
  mood: {
    energy: number;
    stress: number;
    timePressure: "none" | "some" | "high";
    reflection?: string;
  };
}) {
  const response = await fetch(`${WEB_APP_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const data = (await response.json()) as AnalyzeResponse;
  if (!response.ok || !data.check?.id) {
    throw new Error(data.error || "Custod could not create a burnout check.");
  }
  return data.check.id;
}

export function checkUrl(id: string) {
  return `${WEB_APP_URL}/check/${id}`;
}
