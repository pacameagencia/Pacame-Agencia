"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  {
    number: "01",
    kicker: "Construcción",
    name: "Desarrollo web",
    description:
      "Desde landing pages de alto impacto hasta aplicaciones complejas a medida. Next.js, Tailwind, Supabase. Stack moderno, SEO desde el código.",
    price: "Desde 300 €",
    deadline: "2–40 días",
    href: "/servicios#web",
    accent: "#B54E30",
  },
  {
    number: "02",
    kicker: "Visibilidad",
    name: "SEO",
    description:
      "Posicionamiento orgánico que genera demanda real. Auditorías técnicas, contenido, link building con criterio editorial.",
    price: "Desde 300 €",
    deadline: "60–90 días",
    href: "/servicios#seo",
    accent: "#283B70",
  },
  {
    number: "03",
    kicker: "Conversación",
    name: "Redes sociales",
    description:
      "Contenido que conecta y convierte. Estrategia, diseño, copy y community — todo en un mismo equipo.",
    price: "Desde 300 €/mes",
    deadline: "Calendario en 48h",
    href: "/servicios#redes",
    accent: "#E8B730",
  },
  {
    number: "04",
    kicker: "Adquisición",
    name: "Publicidad digital",
    description:
      "Meta Ads y Google Ads con embudos completos y automatización. Medimos todo, optimizamos semanalmente.",
    price: "Desde 400 €/mes",
    deadline: "Live en 3–5 días",
    href: "/servicios#ads",
    accent: "#CB6B47",
  },
  {
    number: "05",
    kicker: "Identidad",
    name: "Branding",
    description:
      "Identidad visual que se recuerda. Logo, paleta, tipografía y manual de marca. Diseño con intención, no plantillas.",
    price: "Desde 400 €",
    deadline: "Logo en 3–5 días",
    href: "/servicios#branding",
    accent: "#6B7535",
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="relative section-padding bg-paper">
      {/* Pattern azulejo decorativo top-right */}
      <div
        className="absolute top-16 right-0 w-80 h-80 bg-azulejo opacity-40 pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* ── Header estilo portada de sección ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 pb-10 border-b-2 border-ink">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" className="text-terracotta-500" aria-hidden="true">
                <circle cx="7" cy="7" r="6" fill="currentColor" />
              </svg>
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-terracotta-500 font-medium">
                Capítulo I
              </span>
            </div>
          </div>
          <div className="lg:col-span-7">
            <h2 className="font-display text-ink text-balance" style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", lineHeight: "1.02", letterSpacing: "-0.03em", fontWeight: 500 }}>
              Todo lo digital.
              <span className="block italic font-light" style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}>
                Un solo equipo.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-3 lg:self-end">
            <p className="font-sans text-ink-soft text-[15px] leading-relaxed">
              Desde un logo hasta un SaaS completo.
              <span className="block mt-2 font-mono text-[11px] tracking-wide text-ink-mute uppercase">
                Sin cinco proveedores. Sin fricción.
              </span>
            </p>
          </div>
        </div>

        {/* ── Grid de servicios — entradas estilo índice editorial ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {services.map((s, i) => (
            <ServiceEntry key={s.number} service={s} position={i} />
          ))}

          {/* ── Bloque "Proyecto a medida" — full card editorial ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.7, 0, 0.3, 1] }}
            className="md:col-span-2 mt-12"
          >
            <Link
              href="/contacto"
              className="group relative block bg-ink text-paper p-12 md:p-16 overflow-hidden"
              style={{ boxShadow: "6px 6px 0 #B54E30" }}
            >
              {/* Sol rotatorio fondo */}
              <svg
                className="absolute -right-20 -bottom-20 w-96 h-96 opacity-15 animate-sun-rotate"
                viewBox="0 0 400 400"
                aria-hidden="true"
              >
                <circle cx="200" cy="200" r="80" fill="#E8B730" />
                {Array.from({ length: 20 }).map((_, idx) => (
                  <line
                    key={idx}
                    x1="200"
                    y1="100"
                    x2="200"
                    y2="70"
                    stroke="#E8B730"
                    strokeWidth="4"
                    transform={`rotate(${(idx * 360) / 20} 200 200)`}
                  />
                ))}
              </svg>

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                <div className="md:col-span-8">
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-mustard-500 mb-4 block">
                    Proyecto a medida
                  </span>
                  <h3 className="font-display text-paper mb-5" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: "1.02", fontWeight: 500 }}>
                    ¿Tienes algo más específico entre manos?
                  </h3>
                  <p className="font-sans text-paper/70 text-[17px] leading-relaxed max-w-xl">
                    Cuéntanos qué necesitas y te decimos si encaja, cuánto cuesta y cuándo lo tendrás. Treinta minutos, sin compromiso.
                  </p>
                </div>
                <div className="md:col-span-4 md:text-right">
                  <span className="inline-flex items-center gap-3 font-sans font-medium text-mustard-500 text-[17px]">
                    Reservar reunión
                    <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* ── CTA inferior ── */}
        <div className="mt-20 text-center">
          <Link
            href="/servicios"
            className="group inline-flex items-center gap-3 link-editorial font-display text-2xl italic text-ink"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
          >
            Ver todos los servicios y precios
            <ArrowUpRight className="w-5 h-5 text-terracotta-500 group-hover:rotate-45 transition-transform duration-500" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ServiceEntry({ service, position }: { service: typeof services[number]; position: number }) {
  const isRightColumn = position % 2 === 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: (position % 2) * 0.08, ease: [0.7, 0, 0.3, 1] }}
      className={`group border-ink/20 ${
        isRightColumn ? "border-t md:border-t md:border-l" : "border-t"
      } ${position >= services.length - 2 && position < services.length ? "md:border-b" : ""}`}
    >
      <Link href={service.href} className="block p-8 md:p-10 hover:bg-sand-100 transition-colors duration-500 relative">
        {/* Número ornamental */}
        <span
          className="absolute top-6 right-8 font-display italic text-6xl opacity-25 group-hover:opacity-60 transition-opacity duration-500"
          style={{
            color: service.accent,
            fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
            fontWeight: 300,
          }}
        >
          {service.number}
        </span>

        <div className="relative z-10 max-w-sm">
          <span className="kicker block mb-4" style={{ color: service.accent }}>
            {service.kicker}
          </span>
          <h3 className="font-display font-medium text-3xl text-ink mb-4 group-hover:text-terracotta-500 transition-colors duration-300" style={{ fontVariationSettings: '"SOFT" 40, "WONK" 0, "opsz" 100' }}>
            {service.name}
          </h3>
          <p className="font-sans text-ink-soft text-[15px] leading-relaxed mb-6">
            {service.description}
          </p>

          {/* Meta en línea editorial */}
          <div className="flex items-center gap-4 pt-5 border-t border-ink/15">
            <span className="font-mono text-[11px] tracking-wide uppercase text-ink font-medium">
              {service.price}
            </span>
            <span className="w-1 h-1 rounded-full bg-ink-mute" aria-hidden="true" />
            <span className="font-mono text-[11px] tracking-wide uppercase text-ink-mute">
              {service.deadline}
            </span>
            <ArrowUpRight className="w-4 h-4 ml-auto text-ink-mute group-hover:text-terracotta-500 group-hover:rotate-45 transition-all duration-500" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
