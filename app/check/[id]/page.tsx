import { notFound } from "next/navigation";
import { BurnoutDashboard } from "@/components/BurnoutDashboard";
import { getCheck, listChecks } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function CheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await getCheck(id);
  if (!check) notFound();
  const history = await listChecks(12);

  return <BurnoutDashboard check={check} history={history} />;
}
