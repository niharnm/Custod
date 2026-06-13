import { WEB_APP_URL } from "./config";
import { getDeviceId } from "./device";
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

export type ScanStatus = "green" | "yellow" | "red";

export type ScanResult = {
  scanId: string;
  status: ScanStatus;
  score: number;
  mainPattern: string;
  oneSentenceExplanation: string;
  statusLabel?: string;
};

type ScanResponse = Partial<ScanResult> & { error?: string };

/**
 * Standalone scan: POST the current window's tabs straight to the web app's
 * scan endpoint, identified only by the anonymous device id. Titles and URLs
 * only, no page contents.
 */
export async function runScan(tabs: BrowserTab[]): Promise<ScanResult> {
  const deviceId = await getDeviceId();
  const response = await fetch(`${WEB_APP_URL}/api/scans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Custod-Device": deviceId
    },
    body: JSON.stringify({ tabs })
  });
  const data = (await response.json().catch(() => ({}))) as ScanResponse;
  if (!response.ok || !data.scanId || !data.status) {
    throw new Error(data.error || "Custod could not run this scan.");
  }
  return {
    scanId: data.scanId,
    status: data.status,
    score: typeof data.score === "number" ? data.score : 0,
    mainPattern: data.mainPattern || "",
    oneSentenceExplanation: data.oneSentenceExplanation || "",
    statusLabel: data.statusLabel
  };
}

export function scanUrl(scanId: string) {
  return `${WEB_APP_URL}/scan/${scanId}`;
}
