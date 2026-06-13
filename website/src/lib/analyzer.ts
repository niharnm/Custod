import type {
  AnalyzeRequest,
  BrowserTab,
  BurnoutAnalysis,
  EvidenceGroup,
  MoodCheckIn,
  ResetStep,
  RiskLevel,
  RiskSignal
} from "@/lib/types";
import { cleanDomain } from "@/lib/utils";

const DISTRACTION_DOMAINS = [
  "youtube.com",
  "tiktok.com",
  "instagram.com",
  "reddit.com",
  "x.com",
  "twitter.com",
  "netflix.com",
  "twitch.tv",
  "spotify.com"
];

const SCHOOL_TERMS = [
  "canvas",
  "blackboard",
  "schoology",
  "classroom",
  "assignment",
  "homework",
  "exam",
  "quiz",
  "gradescope",
  "turnitin",
  "deadline",
  "submit"
];

const RESEARCH_TERMS = [
  "google.com/search",
  "wikipedia",
  "scholar.google",
  "paper",
  "article",
  "research",
  "arxiv",
  "docs",
  "documentation",
  "tutorial",
  "how to"
];

const HELP_TERMS = [
  "chatgpt",
  "claude",
  "perplexity",
  "stackoverflow",
  "stack overflow",
  "github",
  "copilot"
];

const COMMUNICATION_TERMS = [
  "gmail",
  "mail.google",
  "outlook",
  "discord",
  "slack",
  "teams.microsoft",
  "messages"
];

function textFor(tab: BrowserTab): string {
  return `${tab.title} ${tab.url}`.toLowerCase();
}

function containsAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function categorize(tab: BrowserTab): string {
  const text = textFor(tab);
  const domain = cleanDomain(tab.url);

  if (containsAny(text, SCHOOL_TERMS)) return "Deadline and class surfaces";
  if (containsAny(text, HELP_TERMS)) return "Help seeking";
  if (containsAny(text, RESEARCH_TERMS)) return "Research spiral";
  if (containsAny(text, COMMUNICATION_TERMS)) return "Communication pressure";
  if (DISTRACTION_DOMAINS.some((item) => domain.includes(item))) {
    return "Distraction loop";
  }
  if (containsAny(text, ["calendar", "notion", "todo", "trello", "drive.google"])) {
    return "Planning and admin";
  }
  if (containsAny(text, ["music", "meditation", "breathing", "walk", "sleep"])) {
    return "Recovery cues";
  }
  return "Other context";
}

function groupTabs(tabs: BrowserTab[]): EvidenceGroup[] {
  const buckets = new Map<string, BrowserTab[]>();
  for (const tab of tabs) {
    const key = categorize(tab);
    buckets.set(key, [...(buckets.get(key) ?? []), tab]);
  }

  return Array.from(buckets.entries()).map(([name, groupTabs]) => ({
    name,
    tabs: groupTabs,
    explanation: groupExplanation(name, groupTabs.length)
  }));
}

function groupExplanation(name: string, count: number): string {
  const explanations: Record<string, string> = {
    "Deadline and class surfaces":
      "Class portals, submissions, deadlines, or grading pages signal direct academic pressure.",
    "Help seeking":
      "Repeated help or coding-assistant surfaces can mean the student is blocked, not just productive.",
    "Research spiral":
      "Search, docs, tutorials, and articles can become avoidance when too many stay open.",
    "Communication pressure":
      "Inbox and chat surfaces add interruption load while the student is trying to finish.",
    "Distraction loop":
      "Entertainment or social tabs can indicate a drift loop, especially when mixed with deadline tabs.",
    "Planning and admin":
      "Planning tools can help, but too much planning can fragment attention.",
    "Recovery cues":
      "Recovery tabs are useful signals that the student may already be trying to self-regulate.",
    "Other context":
      "Unclassified tabs still contribute to total load and context switching."
  };
  return `${explanations[name] ?? "Related browser context."} ${count} tab${count === 1 ? "" : "s"} found.`;
}

function level(score: number): RiskLevel {
  if (score >= 18) return "high";
  if (score >= 9) return "medium";
  return "low";
}

function cap(score: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(score)));
}

function domains(tabs: BrowserTab[]): Set<string> {
  return new Set(tabs.map((tab) => cleanDomain(tab.url)).filter(Boolean));
}

function riskSignals(tabs: BrowserTab[], groups: EvidenceGroup[], mood?: MoodCheckIn): RiskSignal[] {
  const totalTabs = tabs.length;
  const domainCount = domains(tabs).size;
  const distractionTabs = groups.find((group) => group.name === "Distraction loop")?.tabs ?? [];
  const researchTabs = groups.find((group) => group.name === "Research spiral")?.tabs ?? [];
  const deadlineTabs = groups.find((group) => group.name === "Deadline and class surfaces")?.tabs ?? [];
  const communicationTabs = groups.find((group) => group.name === "Communication pressure")?.tabs ?? [];
  const activeGroups = groups.filter((group) => group.tabs.length > 0).length;

  const signals: RiskSignal[] = [];

  const overload = cap((totalTabs - 6) * 1.6, 24);
  signals.push({
    id: "tab-overload",
    label: "Tab overload",
    level: level(overload),
    score: overload,
    explanation:
      totalTabs > 12
        ? "The browser is carrying more open loops than a student can comfortably hold in working memory."
        : "The open-tab count is still manageable.",
    evidence: [`${totalTabs} submitted tab${totalTabs === 1 ? "" : "s"}`]
  });

  const switching = cap(domainCount * 1.2 + activeGroups * 2.2, 22);
  signals.push({
    id: "context-switching",
    label: "Context switching",
    level: level(switching),
    score: switching,
    explanation:
      "More domains and more tab categories means the student is switching mental modes more often.",
    evidence: [`${domainCount} domains`, `${activeGroups} evidence groups`]
  });

  const distraction = cap(distractionTabs.length * 4 + (deadlineTabs.length ? 5 : 0), 22);
  signals.push({
    id: "distraction-loop",
    label: "Distraction loop",
    level: level(distraction),
    score: distraction,
    explanation:
      "Distraction tabs mixed with school or deadline tabs are an early sign of avoidance under pressure.",
    evidence: [`${distractionTabs.length} distraction tab${distractionTabs.length === 1 ? "" : "s"}`]
  });

  const fragmentation = cap(researchTabs.length * 2.2 + communicationTabs.length * 2 + activeGroups, 20);
  signals.push({
    id: "goal-fragmentation",
    label: "Goal fragmentation",
    level: level(fragmentation),
    score: fragmentation,
    explanation:
      "Research, messaging, and admin surfaces compete for attention when they stay open together.",
    evidence: [
      `${researchTabs.length} research tab${researchTabs.length === 1 ? "" : "s"}`,
      `${communicationTabs.length} communication tab${communicationTabs.length === 1 ? "" : "s"}`
    ]
  });

  const pressure =
    (mood?.timePressure === "high" ? 16 : mood?.timePressure === "some" ? 8 : 0) +
    (typeof mood?.stress === "number" ? mood.stress * 2 : 0) +
    (typeof mood?.energy === "number" ? Math.max(0, 5 - mood.energy) * 2 : 0) +
    Math.min(10, deadlineTabs.length * 3);
  signals.push({
    id: "time-pressure",
    label: "Time and energy pressure",
    level: level(pressure),
    score: cap(pressure, 24),
    explanation:
      "A high-pressure self check-in combined with deadline surfaces raises the burnout signal.",
    evidence: [
      mood?.timePressure ? `time pressure: ${mood.timePressure}` : "no time-pressure check-in",
      `${deadlineTabs.length} deadline or class tab${deadlineTabs.length === 1 ? "" : "s"}`
    ]
  });

  return signals;
}

function statusFromScore(score: number) {
  if (score >= 68) return "red" as const;
  if (score >= 38) return "yellow" as const;
  return "green" as const;
}

function mainPattern(signals: RiskSignal[]): string {
  const top = [...signals].sort((a, b) => b.score - a.score)[0];
  if (!top || top.score < 8) return "Stable browsing pattern";
  return top.label;
}

function explainPattern(pattern: string, score: number): string {
  if (score >= 68) {
    return `${pattern} is strong enough that Custod recommends an immediate reset before continuing. This is not a diagnosis; it is a browser-pattern warning light.`;
  }
  if (score >= 38) {
    return `${pattern} is building. A short reset now is likely cheaper than pushing through until focus collapses.`;
  }
  return "No severe burnout pattern is visible from the submitted tabs. Keep the session bounded and re-check if pressure rises.";
}

function resetPlan(status: "green" | "yellow" | "red", signals: RiskSignal[]): ResetStep[] {
  const top = [...signals].sort((a, b) => b.score - a.score)[0];
  const first =
    top?.id === "distraction-loop"
      ? "Close or park entertainment tabs before doing anything else."
      : top?.id === "tab-overload"
        ? "Save the current tab list, then reduce the browser to one school surface and one work surface."
        : top?.id === "time-pressure"
          ? "Name the next 10 minutes out loud: recover, choose, then continue."
          : "Pick the single surface that matches the current school obligation.";

  const redPlan: ResetStep[] = [
    { title: "Stop adding inputs", detail: "Do not open another tab for five minutes. The goal is to reduce load, not search harder.", minutes: 5 },
    { title: "Downshift the browser", detail: first, minutes: 4 },
    { title: "Body reset", detail: "Stand up, breathe slowly, drink water, and look away from the screen.", minutes: 3 },
    { title: "Choose one lane", detail: "Return with one school surface, one work surface, and one communication surface at most.", minutes: 8 }
  ];

  const yellowPlan: ResetStep[] = [
    { title: "Make the browser smaller", detail: first, minutes: 3 },
    { title: "Write the next move", detail: "Use one sentence: 'For the next 20 minutes, I am only doing ...'", minutes: 2 },
    { title: "Set a check-back", detail: "Re-check Custod after one focused block or when the tab count jumps again.", minutes: 1 }
  ];

  const greenPlan: ResetStep[] = [
    { title: "Keep the session bounded", detail: "Work from the current core tab group and avoid opening exploratory tabs.", minutes: 2 },
    { title: "Check again later", detail: "Run Custod again if your tab count or stress level climbs.", minutes: 1 }
  ];

  return status === "red" ? redPlan : status === "yellow" ? yellowPlan : greenPlan;
}

export function sanitizeTabs(tabs: unknown): BrowserTab[] {
  if (!Array.isArray(tabs)) return [];
  const safe: BrowserTab[] = [];
  for (const item of tabs) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const url = typeof raw.url === "string" ? raw.url.trim() : "";
    if (!title && !url) continue;
    safe.push({
      id: typeof raw.id === "number" ? raw.id : undefined,
      title: title || url,
      url,
      active: Boolean(raw.active),
      favIconUrl: typeof raw.favIconUrl === "string" ? raw.favIconUrl : undefined
    });
  }
  return safe.slice(0, 200);
}

export function sanitizeMood(mood: unknown): MoodCheckIn | undefined {
  if (!mood || typeof mood !== "object") return undefined;
  const raw = mood as Record<string, unknown>;
  const bounded = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(5, Math.max(1, Math.round(value)))
      : undefined;
  const timePressure =
    raw.timePressure === "none" || raw.timePressure === "some" || raw.timePressure === "high"
      ? raw.timePressure
      : undefined;
  const reflection =
    typeof raw.reflection === "string" && raw.reflection.trim()
      ? raw.reflection.trim().slice(0, 500)
      : undefined;
  return {
    energy: bounded(raw.energy),
    stress: bounded(raw.stress),
    timePressure,
    reflection
  };
}

export function analyzeBurnout(req: AnalyzeRequest): BurnoutAnalysis {
  const tabs = sanitizeTabs(req.tabs);
  const mood = req.mood;
  const evidenceGroups = groupTabs(tabs);
  const riskBreakdown = riskSignals(tabs, evidenceGroups, mood);
  const score = Math.min(100, riskBreakdown.reduce((sum, risk) => sum + risk.score, 0));
  const status = statusFromScore(score);
  const pattern = mainPattern(riskBreakdown);

  return {
    status,
    score,
    mainPattern: pattern,
    patternExplanation: explainPattern(pattern, score),
    riskBreakdown,
    resetPlan: resetPlan(status, riskBreakdown),
    evidenceGroups,
    reflectionPrompt:
      status === "red"
        ? "What are you afraid will happen if you stop for five minutes?"
        : status === "yellow"
          ? "Which open loop is making the browser feel heavier than it is?"
          : "What would keep this session from becoming overloaded?",
    privacySummary:
      "Custod analyzed only submitted tab titles, URLs, active state, and optional check-in values. It did not read page contents."
  };
}
