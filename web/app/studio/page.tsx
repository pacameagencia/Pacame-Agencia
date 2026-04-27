import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Studio from "@/components/studio/Studio";
import ThemeBodyClass from "@/components/theme/ThemeBodyClass";

const ContactCTA = dynamic(() => import("@/components/cinematic/ContactCTA"));

export const metadata: Metadata = {
  title: "Studio — Tu web en 48 horas, no en 6 meses · PACAME",
  description:
    "Cuéntanos qué quieres y la IA te enseña un mockup real en 30 segundos. Si te gusta, en menos de 48 horas la tienes. 3 generaciones gratis al día.",
  alternates: { canonical: "https://pacameagencia.com/studio" },
  openGraph: {
    title: "PACAME Studio — Tu web ahora, no en 6 meses",
    description:
      "Mockup real generado con IA en vivo. Compras self-service o hablas con Pablo.",
    url: "https://pacameagencia.com/studio",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
    images: ["/generated/optimized/og/home.webp"],
  },
};

/**
 * /studio — Sprint 28 cinematic AI-native page
 *
 * El visitor escribe brief → SSE streaming → Claude estructura mockup +
 * Flux Schnell genera 3-5 imágenes → muestra mockup interactivo + 2 CTAs:
 *   - "Comprar ahora" (lleva a checkout con plan recomendado)
 *   - "Hablar con Pablo" (cal.com)
 *
 * Rate limit: 3 generaciones/IP/24h.
 * Coste por gen: ~$0.012-0.015 (Claude Haiku + Flux Schnell).
 */
export default function StudioPage() {
  return (
    <>
      <ThemeBodyClass className="theme-tech" />
      <Studio variant="full" />
      <ContactCTA />
    </>
  );
}
