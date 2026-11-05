import { LegalSection, LegalShell } from "@/components/legal/LegalShell";
import { CONTACT_EMAIL } from "@/lib/custod-links";

export const metadata = {
  title: "Privacy Policy — Custod",
  description:
    "How Custod handles your data. We analyze safe signals like tab titles, URLs/domains, optional check-ins, and scan history — never page contents, keystrokes, screenshots, or private messages.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      intro="Custod is privacy-first by design. This page explains, in plain language, exactly what we look at and what we never touch."
    >
      <p>
        Custod is a &ldquo;check engine light&rdquo; for digital strain and burnout patterns. To do
        that, it reads a small set of <strong>safe signals</strong> and turns them into an early,
        ambient status. It is built to see as little as possible.
      </p>

      <LegalSection heading="What Custod analyzes">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Tab <strong>titles</strong> and <strong>URLs / domains</strong> (not the page body).</li>
          <li>Behavioral patterns like tab count, tab-switching frequency, and active time.</li>
          <li>Optional <strong>check-ins</strong> you choose to share (mood, goal, time remaining).</li>
          <li>Your <strong>scan history</strong>, so trends and resets are useful over time.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="What Custod never collects">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>The <strong>full contents</strong> of any page you visit.</li>
          <li><strong>Keystrokes</strong> or anything you type into other sites.</li>
          <li><strong>Screenshots</strong> or screen recordings.</li>
          <li><strong>Private messages</strong>, emails, or chats.</li>
          <li>Health <strong>diagnosis</strong> data or clinical records.</li>
        </ul>
        <p className="rounded-xl bg-[#f1f5f9] p-4 text-sm">
          Custod only analyzes safe signals like tab titles, URLs/domains, optional check-ins, and
          scan history. It never reads full page contents, keystrokes, screenshots, or private
          messages.
        </p>
      </LegalSection>

      <LegalSection heading="Your account and devices">
        <p>
          When you sign in, your scans are tied to your account so they can sync across the Chrome
          extension, macOS app, iOS app, and the web dashboard. Each install is identified by a
          random device ID. You can use Custod without an account. In that case your scans are still
          stored on our servers, keyed by that device ID rather than an email, and are only
          returned to requests that present the same ID. When you later sign in, history from
          the device you sign in on can be merged into your account.
        </p>
      </LegalSection>

      <LegalSection heading="Optional AI wording">
        <p>
          The score, status, and reset plan are computed by a rules engine. If AI wording is turned
          on (a provider key is configured on the server, or you enable AI reasoning in the macOS
          app and supply a key), Custod sends your scan&rsquo;s tab titles and URLs, any mood
          check-in, goal, and time remaining you shared, and the rules result to the AI provider
          (Groq by default; OpenAI or Google Gemini if configured instead) so it can write the
          explanation. Page contents are never sent. If no key is configured, nothing is sent to
          any AI provider.
        </p>
      </LegalSection>

      <LegalSection heading="Your control">
        <p>
          You can <strong>export</strong> everything Custod has stored, or <strong>delete</strong>{" "}
          all of your data, at any time. To ask a question, request an export, or delete your data,
          email{" "}
          <a className="font-medium text-custod-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Not a diagnosis or therapy tool">
        <p>
          Custod surfaces digital-strain patterns and reset suggestions. It is{" "}
          <strong>not</strong> a medical device, a diagnosis, a therapy service, or a crisis-support
          tool, and it does not diagnose any mental-health condition.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
