import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProductUser } from "@/lib/products/session";
import { getClientContext } from "@/lib/products/asesor-pro/client-queries";
import ClientShell from "./ClientShell";

export const metadata: Metadata = {
  title: "Mi panel · AsesorPro",
  robots: { index: false, follow: false },
};

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentProductUser();
  if (!user) redirect("/p/asesor-pro");
  if (user.role === "owner" || user.role === "admin") redirect("/app/asesor-pro");

  const ctx = await getClientContext(user);
  if (!ctx) redirect("/p/asesor-pro");

  return (
    <ClientShell
      user={{ id: user.id, email: user.email, full_name: user.full_name }}
      context={{ fiscal_name: ctx.fiscal_name, nif: ctx.nif }}
    >
      {children}
    </ClientShell>
  );
}
