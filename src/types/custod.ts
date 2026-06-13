export type StatusLevel = "green" | "yellow" | "red";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

export interface ComponentSpec {
  id: string;
  title: string;
  subtitle: string;
  signals: string[];
  highlight: string;
  iconName: "chrome" | "laptop" | "smartphone" | "cpu";
}

export interface SignalRow {
  source: string;
  signals: string;
}

export interface MlStat {
  value: string;
  label: string;
  description: string;
}

export interface PrivacyPrinciple {
  title: string;
  description: string;
}
