/**
 * GET /api/products/asesor-pro/dashboard
 *
 * Stats agregados + alertas no leídas + clientes recientes.
 * Diseñado para 1 sola petición desde el overview.
 */

import { NextResponse } from "next/server";
import { getCurrentProductUser } from "@/lib/products/session";
import { getDashboardStats, listUnreadAlerts, listAsesorClients } from "@/lib/products/asesor-pro/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [stats, alerts, recentClients] = await Promise.all([
    getDashboardStats(user.id),
    listUnreadAlerts(user.id, 8),
    listAsesorClients(user.id),
  ]);

  return NextResponse.json({
    stats,
    alerts,
    recent_clients: recentClients.slice(0, 5),
  });
}
