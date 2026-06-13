import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { BurnoutDashboard } from "@/components/BurnoutDashboard";
import { getCheckBySlug } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const check = await getCheckBySlug(slug);
  if (!check) notFound();

  return (
    <main>
      <Header />
      <BurnoutDashboard check={check} readOnly />
    </main>
  );
}
