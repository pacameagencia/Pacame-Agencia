import { redirect } from "next/navigation";
import { getCurrentProductUser } from "@/lib/products/session";
import { getClientContext } from "@/lib/products/asesor-pro/client-queries";
import NewInvoiceForm from "./NewInvoiceForm";

export const dynamic = "force-dynamic";

export default async function NuevaFacturaPage() {
  const user = await getCurrentProductUser();
  if (!user || user.role !== "client_of") redirect("/p/asesor-pro");
  const ctx = await getClientContext(user);
  if (!ctx) redirect("/p/asesor-pro");

  return (
    <NewInvoiceForm
      issuerName={ctx.fiscal_name}
      issuerNif={ctx.nif}
      nextNumber={`${ctx.invoice_prefix}${String(ctx.invoice_next_number).padStart(4, "0")}`}
    />
  );
}
