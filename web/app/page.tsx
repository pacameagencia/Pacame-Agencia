import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import ServicesSection from "@/components/sections/ServicesSection";
import AgentsSection from "@/components/sections/AgentsSection";
import HowItWorks from "@/components/sections/HowItWorks";
import PricingSection from "@/components/sections/PricingSection";
import ComparisonSection from "@/components/sections/ComparisonSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import BlogPreview from "@/components/sections/BlogPreview";
import CTASection from "@/components/sections/CTASection";

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
      <ServicesSection />
      <HowItWorks />
      <ComparisonSection />
      <TestimonialsSection />
      <PricingSection />
      <AgentsSection />
      <BlogPreview />
      <CTASection />
    </>
  );
}
