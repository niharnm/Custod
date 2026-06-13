import type {
  AnalyzeBurnoutRequest,
  AnalyzeBurnoutResponse,
  BrowserTab,
  BurnoutStatus,
  MoodCheckInValue,
  RiskBreakdown,
  StatusLabel,
  TabGroup,
  TabGroupName,
} from "@/lib/product/types";
import { aggregateTabs, extractDomain, sanitizeTabsForAnalysis } from "@/lib/product/privacy";
import { generateId } from "@/lib/product/utils";

type TabCategory =
  | "current"
  | "school"
  | "research"
  | "coding"
  | "deadline"
  | "communication"
  | "distraction"
  | "recovery"
  | "unknown";

const DISTRACTION_DOMAINS = [
  "youtube.com",
  "tiktok.com",
  "instagram.com",
  "reddit.com",
  "x.com",
  "twitter.com",
  "netflix.com",
  "twitch.tv",
  "spotify.com",
];

const DEADLINE_WORDS = ["deadline", "submission", "submit", "tonight", "final", "project", "due"];
const SCHOOL_WORDS = ["canvas", "blackboard", "schoology", "classroom", "assignment", "homework", "quiz", "exam", "gradescope", "turnitin"];
const RESEARCH_WORDS = ["search", "wikipedia", "scholar", "paper", "article", "research", "arxiv", "docs", "documentation", "tutorial", "how to"];
const CODING_WORDS = ["github", "stack overflow", "stackoverflow", "vercel", "supabase", "localhost", "docs", "api", "typescript", "react"];
const COMMUNICATION_WORDS = ["gmail", "mail", "outlook", "discord", "slack", "teams", "messages"];
const RECOVERY_WORDS = ["breathing", "meditation", "walk", "timer", "music", "sleep", "stretch"];

export function analyzeWithRules(input: AnalyzeBurnoutRequest): AnalyzeBurnoutResponse {
  const tabs = sanitizeTabsForAnalysis(input.tabs);
  const createdAt = new Date().toISOString();
  const classified = tabs.map((tab) => ({ tab, category: categorizeTab(tab) }));
  const riskBreakdown = scoreRisks(classified, input);
  const score = overallScore(riskBreakdown, input.moodCheckIn, tabs.length);
  const status = statusFromScore(score);
  const statusLabel = labelForStatus(status);
  const mainPattern = pickMainPattern(riskBreakdown, status);
  const tabGroups = buildTabGroups(classified);
  const resetPlan = buildResetPlan(mainPattern, status, tabGroups, input.goal);
  const oneSentenceExplanation = explainOneSentence(mainPattern, status, tabs.length);
  const patternExplanation = explainPattern(mainPattern, riskBreakdown, input.moodCheckIn);

  return {
    scanId: generateId(),
    title: titleForStatus(status, mainPattern),
    goal: input.goal,
    moodCheckIn: input.moodCheckIn,
    timeRemaining: input.timeRemaining,
    createdAt,
    status,
    score,
    statusLabel,
    mainPattern,
    oneSentenceExplanation,
    riskBreakdown,
    patternExplanation,
    resetPlan,
    tabGroups,
    checkEngineTimeline: timelineFor(riskBreakdown, status),
    shareSummary: shareSummary(statusLabel, score, mainPattern, oneSentenceExplanation),
    aiReasoning: [],
  };
}

function scoreRisks(
  classified: Array<{ tab: BrowserTab; category: TabCategory }>,
  input: AnalyzeBurnoutRequest
): RiskBreakdown {
  const tabs = classified.map((item) => item.tab);
  const categories = new Set(classified.map((item) => item.category).filter((category) => category !== "recovery"));
  const domains = aggregateTabs(tabs).domainCount;
  const distractionCount = classified.filter((item) => item.category === "distraction").length;
  const deadlineCount = classified.filter((item) => item.category === "deadline").length;
  const recoveryCount = classified.filter((item) => item.category === "recovery").length;
  const coding = classified.some((item) => item.category === "coding");
  const research = classified.some((item) => item.category === "research");
  const communication = classified.some((item) => item.category === "communication");
  const distraction = distractionCount > 0;
  const timeMinutes = parseTimeRemaining(input.timeRemaining);
  const goalPressure = input.goal ? containsAny(input.goal.toLowerCase(), DEADLINE_WORDS) : false;

  const tabOverload = clamp(
    tabs.length > 35 ? 92 : tabs.length > 20 ? 68 + (tabs.length - 20) * 1.2 : tabs.length > 10 ? 35 + (tabs.length - 10) * 2.2 : tabs.length * 1.8
  );
  const contextSwitching = clamp(domains * 6 + categories.size * 8 + (coding && research ? 8 : 0) + (communication ? 8 : 0) + (distraction ? 8 : 0));
  const distractionPull = clamp(distractionCount * 18 + (deadlineCount ? 12 : 0) + (goalPressure && distractionCount ? 10 : 0));
  const goalFragmentation = clamp(categories.size * 10 + domains * 4 + (research && communication ? 10 : 0) + (coding && research && distraction ? 12 : 0));
  const moodPressure = moodRisk(input.moodCheckIn);
  const timePressure = clamp((goalPressure ? 30 : 0) + (timeMinutes !== null && timeMinutes < 120 ? 30 : 0) + (timeMinutes !== null && timeMinutes < 45 ? 18 : 0) + deadlineCount * 10 + moodPressure);
  const dominantCategoryCount = maxCategoryCount(classified);
  const recoverySignal = clamp(
    dominantCategoryCount >= Math.max(3, tabs.length * 0.65) ? 55 : 0
      + (recoveryCount ? Math.min(20, recoveryCount * 8) : 0)
      + (tabs.length <= 8 && categories.size <= 2 ? 25 : 0)
  );

  return {
    tabOverload,
    contextSwitching,
    distractionPull,
    goalFragmentation,
    timePressure,
    recoverySignal,
  };
}

function overallScore(risk: RiskBreakdown, mood: MoodCheckInValue | undefined, tabCount: number): number {
  const weighted =
    risk.tabOverload * 0.22 +
    risk.contextSwitching * 0.2 +
    risk.distractionPull * 0.2 +
    risk.goalFragmentation * 0.18 +
    risk.timePressure * 0.2 -
    Math.min(15, risk.recoverySignal * 0.18);
  const strongSignals = [
    risk.tabOverload,
    risk.contextSwitching,
    risk.distractionPull,
    risk.goalFragmentation,
    risk.timePressure,
  ].filter((value) => value >= 60).length;
  let score = clamp(weighted);

  if (score >= 70 && strongSignals < 2 && !(moodRisk(mood) >= 40 && tabCount > 25)) {
    score = 69;
  }
  if (risk.recoverySignal >= 70 && strongSignals < 3) {
    score = Math.min(score, 62);
  }
  return score;
}

function categorizeTab(tab: BrowserTab): TabCategory {
  // Classify each tab from its OWN title/url only. The user's goal is handled
  // separately as time-pressure — folding it in here would mis-tag every tab
  // (e.g. a "deadline" goal would re-label YouTube as a deadline tab).
  const text = `${tab.title} ${tab.url}`.toLowerCase();
  const domain = extractDomain(tab.url);
  // Domain-based distraction wins first: a youtube.com tab is a distraction
  // regardless of words in its title.
  if (DISTRACTION_DOMAINS.some((item) => domain.includes(item))) return "distraction";
  if (containsAny(text, DEADLINE_WORDS)) return "deadline";
  if (containsAny(text, COMMUNICATION_WORDS)) return "communication";
  if (containsAny(text, CODING_WORDS)) return "coding";
  if (containsAny(text, SCHOOL_WORDS)) return "school";
  if (containsAny(text, RESEARCH_WORDS)) return "research";
  if (containsAny(text, RECOVERY_WORDS)) return "recovery";
  if (tab.active) return "current";
  return "unknown";
}

function buildTabGroups(classified: Array<{ tab: BrowserTab; category: TabCategory }>): TabGroup[] {
  const map = new Map<TabGroupName, BrowserTab[]>();
  for (const item of classified) {
    const name = groupName(item.category);
    map.set(name, [...(map.get(name) ?? []), item.tab]);
  }
  return Array.from(map.entries()).map(([name, tabs]) => ({
    name,
    explanation: groupExplanation(name, tabs.length),
    action: groupAction(name),
    tabs,
  }));
}

function groupName(category: TabCategory): TabGroupName {
  if (category === "current") return "Current Task";
  if (category === "school") return "School / Work";
  if (category === "research") return "Research";
  if (category === "coding") return "Build / Coding";
  if (category === "deadline") return "Submission / Deadline";
  if (category === "communication") return "Communication";
  if (category === "distraction") return "Distractions";
  return "Unknown / Later";
}

function groupAction(name: TabGroupName) {
  if (name === "Current Task" || name === "Submission / Deadline") return "keep" as const;
  if (name === "Distractions") return "close" as const;
  if (name === "Unknown / Later" || name === "Communication") return "ignore" as const;
  return "save" as const;
}

function groupExplanation(name: TabGroupName, count: number): string {
  const suffix = `${count} tab${count === 1 ? "" : "s"}.`;
  const copy: Record<TabGroupName, string> = {
    "Current Task": "This appears closest to the active work surface.",
    "School / Work": "These tabs look tied to class or work obligations.",
    Research: "These tabs can help, but too many open research paths can create drift.",
    "Build / Coding": "These are technical work surfaces that often need focused context.",
    "Submission / Deadline": "These tabs signal a concrete due point or hand-in surface.",
    Communication: "These tabs can interrupt the next work block.",
    Distractions: "These tabs are more likely to pull attention away from the stated goal.",
    "Unknown / Later": "These tabs do not clearly support the next action.",
  };
  return `${copy[name]} ${suffix}`;
}

function buildResetPlan(mainPattern: string, status: BurnoutStatus, groups: TabGroup[], goal?: string) {
  const closeOrSave = groups
    .filter((group) => group.action === "close" || group.action === "save")
    .flatMap((group) => group.tabs.slice(0, 5).map((tab) => tab.title || extractDomain(tab.url)))
    .slice(0, 12);
  const ignoreForNow = groups
    .filter((group) => group.action === "ignore")
    .flatMap((group) => group.tabs.slice(0, 5).map((tab) => tab.title || extractDomain(tab.url)))
    .slice(0, 8);
  const nextGoal = goal?.trim() || "the single task that matters next";

  return {
    immediateAction:
      mainPattern === "Distraction pull"
        ? "Close or park distraction tabs before opening anything new."
        : mainPattern === "Tab overload"
          ? "Reduce the browser to the tabs needed for the next action."
          : mainPattern === "Time pressure"
            ? "Write the next deliverable in one sentence before continuing."
            : "Choose one work surface and pause the rest.",
    threeMinuteReset:
      status === "green"
        ? "Take one minute to confirm the next task and keep the session bounded."
        : "Stand up, breathe slowly, drink water, and look away from the screen before choosing the next tab.",
    twentyMinuteFocusBlock: `For the next 20 minutes, work only on ${nextGoal}.`,
    closeOrSave,
    ignoreForNow,
  };
}

function pickMainPattern(risk: RiskBreakdown, status: BurnoutStatus): string {
  if (status === "green") return "Stable browsing pattern";
  const entries = [
    ["Tab overload", risk.tabOverload],
    ["Context switching", risk.contextSwitching],
    ["Distraction pull", risk.distractionPull],
    ["Goal fragmentation", risk.goalFragmentation],
    ["Time pressure", risk.timePressure],
  ] as const;
  return [...entries].sort((a, b) => b[1] - a[1])[0][0];
}

function explainOneSentence(pattern: string, status: BurnoutStatus, tabCount: number): string {
  if (status === "green") return "This browser snapshot looks bounded enough to keep working without a major reset.";
  if (pattern === "Tab overload") return `Your browser is carrying ${tabCount} open loops, which makes the next action harder to see.`;
  if (pattern === "Context switching") return "Several work modes are open at once, so the session is likely to feel heavier than the task itself.";
  if (pattern === "Distraction pull") return "Distraction tabs are mixed into the same workspace as work tabs.";
  if (pattern === "Goal fragmentation") return "Research, communication, and work surfaces are competing for the same focus block.";
  return "Deadline or time pressure is mixing with the current browser load.";
}

function explainPattern(pattern: string, risk: RiskBreakdown, mood?: MoodCheckInValue): string {
  const moodCopy = mood && mood !== "skip" ? ` The optional check-in was "${mood}", so the reset stays short and concrete.` : "";
  return `${pattern} is the strongest browser-pattern signal in this scan. Custod uses tab count, domain spread, tab categories, optional time pressure, and recovery cues to produce this status.${moodCopy}`;
}

function timelineFor(risk: RiskBreakdown, status: BurnoutStatus) {
  return [
    { label: "Signal", description: `Custod found ${status} browser pressure from the submitted snapshot.` },
    { label: "Pattern", description: `Top risk scores: tabs ${risk.tabOverload}, switching ${risk.contextSwitching}, time ${risk.timePressure}.` },
    { label: "Reset", description: "Use the reset plan, then re-check after one focused block." },
  ];
}

function statusFromScore(score: number): BurnoutStatus {
  if (score >= 70) return "red";
  if (score >= 35) return "yellow";
  return "green";
}

function labelForStatus(status: BurnoutStatus): StatusLabel {
  return status === "green" ? "Stable" : status === "yellow" ? "Strained" : "At Risk";
}

function titleForStatus(status: BurnoutStatus, pattern: string): string {
  return status === "green" ? "Stable browser pattern" : `${pattern} detected`;
}

function shareSummary(label: StatusLabel, score: number, pattern: string, explanation: string): string {
  return `Custod status: ${label} (${score}/100). Main pattern: ${pattern}. ${explanation}`;
}

function moodRisk(mood?: MoodCheckInValue): number {
  if (mood === "overwhelmed" || mood === "numb") return 45;
  if (mood === "stressed") return 25;
  return 0;
}

function parseTimeRemaining(value?: string): number | null {
  if (!value) return null;
  const text = value.toLowerCase();
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hour)/);
  const minuteMatch = text.match(/(\d+)\s*(m|min|minute)/);
  let minutes = 0;
  if (hourMatch) minutes += Number(hourMatch[1]) * 60;
  if (minuteMatch) minutes += Number(minuteMatch[1]);
  if (!minutes && /^\d+$/.test(text.trim())) minutes = Number(text.trim());
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

function maxCategoryCount(classified: Array<{ category: TabCategory }>): number {
  const counts = new Map<TabCategory, number>();
  for (const item of classified) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  return Math.max(0, ...counts.values());
}

function containsAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
