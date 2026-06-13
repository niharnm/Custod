const DEVICE_KEY = "custod:deviceId";

export async function getDeviceId(): Promise<string> {
  const stored = await chrome.storage.local.get(DEVICE_KEY);
  let id = stored[DEVICE_KEY] as string | undefined;
  if (!id) {
    id = crypto.randomUUID();
    await chrome.storage.local.set({ [DEVICE_KEY]: id });
  }
  return id;
}

export async function ensureDeviceRegistered(webAppUrl: string): Promise<void> {
  const id = await getDeviceId();
  try {
    await fetch(`${webAppUrl}/api/devices/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Custod-Device": id,
      },
      body: JSON.stringify({ deviceId: id, platform: "chrome", label: "Chrome extension" }),
    });
  } catch {
    /* best-effort */
  }
}
