export interface FaqItem {
  question: string;
  answer: string;
}

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string; badge?: string }[];
}

export interface StatItem {
  value: string;
  label: string;
  description: string;
}

export interface UndetectabilityCard {
  title: string;
  description: string;
}

export interface Participant {
  name: string;
  email: string;
  role: string;
  avatar: string;
  isYou?: boolean;
}
