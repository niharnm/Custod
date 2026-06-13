import { Header } from "@/components/Header";
import { BrowserCaptureForm } from "@/components/BrowserCaptureForm";
import { StatusBadge } from "@/components/StatusBadge";
import { listChecks } from "@/lib/storage";
import { formatDate, statusColor } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const history = await listChecks(8);

  return (
    <main>
      <Header />
      <section className="shell py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-semibold text-muted-foreground">
              Student burnout check engine light
            </div>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Make invisible browser spirals visible.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Custod reads tab titles, URLs, switching load, distraction loops, time pressure, and optional check-ins to surface a green, yellow, or red burnout signal before students realize they are spiraling.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <StatusBadge status="green" />
              <StatusBadge status="yellow" />
              <StatusBadge status="red" />
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Custod is not a diagnosis. It is a pattern detector and reset guide built around privacy, evidence, and student control.
            </p>
          </div>

          <BrowserCaptureForm />
        </div>

        <section className="mt-10 panel p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">History</h2>
              <p className="caption mt-1">Real checks appear here. No sample data is invented.</p>
            </div>
          </div>
          {history.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed bg-muted/60 p-6 text-sm text-muted-foreground">
              No burnout checks yet. Run the first check above to start a trend.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {history.map((check) => (
                <Link key={check.id} href={`/check/${check.id}`} className="rounded-lg border bg-white p-4 transition hover:border-primary/40">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-sm font-semibold ${statusColor(check.analysis.status)}`}>
                      {check.analysis.status.toUpperCase()}
                    </span>
                    <span className="caption">{formatDate(check.createdAt)}</span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold">{check.analysis.score}</div>
                  <p className="caption mt-1 line-clamp-2">{check.analysis.mainPattern}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
