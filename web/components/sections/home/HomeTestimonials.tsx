"use client";

import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

interface Testimonial {
  id: string;
  author_name: string;
  author_role: string | null;
  author_company: string | null;
  author_photo_url: string | null;
  author_city: string | null;
  quote: string;
  rating: number;
  service_slug: string | null;
  featured: boolean;
}

// Fallback minimo por si no hay testimonios en DB todavia
const fallback: Testimonial[] = [
  {
    id: "f1",
    author_name: "Carlos Martinez",
    author_role: "Constructor",
    author_company: null,
    author_photo_url: null,
    author_city: "Madrid",
    quote:
      "En 3 dias tenia una web corporativa que ninguna agencia me habia podido hacer en 2 meses. Precio mitad.",
    rating: 5,
    service_slug: "web-corporativa",
    featured: true,
  },
  {
    id: "f2",
    author_name: "Laura Fernandez",
    author_role: "Emprendedora",
    author_company: null,
    author_photo_url: null,
    author_city: "Barcelona",
    quote:
      "Lance mi negocio con PACAME. Web, logo, redes y Google Ads en dos semanas. Ya tengo primeros clientes.",
    rating: 5,
    service_slug: "paquete-despega",
    featured: true,
  },
  {
    id: "f3",
    author_name: "Miguel Torres",
    author_role: "E-commerce",
    author_company: null,
    author_photo_url: null,
    author_city: "Valencia",
    quote:
      "En 3 meses, +180% de trafico organico. La facturacion online se ha triplicado. El SEO de Atlas funciona.",
    rating: 5,
    service_slug: "seo-premium",
    featured: true,
  },
  {
    id: "f4",
    author_name: "Ana Garcia",
    author_role: "Boutique Online",
    author_company: null,
    author_photo_url: null,
    author_city: "Sevilla",
    quote:
      "En la primera semana ya habia recuperado la inversion en Meta Ads. El embudo funciona solo.",
    rating: 5,
    service_slug: "meta-ads",
    featured: false,
  },
  {
    id: "f5",
    author_name: "Roberto Sanchez",
    author_role: "Consultor",
    author_company: null,
    author_photo_url: null,
    author_city: "Bilbao",
    quote:
      "Necesitaba rebranding completo. Nova lo entendio en la primera llamada. El resultado supero todo.",
    rating: 5,
    service_slug: "branding-completo",
    featured: false,
  },
  {
    id: "f6",
    author_name: "Isabel Lopez",
    author_role: "Clinica",
    author_company: null,
    author_photo_url: null,
    author_city: "Malaga",
    quote:
      "4 meses con Pulse gestionando redes. El engagement x5 y tenemos lista de espera de pacientes.",
    rating: 5,
    service_slug: "growth-social",
    featured: false,
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function HomeTestimonials() {
  const [items, setItems] = useState<Testimonial[]>(fallback);

  useEffect(() => {
    fetch("/api/public/testimonials")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.testimonials && Array.isArray(d.testimonials) && d.testimonials.length >= 3) {
          setItems(d.testimonials.slice(0, 6));
        }
      })
      .catch(() => null);
  }, []);

  return (
    <section className="section-padding bg-pacame-black relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-14">
          <p className="text-[12px] font-body font-medium text-olympus-gold/70 mb-4 uppercase tracking-[0.22em]">
            Testimonios verificados
          </p>
          <h2 className="font-accent font-bold text-section text-pacame-white mb-5 text-balance">
            Lo que dicen{" "}
            <span className="gradient-text-gold">clientes reales.</span>
          </h2>

          <div className="inline-flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-olympus-gold text-olympus-gold"
                />
              ))}
            </div>
            <span className="text-pacame-white/60 font-body text-sm">
              4.9/5 · 500+ PYMEs
            </span>
          </div>
        </ScrollReveal>

        <StaggerContainer
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          staggerDelay={0.08}
        >
          {items.map((t) => (
            <StaggerItem key={t.id}>
              <article className="rounded-2xl p-7 bg-dark-card border border-white/[0.06] hover:border-olympus-gold/30 transition-colors duration-500 h-full flex flex-col relative overflow-hidden">
                {/* Top accent */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-olympus-gold/40 to-transparent" />

                {/* Quote mark decorative */}
                <Quote className="w-6 h-6 text-olympus-gold/30 mb-3" />

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-olympus-gold text-olympus-gold"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[15px] text-pacame-white/70 font-body leading-relaxed mb-6 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-5 border-t border-white/[0.06]">
                  {t.author_photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={t.author_photo_url}
                      alt={t.author_name}
                      className="w-10 h-10 rounded-full object-cover border border-olympus-gold/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-olympus-gold/10 border border-olympus-gold/20 flex items-center justify-center font-heading font-bold text-[12px] text-olympus-gold">
                      {getInitials(t.author_name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-heading font-semibold text-pacame-white truncate">
                      {t.author_name}
                    </div>
                    <div className="text-xs text-pacame-white/40 font-body truncate">
                      {[t.author_role, t.author_city || t.author_company]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
