import type { BrowserTab } from "./collectTabs";

const PARKED_TABS_KEY = "custod-parked-tabs";

/** Domains treated as distractions, eligible for parking. */
export const DISTRACTION_DOMAINS = [
  "youtube.com",
  "tiktok.com",
  "instagram.com",
  "reddit.com",
  "x.com",
  "twitter.com",
  "netflix.com",
  "twitch.tv"
];

export type ParkedTab = {
  title: string;
  url: string;
  parkedAt: string;
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** True when a tab's domain is in the distraction list. */
export function isDistractionTab(tab: BrowserTab): boolean {
  const host = hostnameOf(tab.url);
  if (!host) return false;
  return DISTRACTION_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`)
  );
}

export async function getParkedTabs(): Promise<ParkedTab[]> {
  const stored = await chrome.storage.local.get(PARKED_TABS_KEY);
  const value = stored?.[PARKED_TABS_KEY];
  return Array.isArray(value) ? (value as ParkedTab[]) : [];
}

async function setParkedTabs(tabs: ParkedTab[]): Promise<void> {
  await chrome.storage.local.set({ [PARKED_TABS_KEY]: tabs });
}

/**
 * Park distraction tabs. Saves each tab's title and url BEFORE closing it, so
 * nothing is lost. Never touches the active tab or non-distraction tabs.
 * Returns the updated parked list.
 */
export async function parkDistractionTabs(tabs: BrowserTab[]): Promise<ParkedTab[]> {
  const toPark = tabs.filter((tab) => !tab.active && isDistractionTab(tab));

  // Preserve first: write to storage before closing anything.
  const parkedAt = new Date().toISOString();
  const additions: ParkedTab[] = toPark.map((tab) => ({
    title: tab.title,
    url: tab.url,
    parkedAt
  }));
  const existing = await getParkedTabs();
  const updated = [...additions, ...existing];
  await setParkedTabs(updated);

  // Only now close the tabs we already saved.
  const ids = toPark
    .map((tab) => tab.id)
    .filter((id): id is number => typeof id === "number");
  if (ids.length > 0) {
    await chrome.tabs.remove(ids);
  }

  return updated;
}

/** Reopen a parked tab in a new browser tab. Leaves the parked list intact. */
export async function reopenParkedTab(url: string): Promise<void> {
  await chrome.tabs.create({ url });
}

export async function clearParkedTabs(): Promise<void> {
  await setParkedTabs([]);
}
