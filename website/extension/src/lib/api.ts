import { WEB_APP_URL } from "./config";
import type { BrowserTab } from "./collectTabs";
import { ensureDeviceRegistered, getDeviceId } from "./device";

export type MoodCheckInValue = "calm" | "stressed" | "overwhelmed" | "numb" | "skip";

type ScanResponse = {
  scanId?: string;
  error?: string;
};

export async function createScan(input: {
  tabs: BrowserTab[];
  moodCheckIn: MoodCheckInValue;
  goal?: string;
  timeRemaining?: string;
}) {
  await ensureDeviceRegistered(WEB_APP_URL);
  const deviceId = await getDeviceId();
  const response = await fetch(`${WEB_APP_URL}/api/scans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Custod-Device": deviceId,
    },
    body: JSON.stringify({
      tabs: input.tabs,
      moodCheckIn: input.moodCheckIn,
      goal: input.goal,
      timeRemaining: input.timeRemaining,
      deviceId,
    }),
  });
  const data = (await response.json()) as ScanResponse;
  if (!response.ok || !data.scanId) {
    throw new Error(data.error || "Custod could not create a scan.");
  }
  return data.scanId;
}

export function scanUrl(id: string) {
  return `${WEB_APP_URL}/scan/${id}`;
}
