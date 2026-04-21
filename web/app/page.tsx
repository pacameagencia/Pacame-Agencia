import type { Metadata } from "next";
import dynamic from "next/dynamic";
import HomeHeroCinematic from "@/components/sections/home/HomeHeroCinematic";

// ISR: home — 1h cache
export const revalidate = 3600;

// Secciones diferidas para no bloquear First Paint del hero
const EditorialMarquee = dynamic(
  () => import("@/components/sections/home/EditorialMarquee")
);
const VisualShowcase = dynamic(
  () => import("@/components/sections/home/VisualShowcase")
);
const LogosBar = dynamic(() => import("@/components/sections/home/LogosBar"));
const HowItWorksStripe = dynamic(
  () => import("@/components/sections/home/HowItWorksStripe")
);
const ProductLines = dynamic(
  () => import("@/components/sections/home/ProductLines")
);
const StatsFatBar = dynamic(
  () => import("@/components/sections/home/StatsFatBar")
);
const HomeTestimonials = dynamic(
  () => import("@/components/sections/home/HomeTestimonials")
);
const PricingPreview = dynamic(
  () => import("@/components/sections/home/PricingPreview")
);
const BigFinalCTA = dynamic(
  () => import("@/components/sections/home/BigFinalCTA")
);
const GoldenDivider = dynamic(
  () => import("@/components/effects/GoldenDivider")
);

export const metadata: Metadata = {
  title: "PACAME — Tu equipo digital, sin contratarlo | 24 productos · 4 planes · 2 apps",
  description:
    "Agencia digital IA para PYMEs. 24 productos desde 99€, 4 planes desde 29€/mes y apps productizadas. Pago Stripe, entrega en horas, garantia 100%, sin permanencia.",
  alternates: { canonical: "https://pacameagencia.com" },
  openGraph: {
    title: "PACAME — Tu equipo digital, sin contratarlo",
    description:
      "24 productos, 4 planes mensuales, 2 apps. Calidad enterprise, velocidad IA, precio transparente.",
    url: "https://pacameagencia.com",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

export default function HomePage() {
  return (
    <>
      {/* A. Hero cinematico editorial — numbered index + bleed type + parallax */}
      <HomeHeroCinematic />

      {/* A2. Manifesto marquee — newsroom ticker bleed */}
      <EditorialMarquee />

      {/* A3. VISUAL SHOWCASE — editorial photo spreads DALL-E 3 HD */}
      <VisualShowcase />

      {/* B. Logos bar social proof (sectores placeholder) */}
      <LogosBar />

      {/* C. Como funciona — 4 pasos Stripe style */}
      <HowItWorksStripe />

      {/* D. 3 lineas producto — Marketplace / Planes / Apps */}
      <ProductLines />

      {/* E. Stats platform fat bar — KPIs animados */}
      <StatsFatBar />

      {/* Separador dorado */}
      <div className="px-6 bg-paper">
        <div className="max-w-5xl mx-auto">
          <GoldenDivider variant="star" />
        </div>
      </div>

      {/* F. Testimonials */}
      <HomeTestimonials />

      {/* G. Pricing preview */}
      <PricingPreview />

      {/* H. Final BIG CTA */}
      <BigFinalCTA />
    </>
  );
}
