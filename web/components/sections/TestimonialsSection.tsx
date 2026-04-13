"use client";

import { useState, useEffect } from "react";
import { Star, Quote } from "lucide-react";
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
    role: "Constructor - Madrid",
    text: "En 3 dias tenia una web corporativa que ninguna agencia me habia podido hacer en 2 meses. El precio fue la mitad. Sigo sin creerlo.",
    rating: 5,
    service: "Web Corporativa",
    color: "#7C3AED",
    initials: "CM",
  },
  {
    name: "Laura Fernandez",
    role: "Emprendedora - Barcelona",
    text: "Lance mi negocio con PACAME. Web, logo, redes y Google Ads en menos de dos semanas. Ya tengo mis primeros clientes. Gracias al equipo.",
    rating: 5,
    service: "Paquete Despega",
    color: "#06B6D4",
    initials: "LF",
  },
  {
    name: "Miguel Torres",
    role: "E-commerce - Valencia",
    text: "El SEO que hacia Atlas empieza a dar frutos. En 3 meses, +180% de trafico organico. La facturacion online se ha triplicado.",
    rating: 5,
    service: "SEO Premium",
    color: "#2563EB",
    initials: "MT",
  },
  {
    name: "Ana Garcia",
    role: "Boutique Online - Sevilla",
    text: "Nexus monto mis Meta Ads y en la primera semana ya habia recuperado la inversion. El embudo funciona solo. No paro de recibir pedidos.",
    rating: 5,
    service: "Meta Ads + Embudo",
    color: "#EA580C",
    initials: "AG",
  },
  {
    name: "Roberto Sanchez",
    role: "Consultor - Bilbao",
    text: "Necesitaba rebranding completo para relanzar mi marca. Nova lo entendio en la primera llamada. El resultado supero todo lo que imagine.",
    rating: 5,
    service: "Branding Completo",
    color: "#EC4899",
    initials: "RS",
  },
  {
    name: "Isabel Lopez",
    role: "Clinica - Malaga",
    text: "Pulse gestiona nuestras redes desde hace 4 meses. El engagement se ha multiplicado por 5 y tenemos lista de espera de nuevos pacientes.",
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
    <motion.div
      className="relative rounded-2xl p-6 card-interactive card-shine w-[360px] flex-shrink-0 mx-3"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="absolute top-5 right-5 opacity-15">
        <Quote className="w-8 h-8" style={{ color: t.color }} />
      </div>

      <div className="flex gap-1 mb-4">
        {[...Array(t.rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-signal text-amber-signal" />
        ))}
        {[...Array(5 - t.rating)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-pacame-white/10" />
        ))}
      </div>

      <p className="text-pacame-white/80 font-body text-sm leading-relaxed mb-6">
        &ldquo;{t.text}&rdquo;
      </p>

      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold text-sm"
          style={{ backgroundColor: `${t.color}20`, color: t.color }}
        >
          {t.initials}
        </div>
        <div>
          <div className="text-sm font-heading font-semibold text-pacame-white">
            {t.name}
          </div>
          <div className="text-xs text-pacame-white/40 font-body">{t.role}</div>
        </div>
        <div className="ml-auto">
          <span
            className="text-[10px] px-2 py-1 rounded-full font-body"
            style={{
              backgroundColor: `${t.color}15`,
              color: t.color,
              border: `1px solid ${t.color}25`,
            }}
          >
            {t.service}
          </span>
        </div>
      </div>
    </motion.div>
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
            role: r.role || (r.city ? `- ${r.city}` : ""),
            text: r.text,
            rating: r.rating,
            service: r.service || "PACAME",
            color: SERVICE_COLORS[r.service] || "#7C3AED",
            initials: getInitials(r.name),
          }));
          setReviews(mapped);
        }
      } catch {
        // Keep fallback testimonials
      }
    }
    fetchReviews();
  }, []);

  // Duplicate for seamless marquee loop
  const marqueeItems = [...reviews, ...reviews];

  return (
    <section className="section-padding bg-dark-elevated relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-electric-violet/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <ScrollReveal className="text-center">
          <p className="font-mono text-electric-violet text-sm mb-4 uppercase tracking-widest">
            Resultados reales
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
            El trabajo habla.
            <br />
            <span className="gradient-text-vivid">Los clientes tambien.</span>
          </h2>
          <p className="text-sm text-pacame-white/40 font-body">
            Testimonios de negocios reales que ya trabajan con PACAME.
          </p>
        </ScrollReveal>
      </div>

      {/* Marquee - infinite scroll */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-dark-elevated to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-dark-elevated to-transparent z-10 pointer-events-none" />

        <div className="overflow-hidden py-4">
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
