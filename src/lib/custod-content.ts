import type {
  ComponentSpec,
  FaqItem,
  FooterLinkGroup,
  MlStat,
  PrivacyPrinciple,
  SignalRow,
} from "@/types/custod";

export const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Components", href: "#components" },
  { label: "Privacy", href: "#privacy" },
  { label: "FAQ", href: "#faq" },
] as const;

export const BRAND = {
  name: "Custod",
  tagline: "Your silent guardian.",
  heroHeadline: [
    "A",
    "cross-platform",
    "check",
    "engine",
    "light",
    "for",
    "burnout",
  ],
  heroSubhead:
    "Before you crash. Custod reads invisible stress signals from your browser, computer, phone, and desk — and delivers one real-time status: green, yellow, or red.",
  etymology:
    "The name Custod comes from custodian — a guardian that watches over you quietly, without interruption, and only speaks up when something is wrong.",
} as const;

export const PROBLEM = {
  title: "Burnout doesn't arrive suddenly",
  subtitle:
    "It builds invisibly through patterns that feel normal in the moment.",
  paragraphs: [
    "Too many browser tabs. Working past midnight. Constant task switching. Deteriorating sleep. Phone addiction spirals. By the time someone recognizes they are burning out, they are already deep into it.",
    "Existing tools either require active self-reporting — how are you feeling today? — or are clinical interventions that come far too late. There is no passive, ambient system that detects burnout early using the behavioral data devices already produce.",
    "Custod is that system.",
  ],
  patterns: [
    "Tab chaos",
    "Late-night sessions",
    "Declining HRV",
    "Hunched posture",
    "Fragmented focus",
  ],
} as const;

export const HOW_IT_WORKS = {
  title: "How Custod works",
  subtitle:
    "Four interconnected components sync through a central Supabase cloud hub. Every five minutes, each sends a feature vector to an ML scoring engine. The result propagates instantly to every connected device.",
  steps: [
    {
      label: "Collect",
      description: "Each component measures behavioral and physiological signals locally.",
    },
    {
      label: "Score",
      description:
        "A TensorFlow Lite Edge Function returns a 0–100 burnout score with triggers and a micro-intervention.",
    },
    {
      label: "Sync",
      description:
        "Supabase Realtime pushes the status to every device — badge, menu bar, widget, and desk LED.",
    },
  ],
} as const;

export const COMPONENTS: ComponentSpec[] = [
  {
    id: "chrome",
    title: "Chrome Extension",
    subtitle: "Runs silently in the background of your browser.",
    signals: [
      "Tab count and switching rate",
      "Distraction tab ratio and duplicate tabs",
      "Stress keyword searches in titles and URLs",
      "Unbroken work session length",
      "Spiral mode (rapid switching sustained)",
      "Late-night flag and frustration events",
    ],
    highlight:
      "Updates the browser badge color every five minutes. Crosses into red? A non-blocking notification with a one-click 3-minute breathing reset.",
    iconName: "chrome",
  },
  {
    id: "macos",
    title: "macOS App",
    subtitle: "Lives in the menu bar as a small brain icon.",
    signals: [
      "Active app focus percentage (work vs distraction)",
      "Unbroken session length",
      "Late-night usage detection",
      "Blink rate via Vision framework",
      "Blink deviation from 15/min baseline",
    ],
    highlight:
      "Samples one camera frame every five seconds, computes eye aspect ratio, and discards the frame. No video is ever stored.",
    iconName: "laptop",
  },
  {
    id: "ios",
    title: "iOS App",
    subtitle: "Reads HealthKit and CoreMotion signals.",
    signals: [
      "HRV vs 30-day personal baseline (>15% drop = stress)",
      "Sleep efficiency from previous night",
      "Phone pickups per hour",
      "Late-night usage",
    ],
    highlight:
      "Home screen widget shows live score. Push notification the moment any device crosses into red.",
    iconName: "smartphone",
  },
  {
    id: "arduino",
    title: "Arduino Desk Device",
    subtitle: "Physical ambient check engine light.",
    signals: [
      "Room temperature (thermistor)",
      "Posture score via HC-SR04 ultrasonic sensor",
      "Ambient light level (photoresistor)",
      "Dark-room late-night flag",
    ],
    highlight:
      "RGB LED glows green, pulses amber, or flashes red. Three-chime buzzer on red. Mac app bridges USB serial to Supabase — no WiFi required.",
    iconName: "cpu",
  },
];

export const SIGNAL_ROWS: SignalRow[] = [
  {
    source: "Chrome",
    signals:
      "Tab count, switch rate, distraction ratio, stress searches, spiral mode, frustration events, session length, late night",
  },
  {
    source: "macOS",
    signals:
      "Work app focus %, session duration, late night, blink rate, blink deviation from baseline",
  },
  {
    source: "iOS",
    signals:
      "HRV vs 30-day baseline, sleep efficiency, phone pickups per hour, late night",
  },
  {
    source: "Arduino",
    signals:
      "Room temperature, posture score via ultrasonic distance, ambient light level, dark room flag",
  },
];

export const ML_STATS: MlStat[] = [
  {
    value: "20",
    label: "Feature vector",
    description:
      "Drawn from all four components — browser behavior, macOS focus, blink rate, iOS HRV and sleep, hardware posture and environment.",
  },
  {
    value: "0–100",
    label: "Burnout score",
    description:
      "Returns status (green, yellow, red), confidence, top trigger attribution, and a micro-intervention.",
  },
  {
    value: "Offline",
    label: "Rule-based fallback",
    description:
      "Trained on synthetic labeled data for the demo. A local fallback ensures the system works fully if the Edge Function is unreachable.",
  },
];

export const PRIVACY_PRINCIPLES: PrivacyPrinciple[] = [
  {
    title: "No message reading",
    description:
      "The Chrome extension never reads page content — only tab counts, titles, and URLs. Custod is not a mental health chatbot. It is not therapy.",
  },
  {
    title: "No video storage",
    description:
      "The macOS app samples one camera frame every five seconds, computes a number, and discards the frame immediately.",
  },
  {
    title: "Encrypted health data",
    description:
      "HealthKit data never leaves the device unencrypted. No behavioral data is sold or shared.",
  },
  {
    title: "Your own Supabase project",
    description:
      "All data is stored in the user's own Supabase project under their own credentials.",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is Custod a therapy or mental health app?",
    answer:
      "No. Custod is not a mental health chatbot and not therapy. It does not read your messages, emails, or thoughts. It watches patterns your devices already produce when you are stressed and tells you what those patterns mean before you consciously recognize them.",
  },
  {
    question: "What does green, yellow, and red mean?",
    answer:
      "Green (0–40) means your signals look healthy. Yellow (41–70) means caution — stress patterns are building. Red (71–100) means burnout risk is high and a micro-intervention is recommended. The same status appears on every connected device simultaneously.",
  },
  {
    question: "How often does the score update?",
    answer:
      "Each component sends a feature vector every five minutes. The ML scoring engine returns a result that propagates instantly via Supabase Realtime to your browser badge, menu bar icon, iOS widget, and desk LED.",
  },
  {
    question: "Does Custod work offline?",
    answer:
      "Yes. A rule-based local fallback ensures the system works fully if the Supabase Edge Function is unreachable. Components continue measuring signals and estimating status locally.",
  },
  {
    question: "What permissions does Custod need?",
    answer:
      "The Chrome extension needs tab access (not page content). The macOS app needs camera access for blink detection and accessibility for app focus. iOS needs HealthKit and motion permissions. Arduino connects via USB through the Mac app.",
  },
  {
    question: "Who is Custod for?",
    answer:
      "Students and young professionals who work across multiple devices, push through fatigue without recognizing it, and would never self-report stress into a wellness app. Plug it in, grant permissions once, and it runs silently — watching, scoring, and only speaking up when it matters.",
  },
];

export const AUDIENCE = {
  title: "Built for people who push through fatigue",
  subtitle:
    "Students and young professionals who work across multiple devices and would never self-report stress into a wellness app.",
  body: "Custod requires no behavior change and no active input. You plug it in, grant permissions once, and it runs silently in the background of your existing workflow — watching, scoring, and only speaking up when it matters.",
  ctaPrimary: "Get started free",
  ctaPrimaryHref: "/login",
  ctaSecondary: "Learn how it works",
  ctaSecondaryHref: "#how-it-works",
} as const;

export const FOOTER_GROUPS: FooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Components", href: "#components" },
      { label: "Signals", href: "#signals" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Privacy", href: "#privacy" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Contact", href: "mailto:hello@custod.app" },
    ],
  },
];

export const WHAT_IT_IS = {
  title: "What Custod is",
  paragraphs: [
    "Custod is a privacy-first, multi-platform burnout detection system that reads invisible stress signals from your browser, computer, phone, and physical environment simultaneously.",
    "It fuses all of those signals through a machine learning scoring engine and delivers a single, real-time burnout status — green, yellow, or red — across every device you own, including a physical ambient light on your desk.",
    "It watches the patterns your devices already produce when you are stressed — tab chaos, late-night sessions, declining HRV, hunched posture, fragmented focus — and tells you what those patterns mean before you consciously recognize them yourself.",
  ],
} as const;
