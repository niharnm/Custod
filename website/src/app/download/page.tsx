import { Apple, ArrowLeft, Puzzle } from "lucide-react";
import Link from "next/link";
import { CustodButton, CustodCard, CustodTag } from "@/components/custod/ui";
import { LINKS } from "@/lib/custod-links";

export const metadata = {
  title: "Download Custod — Chrome extension & Mac app",
};

export default function DownloadPage() {
  return (
    <main className="relative min-h-screen bg-background px-5 py-12 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 custod-hero-gradient" />

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="mx-auto max-w-3xl">
        <div className="mt-8 text-center">
          <h1 className="font-heading text-4xl tracking-tight text-foreground md:text-5xl">
            Get Custod
          </h1>
          <div className="mx-auto mt-4 flex justify-center">
            <span className="custod-accent-bar" />
          </div>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Run a check in seconds. Free, private, and it never reads your page contents.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <CustodCard id="chrome" className="scroll-mt-24 p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Puzzle className="size-6" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">Chrome extension</h2>
            <CustodTag className="mt-2">Beta</CustodTag>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The fastest way to use Custod. One click captures your current window&apos;s tabs and
              shows a status with a reset. Works in Chrome, Edge, Brave, and Arc.
            </p>
            <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>1. Clone the Custod repo from GitHub.</li>
              <li>
                2. Build:{" "}
                <span className="font-mono text-xs">
                  cd website/extension && npm install && npm run build
                </span>
              </li>
              <li>
                3. Open <span className="font-mono text-xs">chrome://extensions</span> and turn on
                Developer mode.
              </li>
              <li>
                4. Click &quot;Load unpacked&quot; and select{" "}
                <span className="font-mono text-xs">website/extension/dist</span>.
              </li>
            </ol>
            <CustodButton href={LINKS.github} className="mt-5 w-full">
              <Puzzle className="size-4" /> Get the extension
            </CustodButton>
          </CustodCard>

          <CustodCard id="mac" className="scroll-mt-24 p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-foreground">
              <Apple className="size-6" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">macOS app</h2>
            <CustodTag className="mt-2">Beta</CustodTag>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A menu-bar pressure sensor that runs local, browser-agnostic checks and keeps a
              private baseline of your usual pattern — no page contents, ever.
            </p>
            <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>1. Open <span className="font-mono text-xs">macos/Custod/Custodt.xcodeproj</span> in Xcode.</li>
              <li>2. Select the Custodt scheme and target &quot;My Mac&quot;.</li>
              <li>3. Press ⌘R to build and run.</li>
            </ol>
            <CustodButton href={LINKS.github} variant="secondary" className="mt-5 w-full">
              <Apple className="size-4" /> Build from source
            </CustodButton>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Or use the web dashboard or Chrome extension in the meantime.
            </p>
          </CustodCard>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Prefer the web?{" "}
          <Link href={LINKS.dashboard} className="font-medium text-primary hover:underline">
            Open the dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
