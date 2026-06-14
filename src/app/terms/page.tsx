import { LegalSection, LegalShell } from "@/components/legal/LegalShell";
import { CONTACT_EMAIL } from "@/lib/custod-links";

export const metadata = {
  title: "Terms of Service — Custod",
  description:
    "The terms for using Custod. Custod provides wellness and productivity pattern insights — not medical advice, therapy, diagnosis, or crisis support.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      intro="The short, plain-language agreement for using Custod. By using Custod you agree to these terms."
    >
      <LegalSection heading="What Custod is">
        <p>
          Custod provides <strong>wellness and productivity pattern insights</strong> — an early,
          ambient &ldquo;check engine light&rdquo; for digital strain and burnout patterns, with
          suggested resets to help you recover focus.
        </p>
      </LegalSection>

      <LegalSection heading="What Custod is not">
        <p>
          Custod is <strong>not medical advice, therapy, diagnosis, or crisis support</strong>. It
          does not diagnose, treat, or cure any condition, and it is not a substitute for a
          qualified professional. If you are in distress or feel unable to cope, please contact a
          trusted person or your local emergency support.
        </p>
      </LegalSection>

      <LegalSection heading="Your responsibilities">
        <p>
          You are responsible for how you use Custod and for the decisions you make based on its
          insights. Custod surfaces patterns and suggestions; acting on them is up to you. Use the
          product lawfully and don&rsquo;t attempt to misuse, disrupt, or reverse the service.
        </p>
      </LegalSection>

      <LegalSection heading="Privacy">
        <p>
          Your data is handled as described in our{" "}
          <a className="font-medium text-custod-primary hover:underline" href="/privacy">
            Privacy Policy
          </a>
          . In short: Custod analyzes safe signals only and never reads full page contents,
          keystrokes, screenshots, or private messages.
        </p>
      </LegalSection>

      <LegalSection heading="Availability & changes">
        <p>
          Custod is offered on an &ldquo;as is&rdquo; basis while in active development; features
          may change and the service may occasionally be unavailable. We may update these terms;
          continued use after an update means you accept the revised terms.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms? Email{" "}
          <a className="font-medium text-custod-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
