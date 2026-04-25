import { requireOwnerOrAdmin } from "@/lib/products/session";
import { listPipelineCards, listAsesorClients } from "@/lib/products/asesor-pro/queries";
import PipelineClient from "./PipelineClient";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const user = await requireOwnerOrAdmin();
  const [cards, clients] = await Promise.all([
    listPipelineCards(user.id),
    listAsesorClients(user.id),
  ]);
  return <PipelineClient initialCards={cards} clients={clients} />;
}
