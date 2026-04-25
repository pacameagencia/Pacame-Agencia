import { redirect } from "next/navigation";
import { getCurrentProductUser } from "@/lib/products/session";
import { getClientContext } from "@/lib/products/asesor-pro/client-queries";
import NewExpenseForm from "./NewExpenseForm";

export const dynamic = "force-dynamic";

export default async function NuevoGastoPage() {
  const user = await getCurrentProductUser();
  if (!user || user.role !== "client_of") redirect("/p/asesor-pro");
  const ctx = await getClientContext(user);
  if (!ctx) redirect("/p/asesor-pro");
  return <NewExpenseForm />;
}
