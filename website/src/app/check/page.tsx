import { Zap } from "lucide-react";
import { BrowserCaptureForm } from "@/components/product/BrowserCaptureForm";
import { Header } from "@/components/product/Header";
import { RecentScans } from "@/components/product/RecentScans";
import { StatusBadge } from "@/components/product/StatusBadge";
import { CustodCard } from "@/components/custod/ui";

export const metadata = {
  title: "Run a check — Custod",
};

export default function CheckPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 custod-hero-gradient" />
        <div className="shell py-12 sm:py-16">
          <div className="max-w-2xl">
            <div className="custod-tag inline-flex items-center gap-2">
              <Zap className="size-3" />
              Student burnout signal engine
            </div>
            <h1 className="mt-5 font-heading text-4xl tracking-tight text-foreground sm:text-5xl">
              Make invisible browser spirals visible.
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Custod reads tab titles and URLs to surface a burnout signal — green, yellow, or
              red — before you realize you&apos;re spiraling.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <StatusBadge status="green" />
              <StatusBadge status="yellow" />
              <StatusBadge status="red" />
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:items-start">
            <BrowserCaptureForm />

            <div className="space-y-4">
              {[
                {
                  n: "01",
                  title: "Paste your tabs",
                  body: "Drop tab titles and URLs, or use the extension to capture them automatically.",
                },
                {
                  n: "02",
                  title: "Check in optionally",
                  body: "Share how you're feeling and what you're working on. These sharpen the analysis.",
                },
                {
                  n: "03",
                  title: "Get a burnout signal",
                  body: "Custod surfaces a green, yellow, or red status with a reset plan you can act on.",
                },
              ].map((s) => (
                <div key={s.n} className="panel-inner flex gap-4">
                  <span className="mt-0.5 font-heading text-2xl text-primary/50">{s.n}</span>
                  <div>
                    <div className="font-semibold text-foreground">{s.title}</div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="shell pb-16">
        <CustodCard className="p-6">
          <h2 className="text-lg font-semibold">Recent checks</h2>
          <p className="caption mt-1">Only real checks are shown here. No sample data.</p>
          <div className="mt-4">
            <RecentScans />
          </div>
        </CustodCard>
      </section>
    </div>
  );
}
