import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";
import ServicesSection from "@/components/sections/ServicesSection";

// SM core sections (deferred for FCP)
const NichesSection = dynamic(() => import("@/components/sections/NichesSection"));
const HowItWorks = dynamic(() => import("@/components/sections/HowItWorks"));
const ComparisonSection = dynamic(() => import("@/components/sections/ComparisonSection"));
const TestimonialsSection = dynamic(() => import("@/components/sections/TestimonialsSection"));
const PricingSection = dynamic(() => import("@/components/sections/PricingSection"));
const AgentsSection = dynamic(() => import("@/components/sections/AgentsSection"));
const BlogPreview = dynamic(() => import("@/components/sections/BlogPreview"));
const CTASection = dynamic(() => import("@/components/sections/CTASection"));
const TrustLogos = dynamic(() => import("@/components/sections/TrustLogos"));
const GuaranteesSection = dynamic(() => import("@/components/sections/GuaranteesSection"));

// Sprint 21 CRO components (deferred — solo cliente)
const ScarcityBanner = dynamic(() => import("@/components/cro/ScarcityCounter"));
const AuthoritySection = dynamic(() => import("@/components/cro/AuthoritySection"));
const ClientLogoWall = dynamic(() => import("@/components/cro/ClientLogoWall"));

/**
 * ClassicHome — Home Spanish Modernism con 12 secciones.
 *
 * Esta es la home original de PACAME (pre-Storybook 3D). Se mantiene viva
 * en /clasica (vista preservada para Pablo y para crawlers ya indexados).
 *
 * Cuando el flag `STORYBOOK_HOME=0` (default), la ruta `/` también renderiza
 * este componente (definido en `web/app/page.tsx`).
 *
 * Reusa todas las secciones existentes en `web/components/sections/` —
 * NO se duplican. Single source of truth.
 */
export default function ClassicHome() {
  return (
    <>
      <ScarcityBanner variant="banner" />
      <Hero />
      <TrustLogos />
      <ServicesSection />
      <AuthoritySection />
      <ClientLogoWall />
      <NichesSection />
      <HowItWorks />
      <ComparisonSection />
      <TestimonialsSection />
      <PricingSection />
      <AgentsSection />
      <GuaranteesSection />
      <BlogPreview />
      <CTASection />
    </>
  );
}
