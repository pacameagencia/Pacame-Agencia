import type { Metadata } from "next";
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
const ScarcityBanner = dynamic(
  () => import("@/components/cro/ScarcityCounter")
);
const AuthoritySection = dynamic(
  () => import("@/components/cro/AuthoritySection")
);
const ClientLogoWall = dynamic(
  () => import("@/components/cro/ClientLogoWall")
);

export const metadata: Metadata = {
  title: "PACAME — Tu equipo digital completo. Potenciado por IA, liderado por humanos.",
  description:
    "Agencia digital con 10 agentes IA especializados. 24 productos desde 99€, 5 herramientas gratis, quiz de recomendacion. 60% mas barato que una agencia, 3x mas rapido.",
  alternates: { canonical: "https://pacameagencia.com" },
};

export default function HomePage() {
  return (
    <>
      {/* CRO: scarcity slots top banner (client-only) */}
      <ScarcityBanner variant="banner" />

      {/* SM home — diseno editorial Spanish Modernism */}
      <Hero />
      <TrustLogos />
      <ServicesSection />

      {/* CRO: authority + client logos refuerzan trust pre-niches */}
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
