export type BrowserTab = {
  id?: number;
  title: string;
  url: string;
  active: boolean;
  favIconUrl?: string;
};

export type BurnoutStatus = "green" | "yellow" | "red";
export type RiskLevel = "low" | "medium" | "high";

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
