import type { FaqItem, FooterLinkGroup, Participant, StatItem, UndetectabilityCard } from "@/types/cluely";
import { ASSETS } from "@/lib/cluely-assets";

export const NAV_LINKS = [
  { label: "Undetectability", href: "#undetectability" },
  { label: "Mobile", href: "https://cluely.com/mobile" },
  { label: "Blog", href: "https://cluely.com/blog" },
] as const;

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Why real-time vs. a regular AI notetaker?",
    answer:
      "Unlike regular AI notetakers like Otter or Granola that work after your meeting ends, Cluely provides real-time meeting intelligence during your calls. While other AI meeting assistants create meeting summaries afterward, Cluely helps you answer technical questions, handle objections, and perform better during high-stakes conversations.",
  },
  {
    question: "Who is Cluely for?",
    answer:
      "Cluely is perfect for students, professionals, sales teams, recruiters, consultants, executives, and anyone who needs to perform well in meetings. If you're in back-to-back sales calls, lectures, or client meetings where you can't afford to look unprepared, Cluely delivers you answers at moments when you most need them.",
  },
  {
    question: "Is Cluely free?",
    answer:
      "Yes, you can use Cluely's AI meeting assistant for free, and you will have limited access to all core Cluely features. The pro plan gives you access to unlimited meeting notes and unlimited AI responses with Cluely.",
  },
  {
    question: "How is it undetectable in meetings?",
    answer:
      "Unlike other meeting AI tools, it never joins your calls as a participant, doesn't appear in meeting recordings, and won't show up in screen shares. It captures meeting audio in the background and provides a discreet, translucent overlay that only you can see—making it completely undetectable to other meeting participants.",
  },
  {
    question: "What languages and apps are supported?",
    answer:
      "Cluely's AI meeting assistant works with all major meeting platforms including Zoom, Microsoft Teams, Webex, and Slack calls. It supports English and major international languages for meeting transcription and real-time insights.",
  },
  {
    question: "Can I talk to customer support?",
    answer:
      "Yes, our support team is available to help you get the most out of your AI meeting assistant. You can reach out via live chat, email, or through the support center. We provide technical support and help with optimizing Cluely for your specific meeting and sales workflows.",
  },
];

export const FOOTER_GROUPS: FooterLinkGroup[] = [
  {
    title: "Resources",
    links: [
      { label: "Mobile", href: "https://cluely.com/mobile", badge: "New" },
      { label: "Manifesto", href: "https://cluely.com/manifesto" },
      { label: "Press", href: "https://cluely.com/press" },
      { label: "Bug Bounty", href: "https://cluelyhq.notion.site/bugbounty" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "https://support.cluely.com/en/" },
      { label: "Contact Us", href: "mailto:support@cluely.com" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "https://cluely.com/privacy-policy" },
      { label: "Terms of Service", href: "https://cluely.com/terms" },
      { label: "Subprocessors", href: "https://cluely.com/subprocessors" },
    ],
  },
];

export const STATS: StatItem[] = [
  {
    value: "12+",
    label: "Languages",
    description:
      "We support over 12 different languages, including English, Chinese, Spanish, and more.",
  },
  {
    value: "300ms",
    label: "Response time",
    description:
      "We have the fastest live transcription available. Test us against any other competitor.",
  },
  {
    value: "95%",
    label: "Transcription accuracy",
    description:
      "Trusted by many teams for reliable transcription. All processed with industry-leading accuracy.",
  },
];

export const UNDETECTABILITY_CARDS: UndetectabilityCard[] = [
  {
    title: "Doesn't join meetings.",
    description:
      "Cluely never joins your meetings, so there are no bots and no extra people on the guest list.",
  },
  {
    title: "Invisible to screen share.",
    description:
      "Cluely never shows up in shared screens, recordings, or external meeting tools.",
  },
  {
    title: "Follows your eyes.",
    description:
      "Cluely window is fully moveable so you can position it exactly where you're looking.",
  },
];

export const PARTICIPANTS: Participant[] = [
  {
    name: "Gina Huels",
    email: "gina@example.com",
    role: "Owner",
    avatar: ASSETS.participants.gina,
    isYou: true,
  },
  {
    name: "Todd Cremin",
    email: "todd@example.com",
    role: "Speaker",
    avatar: ASSETS.participants.todd,
  },
  {
    name: "Holly Gleason",
    email: "holly@example.com",
    role: "Speaker",
    avatar: ASSETS.participants.holly,
  },
  {
    name: "Tomas Hansen",
    email: "tomas@example.com",
    role: "Speaker",
    avatar: ASSETS.participants.tomas,
  },
];

export const PLATFORM_LOGOS = [
  { name: "Zoom", src: ASSETS.platforms.zoom },
  { name: "Slack", src: ASSETS.platforms.slack },
  { name: "Webex", src: ASSETS.platforms.webex },
  { name: "Microsoft Teams", src: ASSETS.platforms.teams },
  { name: "Google Meet", src: ASSETS.platforms.meet },
] as const;

export const DOCK_ICONS = [
  { name: "Launchpad", src: ASSETS.dock.launchpad },
  { name: "Safari", src: ASSETS.dock.safari },
  { name: "Settings", src: ASSETS.dock.settings },
  { name: "Zoom", src: ASSETS.dock.zoom },
  { name: "Cluely", src: ASSETS.dock.cluely },
  { name: "Trash", src: ASSETS.dock.trash },
] as const;
