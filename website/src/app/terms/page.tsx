import type { Metadata } from "next";
import { Footer } from "@/components/custod/Footer";
import { Header } from "@/components/custod/Header";

export const metadata: Metadata = {
  title: "Terms of Service - Custod",
  description: "Terms for using Custod.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="h-24 bg-[#0f172a]" />
        <section className="mx-auto max-w-3xl px-5 pb-16 pt-12 md:px-8">
          <p className="text-sm font-medium text-custod-muted">Last updated June 13, 2026</p>
          <h1 className="mt-3 font-heading text-5xl font-semibold tracking-[-0.02em] text-[#0f172a]">
            Terms of Service
          </h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-[#475569]">
            <p>
              Custod is a privacy-first burnout signal system. You are responsible for deciding what devices, permissions, and data sources you connect.
            </p>
            <p>
              Do not use Custod for medical diagnosis, treatment decisions, crisis response, employee surveillance, disciplinary action, or any use that requires professional clinical judgment.
            </p>
            <p>
              You may not submit data you do not have permission to process, attempt to access another person&apos;s data, interfere with the service, or misuse Custod to monitor someone without consent.
            </p>
            <p>
              Custod outputs are informational signals. They can be incomplete or wrong, and they should not replace rest, professional support, emergency services, or your own judgment.
            </p>
            <p>
              Custod is provided without warranties. To the fullest extent allowed by law, Custod is not liable for losses arising from reliance on the product, unavailable service, inaccurate scores, or misuse of connected data.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
