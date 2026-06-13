import type {
  AnalyzeBurnoutResponse,
  BrowserTab,
  PrivacySettings,
  Scan,
  TabGroup,
} from "@/lib/types";

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  storeRawTabs: false,
  retentionDays: 30,
  syncEnabled: false,
  shareDefaultsIncludeRaw: false,
};

export function extractDomain(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  }
}

export function stripUrlForStorage(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const url = new URL(rawUrl);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return rawUrl.split("?")[0].split("#")[0].slice(0, 2048);
  }
}

export function sanitizeTabsForAnalysis(tabs: BrowserTab[]): BrowserTab[] {
  return tabs
    .map((tab) => ({
      id: tab.id,
      title: cleanText(tab.title, 300) || cleanText(tab.url, 300) || "Untitled tab",
      url: stripUrlForStorage(cleanText(tab.url, 2048)),
      active: Boolean(tab.active),
      favIconUrl: tab.favIconUrl ? stripUrlForStorage(cleanText(tab.favIconUrl, 2048)) : undefined,
    }))
    .filter((tab) => tab.title || tab.url)
    .slice(0, 200);
}

export function aggregateTabs(tabs: BrowserTab[]) {
  const domains = tabs.map((tab) => extractDomain(tab.url)).filter(Boolean);
  return {
    tabCount: tabs.length,
    domainCount: new Set(domains).size,
    sampleDomains: Array.from(new Set(domains)).slice(0, 10),
  };
}

export function shareSafeTabGroups(groups: TabGroup[]): TabGroup[] {
  return groups.map((group) => ({
    ...group,
    tabs: group.tabs.map((tab) => ({
      title: extractDomain(tab.url) || "Hidden tab",
      url: extractDomain(tab.url),
      active: tab.active,
    })),
  }));
}

export function publicScan(scan: Scan, includeRawTabs = false): Scan {
  return {
    ...scan,
    deviceId: undefined,
    userId: undefined,
    reflection: undefined,
    tabGroups:
      scan.tabGroups && !includeRawTabs ? shareSafeTabGroups(scan.tabGroups) : scan.tabGroups,
  };
}

export function scanToMarkdown(scan: Scan): string {
  const lines = [
    "# Custod scan",
    "",
    `Created: ${scan.createdAt}`,
    `Status: ${scan.statusLabel} (${scan.score}/100)`,
    `Main pattern: ${scan.mainPattern}`,
    "",
    "## Explanation",
    "",
    scan.patternExplanation ?? scan.oneSentenceExplanation ?? "No explanation stored.",
    "",
    "## Risk breakdown",
    "",
    `- Tab overload: ${scan.riskBreakdown.tabOverload}`,
    `- Context switching: ${scan.riskBreakdown.contextSwitching}`,
    `- Distraction pull: ${scan.riskBreakdown.distractionPull}`,
    `- Goal fragmentation: ${scan.riskBreakdown.goalFragmentation}`,
    `- Time pressure: ${scan.riskBreakdown.timePressure}`,
    `- Recovery signal: ${scan.riskBreakdown.recoverySignal}`,
    "",
    "## Reset plan",
    "",
    scan.resetPlan
      ? [
          `- Immediate: ${scan.resetPlan.immediateAction}`,
          `- 3-minute reset: ${scan.resetPlan.threeMinuteReset}`,
          `- 20-minute block: ${scan.resetPlan.twentyMinuteFocusBlock}`,
        ].join("\n")
      : "No reset plan stored.",
    "",
    "## Privacy",
    "",
    "Export contains only data stored for this device. Custod does not collect page contents, screenshots, cookies, credentials, messages, grades, keystrokes, or full browsing history.",
    "",
  ];
  return lines.join("\n");
}

export function responseToScan(
  response: AnalyzeBurnoutResponse,
  owner?: { userId?: string; deviceId?: string }
): Scan {
  return {
    id: response.scanId,
    deviceId: owner?.deviceId,
    userId: owner?.userId,
    createdAt: response.createdAt,
    status: response.status,
    score: response.score,
    statusLabel: response.statusLabel,
    mainPattern: response.mainPattern,
    tabCount: response.tabGroups.reduce((sum, group) => sum + group.tabs.length, 0),
    domainCount: new Set(
      response.tabGroups.flatMap((group) => group.tabs.map((tab) => extractDomain(tab.url)).filter(Boolean))
    ).size,
    goal: response.goal,
    moodCheckIn: response.moodCheckIn as Scan["moodCheckIn"],
    timeRemaining: response.timeRemaining,
    riskBreakdown: response.riskBreakdown,
    oneSentenceExplanation: response.oneSentenceExplanation,
    patternExplanation: response.patternExplanation,
    resetPlan: response.resetPlan,
    tabGroups: response.tabGroups,
    checkEngineTimeline: response.checkEngineTimeline,
    shareSummary: response.shareSummary,
    aiReasoning: response.aiReasoning,
  };
}

function cleanText(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}
