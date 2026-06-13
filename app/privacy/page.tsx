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
            Custod analyzes submitted browser tab titles, URLs, active state, and optional check-in values. It does not read page contents, screenshots, cookies, passwords, keystrokes, or browsing history outside the tabs you submit.
          </p>
          <p>
            The current implementation uses a deterministic local analyzer and file-backed storage. On Vercel, that fallback storage is temporary per runtime instance. Add durable storage only after explicitly deciding what retention and deletion rules the product needs.
          </p>
          <p>
            Shared links are public to anyone with the link and may include tab titles and URLs. Review a check before sharing it.
          </p>
          <p>
            Custod is not a medical diagnosis. It is a browser-pattern warning light and reset guide.
          </p>
        </div>
      </section>
    </main>
  );
}
