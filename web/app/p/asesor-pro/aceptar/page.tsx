import type { Metadata } from "next";
import AcceptInviteClient from "./AcceptInviteClient";

export const metadata: Metadata = {
  title: "Aceptar invitación · AsesorPro",
  description: "Tu asesor te ha invitado a su panel. Crea tu cuenta para empezar a facturar.",
  robots: { index: false, follow: false },
};

export default async function AceptarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <AcceptInviteClient token={token ?? ""} />;
}
