import { LegalShell } from "@/components/legal/LegalShell";
import { CONTACT_EMAIL } from "@/lib/custod-links";

export const metadata = {
  title: "Support — Custod",
  description:
    "Get help with Custod. Contact us about privacy, support, bug reports, or data deletion and export requests.",
};

const CATEGORIES = [
  {
    label: "Privacy",
    blurb: "Questions about what Custod sees, how data is stored, or our privacy practices.",
    subject: "Privacy question",
  },
  {
    label: "Support",
    blurb: "Help getting set up, signing in, or syncing across your devices.",
    subject: "Support request",
  },
  {
    label: "Bug report",
    blurb: "Something looks wrong or isn't working. Tell us what you expected and what happened.",
    subject: "Bug report",
  },
  {
    label: "Data deletion / export",
    blurb: "Request a full export of your data, or ask us to delete everything tied to your account.",
    subject: "Data deletion / export request",
  },
] as const;

export default function SupportPage() {
  return (
    <LegalShell
      title="Support"
      intro="We're a small team and we read every message. Email us and we'll get back to you."
      updated="June 2026"
    >
      <p>
        The fastest way to reach Custod is email. Use a subject that matches your request so we can
        route it quickly:
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <a
            key={c.label}
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Custod — ${c.subject}`)}`}
            className="group rounded-2xl border border-[#e2e8f0] bg-white p-5 transition hover:border-custod-primary/40 hover:shadow-md"
          >
            <h2 className="font-heading text-lg font-semibold text-[#0f172a]">{c.label}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#475569]">{c.blurb}</p>
            <span className="mt-3 inline-block text-sm font-medium text-custod-primary">
              Email us →
            </span>
          </a>
        ))}
      </div>

      <p>
        Or write to us directly at{" "}
        <a className="font-medium text-custod-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        . For how we handle your data, see the{" "}
        <a className="font-medium text-custod-primary hover:underline" href="/privacy">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a className="font-medium text-custod-primary hover:underline" href="/terms">
          Terms of Service
        </a>
        .
      </p>
    </LegalShell>
  );
}
