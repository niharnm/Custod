import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CONTACT_EMAIL } from "@/lib/custod-links";

type LegalShellProps = {
  title: string;
  intro: string;
  updated?: string;
  children: ReactNode;
};

/**
 * Shared layout for Custod's legal + support pages (/privacy, /terms,
 * /support). Calm, premium, text-first — matches the product's voice and
 * reuses the site's tokens. Server component (no client JS needed).
 */
export function LegalShell({ title, intro, updated = "June 2026", children }: LegalShellProps) {
  return (
    <main className="relative min-h-screen px-5 py-12 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 custod-hero-gradient" />

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back to Custod
      </Link>

      <article className="mx-auto mt-8 max-w-3xl">
        <header className="text-white">
          <h1 className="font-heading text-4xl tracking-tight md:text-5xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/85">{intro}</p>
          <p className="mt-2 text-sm text-white/65">Last updated: {updated}</p>
        </header>

        <div className="mt-8 rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-xl md:p-9">
          <div className="space-y-7 text-[15px] leading-relaxed text-[#334155]">{children}</div>

          <div className="mt-9 rounded-2xl bg-custod-primary/5 p-5 text-sm text-[#334155]">
            Questions, data export, or deletion requests? Email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-custod-primary underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#64748b]">
          Custod is not a diagnosis, therapy, or crisis-support tool.
        </p>
      </article>
    </main>
  );
}

/** Section heading used inside legal pages. */
export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-semibold text-[#0f172a]">{heading}</h2>
      {children}
    </section>
  );
}
