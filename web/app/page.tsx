import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";
import ServicesSection from "@/components/sections/ServicesSection";

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

export const metadata: Metadata = {
  title: "PACAME — Tu equipo digital completo. Potenciado por IA, liderado por humanos.",
  description:
    "Agencia digital con 7 agentes IA especializados. Diseno web desde 300 EUR, SEO, publicidad digital, redes sociales y branding para PYMEs en Espana. 60% mas barato que una agencia, 3x mas rapido.",
  alternates: { canonical: "https://pacameagencia.com" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustLogos />
      <ServicesSection />
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
