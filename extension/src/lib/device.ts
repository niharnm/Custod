const DEVICE_ID_KEY = "custod-device-id";

/**
 * Returns a stable anonymous device id, generating and persisting one in
 * chrome.storage.local on first use. This id is sent in the X-Custod-Device
 * header so the web app can group scans without any account or PII.
 */
export async function getDeviceId(): Promise<string> {
  const stored = await chrome.storage.local.get(DEVICE_ID_KEY);
  const existing = stored?.[DEVICE_ID_KEY];
  if (typeof existing === "string" && existing.length > 0) {
    return existing;
  }
  const deviceId = crypto.randomUUID();
  await chrome.storage.local.set({ [DEVICE_ID_KEY]: deviceId });
  return deviceId;
}
