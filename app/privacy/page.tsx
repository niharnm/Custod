import { Header } from "@/components/Header";

export const metadata = {
  title: "Privacy - Custod"
};

export default function PrivacyPage() {
  return (
    <main>
      <Header />
      <section className="shell max-w-3xl py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <div className="mt-6 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>
            Custod analyzes submitted browser tab titles, URLs, active state, and an optional check-in (how you feel, what you&apos;re working on, time left). It does not read page contents, screenshots, cookies, passwords, keystrokes, or any browsing history beyond the tabs you submit.
          </p>
          <p>
            <strong className="text-[hsl(var(--foreground))]">No account. No tracking. No data brokers.</strong> Your scans are tied to an anonymous id stored only in this browser. By default Custod keeps only aggregate signals (counts, status, scores) — not your actual tab titles or URLs. Raw tabs are stored only if you explicitly turn that on in{" "}
            <a href="/settings" className="text-[hsl(var(--primary))] underline">Settings</a>.
          </p>
          <p>
            The score and status come from a deterministic, on-device-style rules engine. Optional AI only rewords the explanation — it can never change your score, and it never receives page content. If no AI key is set, Custod still returns a full analysis.
          </p>
          <p>
            You can export everything or delete all of it at any time from{" "}
            <a href="/settings" className="text-[hsl(var(--primary))] underline">Settings</a>. Share links are public to anyone who has them, expire automatically, and redact tab titles to domains unless you opt in — review before sharing.
          </p>
          <p>
            Custod is not a medical diagnosis, treatment, or clinical advice. It is a browser-pattern check-engine light and reset guide.
          </p>
        </div>
      </section>
    </main>
  );
}
