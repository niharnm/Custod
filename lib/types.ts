export type BrowserTab = {
  id?: number;
  title: string;
  url: string;
  active: boolean;
  favIconUrl?: string;
};

export type BurnoutStatus = "green" | "yellow" | "red";
export type RiskLevel = "low" | "medium" | "high";
export type StatusLabel = "Stable" | "Strained" | "At Risk";

export type MoodCheckIn = {
  energy?: number;
  stress?: number;
  timePressure?: "none" | "some" | "high";
  reflection?: string;
};

export type AnalyzeRequest = {
  tabs: BrowserTab[];
  mood?: MoodCheckIn;
};

export type EvidenceGroup = {
  name: string;
  explanation: string;
  tabs: BrowserTab[];
};

export type RiskSignal = {
  id: string;
  label: string;
  level: RiskLevel;
  score: number;
  explanation: string;
  evidence: string[];
};

export type ResetStep = {
  title: string;
  detail: string;
  minutes: number;
};

export type BurnoutAnalysis = {
  status: BurnoutStatus;
  score: number;
  mainPattern: string;
  patternExplanation: string;
  riskBreakdown: RiskSignal[];
  resetPlan: ResetStep[];
  evidenceGroups: EvidenceGroup[];
  reflectionPrompt: string;
  privacySummary: string;
};

export type BurnoutCheckRecord = {
  id: string;
  createdAt: string;
  rawTabs: BrowserTab[];
  mood?: MoodCheckIn;
  analysis: BurnoutAnalysis;
  shareSlug?: string;
};

export type DevicePlatform = "chrome" | "web" | "ios" | "macos";

export type Device = {
  id: string;
  platform: DevicePlatform;
  label?: string;
  createdAt: string;
  lastSeenAt: string;
  syncEnabled: boolean;
};

export type MoodCheckInValue = "calm" | "stressed" | "overwhelmed" | "numb" | "skip";

export type RiskBreakdown = {
  tabOverload: number;
  contextSwitching: number;
  distractionPull: number;
  goalFragmentation: number;
  timePressure: number;
  recoverySignal: number;
};

export type TabGroupName =
  | "Current Task"
  | "School / Work"
  | "Research"
  | "Build / Coding"
  | "Submission / Deadline"
  | "Communication"
  | "Distractions"
  | "Unknown / Later";

export type TabGroupAction = "keep" | "save" | "close" | "ignore";

export type TabGroup = {
  name: TabGroupName;
  explanation: string;
  action: TabGroupAction;
  tabs: BrowserTab[];
};

export type ResetPlan = {
  immediateAction: string;
  threeMinuteReset: string;
  twentyMinuteFocusBlock: string;
  closeOrSave: string[];
  ignoreForNow: string[];
};

export type Reflection = {
  scanId: string;
  text: string;
  accuracy?: "accurate" | "partly" | "off";
  helpfulAction?: string;
  createdAt: string;
};

export type Streak = {
  type: "checkin" | "reset";
  current: number;
  longest: number;
  lastDay: string;
};

export type Achievement = {
  id: string;
  name: string;
  unlockedAt: string | null;
};

export type NudgePreferences = {
  enabled: boolean;
  quietHours?: { start: string; end: string };
};

export type PrivacySettings = {
  storeRawTabs: boolean;
  retentionDays: number;
  syncEnabled: boolean;
  shareDefaultsIncludeRaw: boolean;
};

export type ScanEventType =
  | "scan_created"
  | "reflection_added"
  | "reset_complete"
  | "share_created";

export type ScanEvent = {
  id: string;
  scanId?: string;
  deviceId?: string;
  type: ScanEventType;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type Scan = {
  id: string;
  deviceId?: string;
  userId?: string;
  createdAt: string;
  status: BurnoutStatus;
  score: number;
  statusLabel: StatusLabel;
  mainPattern: string;
  tabCount: number;
  domainCount: number;
  goal?: string;
  moodCheckIn?: MoodCheckInValue;
  timeRemaining?: string;
  riskBreakdown: RiskBreakdown;
  oneSentenceExplanation?: string;
  patternExplanation?: string;
  resetPlan?: ResetPlan;
  tabGroups?: TabGroup[];
  checkEngineTimeline?: { label: string; description: string }[];
  shareSummary?: string;
  aiReasoning?: string[];
  reflection?: Reflection;
};

export type AnalyzeBurnoutRequest = {
  tabs: BrowserTab[];
  goal?: string;
  moodCheckIn?: MoodCheckInValue;
  timeRemaining?: string;
  deviceId?: string;
};

export type AnalyzeBurnoutResponse = {
  scanId: string;
  title: string;
  goal?: string;
  moodCheckIn?: string;
  timeRemaining?: string;
  createdAt: string;
  status: BurnoutStatus;
  score: number;
  statusLabel: StatusLabel;
  mainPattern: string;
  oneSentenceExplanation: string;
  riskBreakdown: RiskBreakdown;
  patternExplanation: string;
  resetPlan: ResetPlan;
  tabGroups: TabGroup[];
  checkEngineTimeline: { label: string; description: string }[];
  shareSummary: string;
  aiReasoning: string[];
};

export type RegisterDeviceRequest = {
  deviceId?: string;
  platform: DevicePlatform;
  label?: string;
};

export type ReflectionRequest = {
  text?: string;
  accuracy?: "accurate" | "partly" | "off";
  helpfulAction?: string;
};
