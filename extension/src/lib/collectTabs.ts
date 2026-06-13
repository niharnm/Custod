export type BrowserTab = {
  id?: number;
  title: string;
  url: string;
  active: boolean;
  favIconUrl?: string;
};

export async function collectTabs(): Promise<BrowserTab[]> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs
    .map((tab) => ({
      id: tab.id,
      title: tab.title || tab.url || "Untitled tab",
      url: tab.url || "",
      active: Boolean(tab.active),
      favIconUrl: tab.favIconUrl
    }))
    .filter((tab) => tab.url.startsWith("http://") || tab.url.startsWith("https://"));
}
