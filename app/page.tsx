import { Header } from "@/components/Header";
import { BrowserCaptureForm } from "@/components/BrowserCaptureForm";
import { StatusBadge } from "@/components/StatusBadge";
import { RecentScans } from "@/components/RecentScans";
import { Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[hsl(var(--primary)/0.07)] blur-[100px]" />
          <div className="absolute right-0 top-1/2 h-[400px] w-[500px] -translate-y-1/2 rounded-full bg-[hsl(var(--ok)/0.04)] blur-[80px]" />
        </div>

        <div className="shell py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-1.5 text-xs font-semibold text-[hsl(var(--primary))]">
              <Zap className="h-3 w-3" />
              Student burnout signal engine
            </div>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-6xl lg:text-7xl">
              Make invisible{" "}
              <span className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(252,80%,80%)] bg-clip-text text-transparent">
                browser spirals
              </span>{" "}
              visible.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">
              Custod reads tab titles and URLs to surface a burnout signal — green, yellow, or red — before students realize they&apos;re spiraling.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <StatusBadge status="green" />
              <StatusBadge status="yellow" />
              <StatusBadge status="red" />
            </div>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:items-start">
            <BrowserCaptureForm />

            {/* How it works */}
            <div className="space-y-4">
              {[
                {
                  n: "01",
                  title: "Paste your tabs",
                  body: "Drop tab titles and URLs, or use the extension to capture them automatically. Custod never reads page content.",
                },
                {
                  n: "02",
                  title: "Check in optionally",
                  body: "Rate your energy and stress, note time pressure. These signals sharpen the analysis.",
                },
                {
                  n: "03",
                  title: "Get a burnout signal",
                  body: "Custod surfaces a green, yellow, or red status with a reset plan you can act on immediately.",
                },
              ].map((s) => (
                <div key={s.n} className="panel-inner flex gap-4 p-5">
                  <span className="mt-0.5 text-2xl font-bold text-[hsl(var(--primary)/0.4)]">{s.n}</span>
                  <div>
                    <div className="font-semibold text-[hsl(var(--foreground))]">{s.title}</div>
                    <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="shell pb-16">
        <div className="panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Recent checks</h2>
              <p className="caption mt-1">Only real checks are shown here. No sample data.</p>
            </div>
          </div>

          <RecentScans />
        </div>
      </section>
    </div>
  );
}
