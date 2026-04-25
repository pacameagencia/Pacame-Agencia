import { requireOwnerOrAdmin } from "@/lib/products/session";
import { listAsesorClients } from "@/lib/products/asesor-pro/queries";
import ClientesClient from "./ClientesClient";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const user = await requireOwnerOrAdmin();
  const clients = await listAsesorClients(user.id);
  return <ClientesClient initialClients={clients} />;
}
