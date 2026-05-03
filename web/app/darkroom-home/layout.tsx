/**
 * DarkRoom · Layout de la landing pública.
 *
 * Servida en `darkroomcreative.cloud/` mediante rewrite del middleware
 * (URL externa = `/`, ruta interna = `/darkroom-home`).
 *
 * Acceso directo a `/darkroom-home/*` desde cualquier host está bloqueado
 * en el middleware → 404. Esta ruta es solo destino de rewrite interno.
 *
 * Importa el `<DarkRoomCookieBanner />` para cumplir LSSI 22.2 desde la
 * primera visita. Único punto público con links a `/legal/cookies` y
 * `/legal/privacidad`.
 */

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import DarkRoomCookieBanner from "@/components/darkroom/DarkRoomCookieBanner";

export const metadata: Metadata = {
  metadataBase: new URL("https://darkroomcreative.cloud"),
  title: "DarkRoom · Stack creativo premium por 29€/mes",
  description:
    "Acceso colectivo al stack creativo premium (Adobe, Figma, ChatGPT, Midjourney…) por 29€/mes en lugar de 240€. Membresía colectiva, sin tarjeta para 14 días.",
  alternates: { canonical: "https://darkroomcreative.cloud" },
  openGraph: {
    type: "website",
    title: "DarkRoom · Stack creativo premium por 29€/mes",
    description:
      "Membresía colectiva al stack creativo premium. 29€/mes vs 240€ retail. 14 días gratis sin tarjeta.",
    url: "https://darkroomcreative.cloud",
    siteName: "DarkRoom",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "DarkRoom · Stack creativo premium por 29€/mes",
    description:
      "Membresía colectiva al stack creativo premium. 29€/mes vs 240€ retail.",
  },
  robots: {
    // Esta página SÍ se indexa (es la home pública DarkRoom).
    // Las páginas /legal/* están noindex en su propio layout.
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function DarkRoomHomeLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#F5F5F0",
        fontFamily:
          'Inter, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
        fontSize: 16,
        lineHeight: 1.65,
        overflowX: "hidden",
      }}
    >
      {children}
      <DarkRoomCookieBanner />
    </div>
  );
}
