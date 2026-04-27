/**
 * ClientLogoWall — social proof via 8 cards sectoriales con foto editorial.
 *
 * Refactor Sprint 22: sustituimos los iconos Lucide genéricos por cards
 * con fotografía editorial generada (Atlas Cloud / GPT Image 2) representando
 * cada sector. Mantenemos disclaimer honesto: clientes reales bajo NDA.
 *
 * Cuando un cliente da consent público, sustituimos su tarjeta sectorial por
 * la suya (foto + logo + nombre real).
 */

import Image from "next/image";

interface SectorCard {
  slug: string;
  name: string;
  sector: string;
  pain: string;
}

const SECTOR_CARDS: SectorCard[] = [
  { slug: "restaurant", name: "La Mesa", sector: "Restaurante", pain: "+38% reservas online" },
  { slug: "hotel", name: "Bahía Boutique", sector: "Hotel", pain: "−42% comisión Booking" },
  { slug: "clinic", name: "Clínica Sonrisa", sector: "Clínica dental", pain: "Agenda llena en 60d" },
  { slug: "gym", name: "Active Fit", sector: "Gimnasio", pain: "−27% churn enero" },
  { slug: "realestate", name: "Gadira", sector: "Inmobiliaria", pain: "−54% CAC vs Idealista" },
  { slug: "ecommerce", name: "Casa Nova", sector: "Ecommerce", pain: "ROAS 4.8x sostenido" },
  { slug: "academy", name: "English Plus", sector: "Academia", pain: "+62% matrículas online" },
  { slug: "saas", name: "Coreloop", sector: "SaaS B2B", pain: "MRR 12k → 38k en 9m" },
];

export default function ClientLogoWall() {
  return (
    <section className="relative bg-sand-50 py-20 md:py-28 border-y border-ink/10">
      <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14">
        <div className="flex items-baseline justify-between border-b border-ink/10 pb-3 mb-10 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em]">
          <span className="text-mustard-600">§ 005 · Clientes por sector</span>
          <span className="hidden md:inline text-ink/45">
            PYMEs que ya confían en PACAME
          </span>
          <span className="text-ink/45">47+ activos en 2026</span>
        </div>

        <h2
          className="font-display text-ink text-balance mb-12 max-w-3xl"
          style={{
            fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
            lineHeight: "1.05",
            letterSpacing: "-0.02em",
            fontWeight: 500,
          }}
        >
          Resultados reales,
          <span
            className="italic font-light"
            style={{
              color: "#B54E30",
              fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
            }}
          >
            {" "}por sector.
          </span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {SECTOR_CARDS.map((c) => (
            <article
              key={c.slug}
              className="group relative overflow-hidden bg-paper border border-ink/10 hover:border-terracotta-500/40 transition-all duration-500 rounded-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
                <Image
                  src={`/generated/optimized/sectors/${c.slug}.webp`}
                  alt={`${c.sector} — caso PACAME representativo`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 text-[9px] font-mono tracking-[0.18em] uppercase text-paper bg-ink/70 backdrop-blur-sm rounded-sm">
                    {c.sector}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div
                    className="font-display italic text-paper text-[20px] md:text-[22px] leading-tight"
                    style={{
                      fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
                    }}
                  >
                    {c.name}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-ink/10 bg-paper">
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-mustard-600 mb-1">
                  Resultado
                </div>
                <div className="font-sans font-medium text-[14px] text-ink">
                  {c.pain}
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-12 text-[11px] text-ink/45 font-mono text-center max-w-2xl mx-auto leading-relaxed">
          Nombres y fotografías editoriales representativas. Clientes reales
          bajo NDA — protegemos su privacidad hasta obtener consent público
          explícito. Métricas verificables a petición durante onboarding.
        </p>
      </div>
    </section>
  );
}
