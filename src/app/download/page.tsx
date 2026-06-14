import { Apple, ArrowLeft, Puzzle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LINKS } from "@/lib/custod-links";

export const metadata = {
  title: "Download Custod — Chrome extension & Mac app",
};

export default function DownloadPage() {
  return (
    <main className="relative min-h-screen px-5 py-12 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 custod-hero-gradient" />

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="mx-auto max-w-3xl">
        <div className="mt-8 text-center text-white">
          <Image
            src="/logo.png"
            alt=""
            width={64}
            height={64}
            className="mx-auto mb-4 size-16 rounded-2xl bg-white"
            priority
          />
          <h1 className="font-heading text-4xl tracking-tight md:text-5xl">Get Custod</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Run a check in seconds. Free, private, and it never reads your page contents.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {/* Chrome */}
          <div id="chrome" className="scroll-mt-24 rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-xl">
            <span className="grid size-12 place-items-center rounded-2xl bg-custod-primary/10 text-custod-primary">
              <Puzzle className="size-6" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">Chrome extension</h2>
            <span className="mt-1 inline-block rounded-full bg-custod-primary/10 px-2 py-0.5 text-xs font-medium text-custod-primary">
              Beta
            </span>
            <p className="mt-3 text-sm leading-relaxed text-[#475569]">
              The fastest way to use Custod. One click captures your current window&apos;s tabs and
              shows a status with a reset. Works in Chrome, Edge, Brave, and Arc.
            </p>
            <ol className="mt-4 space-y-2 text-sm text-[#475569]">
              <li>1. Download the extension from the repo.</li>
              <li>2. Open <span className="font-mono text-xs">chrome://extensions</span> and turn on Developer mode.</li>
              <li>3. Click &quot;Load unpacked&quot; and select the <span className="font-mono text-xs">extension/dist</span> folder.</li>
            </ol>
            <Link
              href={LINKS.github}
              className="custod-primary-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white"
            >
              <Puzzle className="size-4" /> Get the extension
            </Link>
          </div>

          {/* Mac */}
          <div id="mac" className="scroll-mt-24 rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-xl">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#0f172a]/5 text-[#0f172a]">
              <Apple className="size-6" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">macOS app</h2>
            <span className="mt-1 inline-block rounded-full bg-[#f6f8f7] px-2 py-0.5 text-xs font-medium text-custod-muted">
              Coming soon
            </span>
            <p className="mt-3 text-sm leading-relaxed text-[#475569]">
              A menu-bar pressure sensor that runs local, browser-agnostic checks and keeps a
              private baseline of your usual pattern — no page contents, ever.
            </p>
            <button
              disabled
              className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f6f8f7] px-4 py-3 text-sm font-medium text-custod-muted"
            >
              <Apple className="size-4" /> Get for Mac (soon)
            </button>
            <p className="mt-3 text-center text-xs text-custod-muted">
              Use the web dashboard or Chrome extension in the meantime.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-white/80">
          Prefer the web?{" "}
          <Link href={LINKS.dashboard} className="font-medium underline">
            Open the dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
