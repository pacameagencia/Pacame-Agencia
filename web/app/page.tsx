import type { Metadata } from "next";
import dynamic from "next/dynamic";
import HeroFactoryAI from "@/components/cinematic/HeroFactoryAI";
import SocialProofBar from "@/components/cinematic/SocialProofBar";
import ManifestSection from "@/components/cinematic/ManifestSection";
import ToolsCarousel from "@/components/cinematic/ToolsCarousel";
import Studio from "@/components/studio/Studio";
import ThemeBodyClass from "@/components/theme/ThemeBodyClass";

// Below-the-fold: dynamic imports para mejor LCP
const AIShowcase = dynamic(() => import("@/components/cinematic/AIShowcase"));
const AgentsSpotlight = dynamic(
  () => import("@/components/cinematic/AgentsSpotlight"),
);
const CasesShowcase = dynamic(
  () => import("@/components/cinematic/CasesShowcase"),
);
const PricingTier = dynamic(() => import("@/components/cinematic/PricingTier"));
const ContactCTA = dynamic(() => import("@/components/cinematic/ContactCTA"));

export const metadata: Metadata = {
  title:
    "PACAME — Tu equipo digital. Resuelto hoy. Agencia con IA en España.",
  description:
    "Agencia digital española con 7 agentes IA + supervisión humana. Web, SEO, Ads, Social, Branding desde 300 €. 60 % más barato que una agencia tradicional, 3× más rápido.",
  alternates: { canonical: "https://pacameagencia.com" },
  openGraph: {
    title: "PACAME — Tu equipo digital. Resuelto hoy.",
    description:
      "7 agentes IA + Pablo Calleja. Web · SEO · Ads · Social · Branding desde 300 €.",
    url: "https://pacameagencia.com",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
    images: [
      {
        url: "/generated/optimized/og/home.webp",
        width: 1536,
        height: 1024,
        alt: "PACAME — Agencia digital con IA",
      },
    ],
  },
};

/**
 * PACAME Home — Sprint 25 cinematic rewrite
 *
 * Nueva narrativa Lusion + Anthropic:
 *   1. HeroCinematic     — gradient mesh + char split + magnetic CTA
 *   2. ToolsCarousel     — marquee de tools oficiales
 *   3. ManifestSection   — 5 disciplinas como manifiesto editorial
 *   4. AgentsSpotlight   — 7 agentes IA grid + Pablo
 *   5. CasesShowcase     — casos con image reveal scroll-driven
 *   6. PricingTier       — 3 planes Linear-style + anchoring competitivo
 *   7. ContactCTA        — pantalla completa final con drama
 *
 * Eliminados del home (movidos a /landing-cro si tráfico paid los necesita):
 *   - ScarcityBanner, AuthoritySection, ClientLogoWall, NichesSection,
 *     HowItWorks, ComparisonSection, TestimonialsSection, BlogPreview,
 *     GuaranteesSection, TrustLogos legacy.
 */
export default function HomePage() {
  return (
    <>
      {/* Activa la paleta tech (dark dominante) en body solo para esta página */}
      <ThemeBodyClass className="theme-tech" />

      <HeroFactoryAI />
      <Studio variant="embed" />
      <SocialProofBar />
      <ToolsCarousel />
      <AIShowcase />
      <ManifestSection />
      <AgentsSpotlight />
      <CasesShowcase />
      <PricingTier />
      <ContactCTA />
    </>
  );
}
