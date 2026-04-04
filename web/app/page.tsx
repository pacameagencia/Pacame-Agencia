import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import ServicesSection from "@/components/sections/ServicesSection";
import AgentsSection from "@/components/sections/AgentsSection";
import HowItWorks from "@/components/sections/HowItWorks";
import PricingSection from "@/components/sections/PricingSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import BlogPreview from "@/components/sections/BlogPreview";
import CTASection from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "PACAME — Tu equipo digital. Sin límites.",
  description:
    "Agencia digital con agentes IA especializados. Diseño web, SEO, publicidad digital, redes sociales y branding para PYMEs españolas. Más rápido, mejor y más barato.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <AgentsSection />
      <HowItWorks />
      <PricingSection />
      <TestimonialsSection />
      <BlogPreview />
      <CTASection />
    </>
  );
}
