import type { Metadata } from "next";
import { Footer } from "@/components/custod/Footer";
import { Header } from "@/components/custod/Header";

export const metadata: Metadata = {
  title: "Privacy Policy - Custod",
  description:
    "Custod's privacy policy for browser, computer, phone, and desk burnout signals.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="h-24 bg-[#0f172a]" />
        <section className="mx-auto max-w-3xl px-5 pb-16 pt-12 md:px-8">
          <p className="text-sm font-medium text-custod-muted">Last updated June 13, 2026</p>
          <h1 className="mt-3 font-heading text-5xl font-semibold tracking-[-0.02em] text-[#0f172a]">
            Privacy Policy
          </h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-[#475569]">
            <p>
              Custod measures burnout signals from connected components: browser tab metadata, computer usage patterns, phone health and usage signals, and desk-device environment signals. Custod does not read page contents, messages, emails, passwords, keystrokes, screenshots, or stored video.
            </p>
            <p>
              Browser data is limited to metadata such as tab counts, tab titles, URLs, switching rate, session length, and related derived signals. Camera frames used by the macOS app are processed locally for blink-rate measurements and discarded immediately.
            </p>
            <p>
              Health and motion data are used only to calculate your burnout status and related explanations. Custod does not sell behavioral data, add advertising trackers, run session replay, or use analytics pixels.
            </p>
            <p>
              If you connect Custod to Supabase, your data is stored in the configured Supabase project so the app can sync status across devices. Keep your credentials private and review your Supabase retention and deletion settings before using Custod with sensitive data.
            </p>
            <p>
              Custod is not a medical device, diagnosis, treatment, therapy, or emergency service. It is an informational signal layer for noticing risky patterns earlier.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
