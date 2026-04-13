"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ui/scroll-reveal";

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
  "Web Corporativa": "#7C3AED",
  "Landing Page": "#06B6D4",
  "E-commerce": "#EA580C",
  "SEO": "#2563EB",
  "SEO Premium": "#2563EB",
  "Redes Sociales": "#EC4899",
  "Meta Ads": "#EA580C",
  "Meta Ads + Embudo": "#EA580C",
  "Google Ads": "#D97706",
  "Branding": "#7C3AED",
  "Branding Completo": "#7C3AED",
  "Paquete Despega": "#06B6D4",
  "Paquete Crece": "#16A34A",
  "Paquete Domina": "#7C3AED",
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
    color: "#7C3AED",
    initials: "CM",
  },
  {
    name: "Laura Fernandez",
    role: "Emprendedora — Barcelona",
    text: "Lance mi negocio con PACAME. Web, logo, redes y Google Ads en menos de dos semanas. Ya tengo mis primeros clientes.",
    rating: 5,
    service: "Paquete Despega",
    color: "#06B6D4",
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
    <div className="rounded-2xl p-6 border border-white/[0.06] bg-dark-card w-[340px] flex-shrink-0 mx-2.5">
      {/* Stars */}
      <div className="flex gap-0.5 mb-5">
        {[...Array(t.rating)].map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-amber-signal text-amber-signal" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-[15px] text-pacame-white/60 font-body leading-relaxed mb-6">
        &ldquo;{t.text}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-xs"
          style={{ backgroundColor: `${t.color}12`, color: t.color }}
        >
          {t.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-body font-medium text-pacame-white/80">
            {t.name}
          </div>
          <div className="text-xs text-pacame-white/30 font-body">{t.role}</div>
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
            color: SERVICE_COLORS[r.service] || "#7C3AED",
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

  return (
    <section className="section-padding bg-pacame-black relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="max-w-6xl mx-auto px-6 mb-16">
        <ScrollReveal className="text-center">
          <p className="text-[13px] font-body font-medium text-electric-violet mb-4 uppercase tracking-[0.2em]">
            Resultados reales
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6 text-balance">
            El trabajo habla.{" "}
            <span className="gradient-text-vivid">Los clientes tambien.</span>
          </h2>
        </ScrollReveal>
      </div>

      {/* Marquee */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-pacame-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-pacame-black to-transparent z-10 pointer-events-none" />

        <div className="overflow-hidden py-2">
          <div className="marquee-track">
            {marqueeItems.map((t, index) => (
              <ReviewCard key={`${t.name}-${index}`} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
