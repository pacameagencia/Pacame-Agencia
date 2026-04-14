import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal de Cliente — PACAME",
  description: "Accede a tu portal de cliente PACAME. Consulta el estado de tu proyecto, contenido y pagos.",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
