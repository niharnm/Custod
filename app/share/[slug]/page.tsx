import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ScanDashboard } from "@/components/ScanDashboard";
import { getScanStore } from "@/lib/storage/scans";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scan = await getScanStore().getSharedScan(slug);
  if (!scan) notFound();

  return (
    <main>
      <Header />
      <div className="shell pt-4">
        <p className="caption rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-2.5">
          Shared read-only snapshot. Tab titles are redacted to domains unless the owner chose otherwise. This link expires.
        </p>
      </div>
      <ScanDashboard scan={scan} readOnly />
    </main>
  );
}
