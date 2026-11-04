"use client";

// Anonymous, device-scoped identity for the new `scans` API surface.
// No account, no fingerprinting, no IP storage — just a random id kept in
// localStorage so a person's own history follows them on this browser.

const DEVICE_KEY = "custod-device-id";

let registered = false;

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      window.crypto?.randomUUID?.() ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function clearDeviceId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEVICE_KEY);
  registered = false;
}

/** fetch() wrapper that attaches the anonymous device header on every call. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const id = getDeviceId();
  if (id) headers.set("X-Custod-Device", id);
  return fetch(input, { ...init, headers });
}

/**
 * After signing in, hand the current anonymous device id to the server so any
 * pre-login scans get re-parented to the new account. Same-origin fetch carries
 * the session cookie, so the server knows which user is claiming. Best-effort.
 */
export async function claimAnonymousHistory(): Promise<void> {
  if (typeof window === "undefined") return;
  const id = getDeviceId();
  if (!id) return;
  try {
    await fetch("/api/me/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Custod-Device": id },
    });
  } catch {
    // Non-fatal: history claim can be retried on the next sign-in.
  }
}

/** Register the device once per session so server-side rows can be scoped to it. */
export async function ensureDeviceRegistered(): Promise<void> {
  if (registered || typeof window === "undefined") return;
  const id = getDeviceId();
  if (!id) return;
  registered = true;
  try {
    await fetch("/api/devices/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Custod-Device": id },
      body: JSON.stringify({ deviceId: id, platform: "web", label: "Web browser" }),
    });
  } catch {
    // Registration is best-effort; scans still work device-scoped without it.
    registered = false;
  }
}
