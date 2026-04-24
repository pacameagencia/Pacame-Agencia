import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  getPersona,
  listPersonas,
  listPersonasByVertical,
} from "@/lib/data/portfolio-personas";
import { getPortfolioVertical } from "@/lib/data/portfolio";

const ScarcityCounter = dynamic(() => import("@/components/cro/ScarcityCounter"));
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock,
  Shield,
  Award,
  Sparkles,
  AlertTriangle,
  Star,
  ChevronRight,
} from "lucide-react";

// ISR — vertical/persona revalida 5 min
export const revalidate = 300;

// SSG todas las 24 personas en build time (+ nuevas al invalidar cache)
export async function generateStaticParams() {
  const personas = await listPersonas();
  return personas.map((p) => ({
    slug: p.vertical_slug,
    persona: p.persona_slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; persona: string }>;
}): Promise<Metadata> {
  const { slug, persona } = await params;
  const p = await getPersona(slug, persona);
  if (!p) return { title: "Persona no encontrada · PACAME" };

  const title = p.meta_title || `${p.persona_name} — PACAME ${slug}`;
  const description =
    p.meta_description ||
    p.pain_headline.slice(0, 160);

  return {
    title,
    description,
    alternates: {
      canonical: `https://pacameagencia.com/portafolio/${slug}/${persona}`,
    },
    openGraph: {
      title,
      description,
      url: `https://pacameagencia.com/portafolio/${slug}/${persona}`,
      siteName: "PACAME",
      type: "article",
      images: [
        {
          url: p.og_image_url || p.hero_image_url || "/opengraph-image",
          width: 1200,
          height: 630,
        },
      ],
    },
    robots: { index: true, follow: true },
  };
}

export default async function PersonaPage({
  params,
}: {
  params: Promise<{ slug: string; persona: string }>;
}) {
  const { slug, persona } = await params;
  const [p, vertical, siblings] = await Promise.all([
    getPersona(slug, persona),
    getPortfolioVertical(slug),
    listPersonasByVertical(slug),
  ]);

  if (!p || !vertical) notFound();

  const primaryColor = vertical.color_primary || "#2872A1";
  const accentColor = vertical.color_accent || "#F1E194";

  const price = p.starting_price_cents
    ? `${(p.starting_price_cents / 100).toLocaleString("es-ES")}€`
    : "Bajo presupuesto";
  const timeline = p.timeline_days
    ? p.timeline_days <= 21
      ? `${p.timeline_days} dias`
      : `${Math.round(p.timeline_days / 7)} semanas`
    : "21-28 dias";

  const relatedPersonas = siblings
    .filter((s) => s.persona_slug !== p.persona_slug)
    .slice(0, 2);

  // JSON-LD BreadcrumbList + Service schemas
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://pacameagencia.com/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Portfolio",
          item: "https://pacameagencia.com/portafolio",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: vertical.sub_brand,
          item: `https://pacameagencia.com/portafolio/${slug}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: p.persona_name,
          item: `https://pacameagencia.com/portafolio/${slug}/${persona}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: p.persona_name,
      provider: {
        "@type": "ProfessionalService",
        name: "PACAME Agencia Digital",
        url: "https://pacameagencia.com",
      },
      areaServed: { "@type": "Country", name: "ES" },
      description: p.pain_headline,
      ...(p.starting_price_cents
        ? {
            offers: {
              "@type": "Offer",
              price: (p.starting_price_cents / 100).toString(),
              priceCurrency: "EUR",
              priceValidUntil: "2027-12-31",
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
    },
  ];

  return (
    <main className="min-h-screen bg-paper pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          1. IMAGE BAND — cinematic opening
          ═══════════════════════════════════════════════════════════════ */}
      {p.hero_image_url && (
        <section className="relative pt-4 pb-2">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between border-b border-ink/10 pb-3 mb-4 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">
              <span style={{ color: accentColor }}>
                PACAME {vertical.sub_brand}
              </span>
              <span className="hidden md:inline">
                {p.persona_emoji ? `${p.persona_emoji} ` : ""}
                {p.persona_name}
              </span>
              <span>Edicion Ocean · N°24</span>
            </div>
            <div
              className="relative aspect-[21/9] rounded-3xl overflow-hidden border border-ink/10"
              style={{
                boxShadow: `0 30px 80px -20px ${primaryColor}40, 0 12px 32px -8px rgba(0,0,0,0.40)`,
              }}
            >
              <Image
                src={p.hero_image_url}
                alt={`PACAME ${p.persona_name} — escena editorial`}
                fill
                sizes="(max-width: 1400px) 100vw, 1400px"
                className="object-cover"
                quality={88}
                priority
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-8 flex items-baseline justify-between gap-4 border-t border-white/15 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-white/70">
                <span>
                  Persona {p.sort_order || 1} de {siblings.length}
                </span>
                <span style={{ color: accentColor }}>{p.persona_tagline}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          2. HERO SPLIT — pain headline left + sticky price card right
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 items-start">
            <div>
              {/* Section label */}
              <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-6">
                <span style={{ color: accentColor }}>§ DOLOR</span>
                <span className="h-px w-8 bg-ink/20" />
                <span>El problema que te quita el sueño</span>
              </div>

              <h1 className="font-heading font-bold text-[clamp(2rem,5vw,4.2rem)] text-ink leading-[0.92] tracking-[-0.03em] mb-8">
                {p.pain_headline}
                <span className="text-accent-burgundy">.</span>
              </h1>

              {/* Pain bullets */}
              <ul className="space-y-3 mb-10 max-w-2xl">
                {p.pain_bullets.map((bullet, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-xl bg-accent-burgundy/[0.04] border border-accent-burgundy/15"
                  >
                    <AlertTriangle
                      className="w-4 h-4 flex-shrink-0 mt-1 text-accent-burgundy"
                      strokeWidth={2}
                    />
                    <span className="text-[15px] text-ink/80 font-body leading-relaxed">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link
                  href={`/contacto?ref=persona-${slug}-${persona}`}
                  className="group inline-flex items-center gap-3 border-b-2 border-accent-gold pb-1 font-heading font-semibold text-[16px] text-ink hover:text-accent-gold transition-colors"
                >
                  <span>Reservar slot ahora</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href={`/auditoria?sector=${slug}`}
                  className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink transition-colors"
                >
                  <span>Auditoria gratis 10 min</span>
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>

            {/* Sticky price card */}
            <aside className="lg:sticky lg:top-24">
              <div
                className="relative rounded-3xl p-7 overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${primaryColor}22 0%, ${accentColor}10 100%)`,
                  border: `1px solid ${primaryColor}40`,
                }}
              >
                <div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30"
                  style={{ backgroundColor: accentColor }}
                />
                <div className="relative">
                  <div
                    className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2"
                    style={{ color: accentColor }}
                  >
                    Precio cerrado
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-heading font-bold text-ink">
                      {price}
                    </span>
                    <span className="text-ink/40 text-sm">desde · + IVA</span>
                  </div>
                  <div className="text-[13px] text-ink/60 font-body mb-5 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    Entrega {timeline} · Sin cuotas ni permanencia
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {p.deliverables.slice(0, 5).map((d, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: accentColor }}
                        />
                        <span className="text-[13px] text-ink/80 font-body leading-snug">
                          {d}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/contacto?ref=persona-${slug}-${persona}`}
                    className="block w-full text-center px-4 py-3 rounded-xl font-heading font-semibold text-sm transition"
                    style={{
                      backgroundColor: "#0A0A0A",
                      color: accentColor,
                    }}
                  >
                    Reservar tu slot
                  </Link>

                  {/* Scarcity slots disponibles este mes */}
                  <div className="mt-4">
                    <ScarcityCounter variant="card" />
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-ink/40 font-body">
                    <Shield className="w-3 h-3" />
                    <span>Garantia 30 dias o reembolso</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. SOLUTION SECTION — how we fix it
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-paper-soft/30 py-20 border-y border-ink/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-6">
            <span style={{ color: accentColor }}>§ SOLUCION</span>
            <span className="h-px w-8 bg-ink/20" />
            <span>Lo que hacemos por ti</span>
          </div>
          <h2 className="font-heading font-bold text-[clamp(1.75rem,4vw,3rem)] text-ink leading-[0.95] tracking-[-0.025em] mb-10 max-w-3xl">
            {p.solution_headline.split(" ").slice(0, -2).join(" ")}{" "}
            <span className="font-accent italic font-normal text-accent-gold">
              {p.solution_headline.split(" ").slice(-2).join(" ")}
            </span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {p.solution_bullets.map((b, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-paper border border-ink/10 hover:border-accent-gold/30 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-3 text-[12px] font-mono font-semibold"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    color: primaryColor,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="text-[14px] text-ink/80 font-body leading-relaxed">
                  {b}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          4. DELIVERABLES FULL LIST — checklist 2-col
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-6">
            <span style={{ color: accentColor }}>§ ENTREGABLES</span>
            <span className="h-px w-8 bg-ink/20" />
            <span>Todo lo que recibes</span>
          </div>
          <h2 className="font-heading font-bold text-[clamp(1.75rem,4vw,3rem)] text-ink leading-[1.05] tracking-[-0.025em] mb-10 max-w-2xl">
            Ningun humo. Solo lo que{" "}
            <span className="font-accent italic font-normal text-accent-gold">
              importa
            </span>
            .
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {p.deliverables.map((d, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-5 rounded-2xl bg-ink/[0.03] border border-ink/[0.06]"
              >
                <Check
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: accentColor }}
                />
                <span className="text-[14px] text-ink/85 font-body leading-snug">
                  {d}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. CASE STUDY — real-ish numbers with honest disclaimer
          ═══════════════════════════════════════════════════════════════ */}
      {p.case_study && (
        <section className="bg-paper-soft/20 py-20 border-y border-ink/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-6">
              <span style={{ color: accentColor }}>§ CASO DE EXITO</span>
              <span className="h-px w-8 bg-ink/20" />
              <span>{p.case_study.client_name}</span>
            </div>

            <blockquote className="max-w-3xl">
              <p className="font-accent italic text-[clamp(1.5rem,3vw,2.5rem)] text-ink leading-[1.2] mb-8">
                &ldquo;{p.case_study.quote}&rdquo;
              </p>
              <footer className="flex items-center gap-3 text-[13px] text-ink/55 font-body">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-accent-gold text-accent-gold"
                    />
                  ))}
                </div>
                <span>— {p.case_study.client_name}</span>
              </footer>
            </blockquote>

            {/* Before vs After metrics */}
            <div className="grid md:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-2xl bg-accent-burgundy/[0.04] border border-accent-burgundy/15">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent-burgundy mb-4">
                  Antes de PACAME
                </div>
                <dl className="space-y-3">
                  {Object.entries(p.case_study.before).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-[13px] text-ink/55 font-body">
                        {k.replace(/_/g, " ")}
                      </dt>
                      <dd className="text-[13px] text-ink font-mono font-semibold tabular-nums">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div
                className="p-6 rounded-2xl"
                style={{
                  backgroundColor: `${accentColor}10`,
                  border: `1px solid ${accentColor}35`,
                }}
              >
                <div
                  className="text-[10px] font-mono uppercase tracking-[0.2em] mb-4"
                  style={{ color: primaryColor }}
                >
                  Despues de PACAME
                </div>
                <dl className="space-y-3">
                  {Object.entries(p.case_study.after).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-[13px] text-ink/55 font-body">
                        {k.replace(/_/g, " ")}
                      </dt>
                      <dd className="text-[13px] text-ink font-mono font-semibold tabular-nums">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <p className="mt-6 text-[11px] text-ink/40 font-mono max-w-3xl">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {p.case_study.disclaimer}
            </p>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          6. TRUST BAND — 4 guarantees
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                Icon: Shield,
                label: "30 dias garantia",
                desc: "Refund total si no estas satisfecho",
              },
              {
                Icon: Award,
                label: "Codigo 100% tuyo",
                desc: "Sin vendor lock-in",
              },
              {
                Icon: Sparkles,
                label: "0% comision",
                desc: "Entregamos y nos vamos",
              },
              {
                Icon: Check,
                label: "Rating 4.9/5",
                desc: "47+ clientes activos",
              },
            ].map((g) => (
              <div
                key={g.label}
                className="p-5 rounded-2xl bg-ink/[0.03] border border-ink/[0.06] flex items-start gap-3"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${accentColor}18`,
                    border: `1px solid ${accentColor}35`,
                  }}
                >
                  <g.Icon className="w-4 h-4" style={{ color: accentColor }} />
                </div>
                <div className="min-w-0">
                  <div className="font-heading font-semibold text-ink text-[14px] mb-0.5">
                    {g.label}
                  </div>
                  <div className="text-[12px] text-ink/50 font-body">{g.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          7. FAQ ACCORDION
          ═══════════════════════════════════════════════════════════════ */}
      {p.faq.length > 0 && (
        <section className="py-16 border-t border-ink/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-6">
              <span style={{ color: accentColor }}>§ FAQ</span>
              <span className="h-px w-8 bg-ink/20" />
              <span>Preguntas frecuentes</span>
            </div>
            <h2 className="font-heading font-bold text-[clamp(1.75rem,3.5vw,2.5rem)] text-ink leading-[1.1] tracking-[-0.025em] mb-10">
              Todo lo que quieres saber antes de{" "}
              <span className="font-accent italic font-normal text-accent-gold">
                empezar
              </span>
              .
            </h2>
            <div className="space-y-2">
              {p.faq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-ink/[0.08] p-5 hover:border-ink/[0.18] transition-colors"
                >
                  <summary className="cursor-pointer flex items-start justify-between gap-4 font-heading font-semibold text-[15px] text-ink">
                    <span>{item.q}</span>
                    <ChevronRight
                      className="w-4 h-4 flex-shrink-0 mt-0.5 text-ink/40 transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <p className="mt-3 text-[14px] text-ink/65 font-body leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          8. RELATED PERSONAS — sibling sub-brands
          ═══════════════════════════════════════════════════════════════ */}
      {relatedPersonas.length > 0 && (
        <section className="py-16 border-t border-ink/10 bg-paper-soft/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between border-b border-ink/15 pb-3 mb-6">
              <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45">
                <span style={{ color: accentColor }}>§ MAS PERSONAS</span>
                <span className="h-px w-8 bg-ink/20" />
                <span>Dentro de PACAME {vertical.sub_brand}</span>
              </div>
              <Link
                href={`/portafolio/${slug}`}
                className="inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-[0.18em] text-ink/50 hover:text-accent-gold transition-colors"
              >
                <span>Ver vertical</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {relatedPersonas.map((rp) => (
                <Link
                  key={rp.persona_slug}
                  href={`/portafolio/${slug}/${rp.persona_slug}`}
                  className="group block p-6 rounded-2xl border border-ink/10 hover:border-accent-gold/35 hover:bg-ink/[0.02] transition-all"
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <div
                      className="text-[10px] font-mono uppercase tracking-[0.22em]"
                      style={{ color: accentColor }}
                    >
                      {rp.persona_emoji} {rp.persona_name}
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-ink/40 group-hover:text-accent-gold group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <h3 className="font-heading font-semibold text-[18px] text-ink leading-tight mb-2">
                    {rp.persona_tagline || rp.pain_headline.slice(0, 80)}
                  </h3>
                  <div className="text-[12px] font-mono text-ink/40">
                    desde{" "}
                    {rp.starting_price_cents
                      ? `${(rp.starting_price_cents / 100).toLocaleString("es-ES")}€`
                      : "consultar"}
                    {" · "}
                    {rp.timeline_days ? `${rp.timeline_days}d` : "21-28d"}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          9. FINAL CTA — editorial colophon style
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-28 border-t border-ink/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/50">
            <span className="h-px w-8 bg-ink/20" />
            <span style={{ color: accentColor }}>§ FIN · Empieza hoy</span>
            <span className="h-px w-8 bg-ink/20" />
          </div>
          <h2 className="font-heading font-bold text-[clamp(2rem,5vw,4rem)] text-ink leading-[0.95] tracking-[-0.03em] mb-6">
            ¿Listo para{" "}
            <span className="font-accent italic font-normal text-accent-gold">
              {p.persona_name.toLowerCase()}
            </span>
            {" "}tier-1
            <span className="text-accent-burgundy">?</span>
          </h2>
          <p className="text-[16px] md:text-[18px] text-ink/60 font-body leading-relaxed max-w-xl mx-auto mb-10">
            Reserva tu slot ahora. Pablo revisa tu caso en menos de 2h y te dice
            exactamente que hacemos y cuanto cuesta. Sin humo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/contacto?ref=persona-${slug}-${persona}-finalcta`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-accent-gold text-paper font-heading font-semibold text-[15px] hover:brightness-110 transition shadow-xl"
            >
              Reservar slot · {price}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/auditoria?sector=${slug}`}
              className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink transition-colors"
            >
              <span>o audit gratis 10 min</span>
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
