import { requireOwnerOrAdmin } from "@/lib/products/session";
import { getDashboardStats, listUnreadAlerts, listAsesorClients } from "@/lib/products/asesor-pro/queries";
import OverviewClient from "./OverviewClient";

export const dynamic = "force-dynamic";

export default async function AsesorProOverviewPage() {
  const user = await requireOwnerOrAdmin();
  const [stats, alerts, clients] = await Promise.all([
    getDashboardStats(user.id),
    listUnreadAlerts(user.id, 8),
    listAsesorClients(user.id),
  ]);

  return (
    <OverviewClient
      user={{ full_name: user.full_name, email: user.email }}
      stats={stats}
      alerts={alerts}
      recentClients={clients.slice(0, 5)}
    />
  );
}
