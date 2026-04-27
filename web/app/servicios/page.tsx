import type { Metadata } from "next";
import dynamic from "next/dynamic";
import HeroCinematic from "@/components/cinematic/HeroCinematic";
import ManifestSection from "@/components/cinematic/ManifestSection";
import ThemeBodyClass from "@/components/theme/ThemeBodyClass";

const PricingTier = dynamic(() => import("@/components/cinematic/PricingTier"));
const ContactCTA = dynamic(() => import("@/components/cinematic/ContactCTA"));

export const metadata: Metadata = {
  title: "Servicios — Web, SEO, Ads, Social, Branding · PACAME",
  description:
    "5 disciplinas digitales gestionadas por 7 agentes IA + Pablo Calleja. Desde 300 €. Calidad de agencia, velocidad de máquina, precio justo.",
  alternates: { canonical: "https://pacameagencia.com/servicios" },
  openGraph: {
    title: "Servicios PACAME — 5 disciplinas, un solo equipo",
    description:
      "Web, SEO, Ads, Social, Branding. 60 % más barato que una agencia tradicional.",
    url: "https://pacameagencia.com/servicios",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
    images: ["/generated/optimized/og/servicios.webp"],
  },
};

/**
 * /servicios — Sprint 25 cinematic rewrite
 *
 * El marketplace dinámico (servicios DB-backed con Stripe) sigue
 * disponible en /servicios/[slug]. Esta página index ahora es manifesto +
 * planes + CTA, sin marketplace grid (que era pesado y desordenado).
 */
export default function ServiciosPage() {
  return (
    <>
      <ThemeBodyClass className="theme-tech" />
      <HeroCinematic />
      <ManifestSection />
      <PricingTier />
      <ContactCTA />
    </>
  );
}
