"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";
import CountUpNumber from "@/components/effects/CountUpNumber";

interface Review {
  name: string;
  role: string;
  text: string;
  rating: number;
  service: string;
  color: string;
  initials: string;
}

const SERVICE_COLORS: Record<string, string> = {
  "Web Corporativa": "#B54E30",
  "Landing Page": "#283B70",
  "E-commerce": "#EA580C",
  "SEO": "#2563EB",
  "SEO Premium": "#2563EB",
  "Redes Sociales": "#EC4899",
  "Meta Ads": "#EA580C",
  "Meta Ads + Embudo": "#EA580C",
  "Google Ads": "#D97706",
  "Branding": "#B54E30",
  "Branding Completo": "#B54E30",
  "Paquete Despega": "#283B70",
  "Paquete Crece": "#16A34A",
  "Paquete Domina": "#B54E30",
  "Plan Growth Social": "#D97706",
  "ChatBot WhatsApp": "#16A34A",
};

const fallbackTestimonials: Review[] = [
  {
    name: "Carlos Martinez",
    role: "Constructor — Madrid",
    text: "En 3 dias tenia una web corporativa que ninguna agencia me habia podido hacer en 2 meses. El precio fue la mitad.",
    rating: 5,
    service: "Web Corporativa",
    color: "#B54E30",
    initials: "CM",
  },
  {
    name: "Laura Fernandez",
    role: "Emprendedora — Barcelona",
    text: "Lance mi negocio con PACAME. Web, logo, redes y Google Ads en menos de dos semanas. Ya tengo mis primeros clientes.",
    rating: 5,
    service: "Paquete Despega",
    color: "#283B70",
    initials: "LF",
  },
  {
    name: "Miguel Torres",
    role: "E-commerce — Valencia",
    text: "En 3 meses, +180% de trafico organico. La facturacion online se ha triplicado. El SEO de Atlas funciona.",
    rating: 5,
    service: "SEO Premium",
    color: "#2563EB",
    initials: "MT",
  },
  {
    name: "Ana Garcia",
    role: "Boutique Online — Sevilla",
    text: "En la primera semana ya habia recuperado la inversion en Meta Ads. El embudo funciona solo.",
    rating: 5,
    service: "Meta Ads + Embudo",
    color: "#EA580C",
    initials: "AG",
  },
  {
    name: "Roberto Sanchez",
    role: "Consultor — Bilbao",
    text: "Necesitaba rebranding completo. Nova lo entendio en la primera llamada. El resultado supero todo.",
    rating: 5,
    service: "Branding Completo",
    color: "#EC4899",
    initials: "RS",
  },
  {
    name: "Isabel Lopez",
    role: "Clinica — Malaga",
    text: "4 meses con Pulse gestionando nuestras redes. El engagement x5 y tenemos lista de espera de pacientes.",
    rating: 5,
    service: "Plan Growth Social",
    color: "#D97706",
    initials: "IL",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ReviewCard({ t }: { t: Review }) {
  return (
    <div className="rounded-2xl p-6 border border-white/[0.06] bg-dark-card w-[340px] flex-shrink-0 mx-2.5 relative overflow-hidden">
      {/* Top border accent — service color */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{
          background: `linear-gradient(to right, transparent, ${t.color}60, #E8B73040, transparent)`,
        }}
      />

      {/* Stars — golden */}
      <div className="flex gap-0.5 mb-5">
        {[...Array(t.rating)].map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-olympus-gold text-olympus-gold" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-[15px] text-ink/75 font-body leading-relaxed mb-6">
        &ldquo;{t.text}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-xs border border-white/10"
          style={{ backgroundColor: `${t.color}15`, color: t.color }}
        >
          {t.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-body font-medium text-ink/85">
            {t.name}
          </div>
          <div className="text-xs text-ink/60 font-body">{t.role}</div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>(fallbackTestimonials);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "list", limit: 12 }),
        });
        const data = await res.json();
        if (data.reviews && data.reviews.length >= 3) {
          const mapped: Review[] = data.reviews.map((r: { name: string; role: string; text: string; rating: number; service: string; city: string }) => ({
            name: r.name,
            role: r.role || (r.city ? `— ${r.city}` : ""),
            text: r.text,
            rating: r.rating,
            service: r.service || "PACAME",
            color: SERVICE_COLORS[r.service] || "#B54E30",
            initials: getInitials(r.name),
          }));
          setReviews(mapped);
        }
      } catch {
        // Keep fallback
      }
    }
    fetchReviews();
  }, []);

  const marqueeItems = [...reviews, ...reviews];
  const marqueeReverse = [...reviews].reverse();
  const marqueeReverseItems = [...marqueeReverse, ...marqueeReverse];

  return (
    <section className="section-padding bg-pacame-black relative overflow-hidden">
      {/* Golden divider */}
      <div className="px-6">
        <GoldenDivider variant="star" />
      </div>

      <div className="max-w-6xl mx-auto px-6 mb-16">
        <ScrollReveal className="text-center">
          {/* Aggregate rating */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-olympus-gold text-olympus-gold" />
              ))}
            </div>
            <span className="font-heading font-bold text-2xl text-ink">
              <CountUpNumber target={4.9} duration={2} suffix="/5" />
            </span>
          </div>

          <p className="text-[13px] font-body font-medium text-olympus-gold/70 mb-4 uppercase tracking-[0.2em]">
            Resultados reales
          </p>
          <h2 className="font-accent font-bold text-section text-ink mb-6 text-balance">
            El trabajo habla.{" "}
            <span className="gradient-text-gold">Los clientes tambien.</span>
          </h2>
        </ScrollReveal>
      </div>

      {/* Featured quote */}
      <ScrollReveal className="max-w-3xl mx-auto px-6 mb-16">
        <div className="text-center">
          {/* Golden quotation marks */}
          <svg width="40" height="32" viewBox="0 0 40 32" fill="none" className="mx-auto mb-6 opacity-40">
            <path d="M0 32V20C0 8.95 7.17 2.17 17 0L18.5 4C12.17 6.17 8.67 10.83 8 16H16V32H0ZM24 32V20C24 8.95 31.17 2.17 41 0L42.5 4C36.17 6.17 32.67 10.83 32 16H40V32H24Z" fill="#E8B730" />
          </svg>
          <p className="font-accent text-2xl sm:text-3xl text-ink/85 leading-relaxed mb-8">
            En 3 dias tenia una web corporativa que ninguna agencia me habia podido hacer en 2 meses.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-electric-violet/15 flex items-center justify-center font-heading font-bold text-sm text-electric-violet border border-electric-violet/20">
              CM
            </div>
            <div className="text-left">
              <div className="text-sm font-body font-medium text-ink/85">Carlos Martinez</div>
              <div className="text-xs text-ink/60 font-body">Constructor — Madrid</div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Double marquee */}
      <div className="relative space-y-4">
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-pacame-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-pacame-black to-transparent z-10 pointer-events-none" />

        {/* Row 1 — left to right */}
        <div className="overflow-hidden py-2">
          <div className="marquee-track">
            {marqueeItems.map((t, index) => (
              <ReviewCard key={`r1-${t.name}-${index}`} t={t} />
            ))}
          </div>
        </div>

        {/* Row 2 — right to left (reversed) */}
        <div className="overflow-hidden py-2">
          <div className="marquee-track" style={{ animationDirection: "reverse" }}>
            {marqueeReverseItems.map((t, index) => (
              <ReviewCard key={`r2-${t.name}-${index}`} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
