import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getPortfolioVertical,
  listPortfolioVerticals,
} from "@/lib/data/portfolio";
import { listPersonasByVertical } from "@/lib/data/portfolio-personas";
import {
  Utensils,
  Bed,
  Stethoscope,
  Dumbbell,
  Home as HomeIcon,
  ShoppingBag,
  GraduationCap,
  Zap,
  ArrowRight,
  Check,
  Star,
  Sparkles,
  Rocket,
  Shield,
  Clock,
  type LucideIcon,
} from "lucide-react";

export const revalidate = 300;

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  bed: Bed,
  stethoscope: Stethoscope,
  dumbbell: Dumbbell,
  home: HomeIcon,
  "shopping-bag": ShoppingBag,
  "graduation-cap": GraduationCap,
  zap: Zap,
};

export async function generateStaticParams() {
  const list = await listPortfolioVerticals();
  return list.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const v = await getPortfolioVertical(slug);
  if (!v) return { title: "Sub-marca no encontrada · PACAME" };

  return {
    title: `${v.sub_brand} — ${v.hero_headline.slice(0, 60)}`,
    description: v.hero_sub?.slice(0, 160) || undefined,
    alternates: { canonical: `https://pacameagencia.com/portafolio/${v.slug}` },
    openGraph: {
      title: `${v.sub_brand} · ${v.vertical_label}`,
      description: v.hero_sub || undefined,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
  };
}

export default async function VerticalLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const v = await getPortfolioVertical(slug);
  if (!v) notFound();

  const Icon = ICONS[v.icon_key || ""] || Sparkles;
  const price = v.cta_price_cents
    ? `${(v.cta_price_cents / 100).toLocaleString("es-ES")}€`
    : "Bajo presupuesto";

  // Related verticals (up to 4, skip current)
  const allList = await listPortfolioVerticals();
  const related = allList.filter((r) => r.slug !== v.slug).slice(0, 4);

  // Personas dentro del vertical (3 sub-audiences)
  const personas = await listPersonasByVertical(v.slug);

  // Pasos del proceso (storytelling)
  const steps = [
    {
      Icon: Sparkles,
      kicker: "DIA 1",
      title: "Onboarding en 30 min",
      desc: "Videocall con Pablo. Cuentamelo todo: objetivos, marca, competencia. Te mando el contrato cerrado con precio final — cero sorpresas.",
    },
    {
      Icon: Rocket,
      kicker: `DIA 2-${v.cta_timeline.includes("21") ? "20" : v.cta_timeline.includes("14") ? "13" : v.cta_timeline.includes("10") ? "9" : "6"}`,
      title: "Construimos + review semanal",
      desc: "Recibes preview cada 2-3 dias. Comentas, ajustamos en vivo. Nada de 'espera 3 semanas a ver'.",
    },
    {
      Icon: Check,
      kicker: "ENTREGA",
      title: "Web en tu dominio + formacion 1h",
      desc: "Deploy, configuracion SEO, analytics conectado y call de formacion para que lo gestiones tu. Garantia 30 dias.",
    },
  ];

  // Buyer objection busters
  const guarantees = [
    { Icon: Shield, label: "Garantia 30 dias", desc: "Si no te convence, refund" },
    { Icon: Clock, label: `Entrega ${v.cta_timeline.toLowerCase()}`, desc: "O compensacion del 10%" },
    { Icon: Sparkles, label: "Codigo 100% tuyo", desc: "Sin vendor lock-in" },
    { Icon: Check, label: `${v.proof_rating}/5 rating`, desc: `${v.proof_clients}+ ${v.vertical_label.toLowerCase()} activos` },
  ];

  const primaryColor = v.color_primary || "#2872A1";
  const accentColor = v.color_accent || "#F1E194";

  // Mapeo slug → imagen DALL-E 3 generada editorialmente
  const HERO_IMAGE_BY_SLUG: Record<string, string> = {
    restaurante: "/verticals/restaurante.png",
    hotel: "/verticals/hotel.png",
    clinica: "/verticals/clinica.png",
    gym: "/verticals/gym.png",
    inmobiliaria: "/verticals/inmobiliaria.png",
    ecommerce: "/verticals/ecommerce.png",
    formacion: "/verticals/formacion.png",
    saas: "/verticals/saas.png",
  };
  const heroImageSrc = HERO_IMAGE_BY_SLUG[v.slug];

  return (
    <main className="min-h-screen bg-paper pb-24">
      {/* Editorial image band — cinematic opening with DALL-E 3 HD vertical hero */}
      {heroImageSrc && (
        <section
          className="relative pt-4 pb-2 overflow-hidden"
          aria-label={`${v.sub_brand} — imagen editorial`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between border-b border-ink/10 pb-3 mb-4 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">
              <span style={{ color: accentColor }}>{v.sub_brand}</span>
              <span className="hidden md:inline">{v.vertical_label}</span>
              <span>Edicion Ocean · N°24</span>
            </div>
            <div
              className="relative aspect-[21/9] rounded-3xl overflow-hidden border border-ink/10"
              style={{
                boxShadow: `0 30px 80px -20px ${primaryColor}40, 0 12px 32px -8px rgba(0,0,0,0.40)`,
              }}
            >
              <Image
                src={heroImageSrc}
                alt={`PACAME ${v.sub_brand} — ${v.hero_headline}`}
                fill
                sizes="(max-width: 1400px) 100vw, 1400px"
                className="object-cover"
                quality={90}
                priority
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-8 flex items-baseline justify-between gap-4 border-t border-white/15 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-white/70">
                <span>Fotografia editorial Pacame</span>
                <span style={{ color: accentColor }}>
                  Arquitectura {v.vertical_label.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="relative pt-8 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 20% 30%, ${primaryColor}25 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, ${accentColor}20 0%, transparent 55%)`,
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full border"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  borderColor: `${primaryColor}35`,
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span
                  className="text-[11px] font-mono uppercase tracking-[0.18em]"
                  style={{ color: accentColor }}
                >
                  {v.sub_brand}
                </span>
              </div>

              <h1 className="font-heading font-bold text-4xl md:text-6xl text-ink leading-[1.05] mb-5">
                {v.hero_headline}
              </h1>

              {v.hero_sub && (
                <p className="text-ink/65 font-body text-lg md:text-xl leading-relaxed mb-6 max-w-2xl">
                  {v.hero_sub}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Link
                  href={`/contacto?ref=portafolio-${v.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-heading font-semibold text-sm hover:brightness-110 transition shadow-lg"
                  style={{
                    backgroundColor: accentColor,
                    color: "#0A0A0A",
                  }}
                >
                  {v.cta_label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/auditoria?sector=${v.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-heading font-medium text-sm text-ink border border-ink/15 hover:border-ink/30 hover:bg-ink/[0.04] transition"
                >
                  Auditoria gratis 10 min
                </Link>
              </div>

              {/* Proof bar */}
              <div className="flex flex-wrap items-center gap-5 text-[13px]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 fill-accent-gold text-accent-gold"
                      />
                    ))}
                  </div>
                  <span className="text-ink/80 font-body font-medium">
                    {v.proof_rating}/5
                  </span>
                  <span className="text-ink/40 font-body">
                    · {v.proof_clients}+ clientes activos
                  </span>
                </div>
                <span className="text-ink/20">·</span>
                <span className="text-ink/60 font-body">
                  Entrega garantizada <strong className="text-ink">{v.cta_timeline.toLowerCase()}</strong>
                </span>
              </div>
            </div>

            {/* Hero visual — price card premium */}
            <div className="lg:justify-self-end w-full max-w-sm">
              <div
                className="relative rounded-3xl p-7 overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${primaryColor}25 0%, ${accentColor}10 100%)`,
                  border: `1px solid ${primaryColor}40`,
                }}
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ backgroundColor: accentColor }} />

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
                    <span className="text-ink/40 text-sm">+ IVA</span>
                  </div>
                  <div className="text-[13px] text-ink/60 font-body mb-5">
                    One-time · Sin cuotas ni permanencia
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {v.features.slice(0, 5).map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: accentColor }}
                        />
                        <span className="text-[13px] text-ink/80 font-body leading-snug">
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/contacto?ref=portafolio-${v.slug}`}
                    className="block w-full text-center px-4 py-3 rounded-xl font-heading font-semibold text-sm transition"
                    style={{
                      backgroundColor: "#0A0A0A",
                      color: accentColor,
                    }}
                  >
                    Reservar hueco
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features full list */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-accent-gold mb-3">
          Todo lo que incluye
        </div>
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-ink leading-tight mb-10 max-w-2xl">
          Deliverables especificos.{" "}
          <span className="text-accent-gold">Ningun humo.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {v.features.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-5 rounded-2xl bg-ink/[0.03] border border-ink/[0.06]"
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${accentColor}20`,
                  color: accentColor,
                }}
              >
                <Check className="w-4 h-4" />
              </div>
              <p className="text-ink/85 font-body text-[14px] leading-snug pt-1">{f}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process storytelling */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-accent-gold mb-3">
          Como trabajamos
        </div>
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-ink leading-tight mb-10 max-w-2xl">
          Sin sorpresas. Sin reuniones eternas.
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((step) => (
            <div
              key={step.kicker}
              className="relative p-6 rounded-2xl bg-ink/[0.03] border border-ink/[0.06] hover:border-accent-gold/25 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  borderColor: `${primaryColor}40`,
                }}
              >
                <step.Icon className="w-4.5 h-4.5" style={{ color: accentColor }} />
              </div>
              <div
                className="text-[10px] font-mono uppercase tracking-[0.18em] mb-1"
                style={{ color: accentColor }}
              >
                {step.kicker}
              </div>
              <h3 className="font-heading font-semibold text-lg text-ink leading-tight mb-2">
                {step.title}
              </h3>
              <p className="text-ink/60 font-body text-[14px] leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Guarantees */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="rounded-3xl border border-accent-gold/20 p-8 md:p-12 bg-gradient-to-br from-accent-gold/[0.06] via-transparent to-brand-primary/[0.04]">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-accent-gold mb-3 text-center">
            Garantias concretas
          </div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-ink text-center mb-10 max-w-xl mx-auto">
            Sin letra pequena.{" "}
            <span className="text-accent-gold">Por escrito.</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {guarantees.map((g) => (
              <div key={g.label} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-accent-gold/15 border border-accent-gold/30 flex items-center justify-center mx-auto mb-3">
                  <g.Icon className="w-5 h-5 text-accent-gold" />
                </div>
                <div className="font-heading font-semibold text-ink text-sm mb-1">
                  {g.label}
                </div>
                <div className="text-[12px] text-ink/50 font-body leading-snug">
                  {g.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personas dentro del vertical — sub-audiences clickable */}
      {personas.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="flex items-baseline justify-between border-b border-ink/15 pb-3 mb-8">
            <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45">
              <span style={{ color: accentColor }}>§ SUB-PERSONAS</span>
              <span className="h-px w-8 bg-ink/20" />
              <span>
                {personas.length} variantes dentro de PACAME {v.sub_brand}
              </span>
            </div>
          </div>
          <h3 className="font-heading font-bold text-[clamp(1.5rem,3.5vw,2.5rem)] text-ink leading-[1.05] tracking-[-0.02em] mb-10 max-w-2xl">
            PACAME {v.sub_brand} tiene{" "}
            <span className="font-accent italic font-normal text-accent-gold">
              tu version
            </span>
            .
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {personas.map((p) => {
              const personaPrice = p.starting_price_cents
                ? `${(p.starting_price_cents / 100).toLocaleString("es-ES")}€`
                : "bajo presupuesto";
              return (
                <Link
                  key={p.persona_slug}
                  href={`/portafolio/${v.slug}/${p.persona_slug}`}
                  className="group block p-6 rounded-3xl border border-ink/[0.08] hover:border-accent-gold/40 bg-paper hover:bg-ink/[0.02] transition-all hover:-translate-y-1"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}08 0%, transparent 50%)`,
                  }}
                >
                  <div className="flex items-baseline justify-between mb-4">
                    <div
                      className="text-[10px] font-mono uppercase tracking-[0.22em]"
                      style={{ color: accentColor }}
                    >
                      {p.persona_emoji} {p.persona_name}
                    </div>
                    <span className="text-[10px] font-mono text-ink/30">
                      desde {personaPrice}
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-[17px] text-ink leading-tight tracking-[-0.015em] mb-3 min-h-[3rem]">
                    {p.persona_tagline}
                  </h4>
                  <p className="text-[13px] text-ink/55 font-body leading-relaxed line-clamp-2 mb-5">
                    {p.pain_headline}
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-heading font-semibold text-ink group-hover:text-accent-gold transition-colors">
                    Ver ficha completa
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 text-center">
        <h2 className="font-heading font-bold text-4xl md:text-5xl text-ink leading-tight mb-5">
          Vamos a construir tu{" "}
          <span style={{ color: accentColor }}>{v.vertical_label.toLowerCase()}</span>{" "}
          online.
        </h2>
        <p className="text-ink/60 font-body text-lg mb-8 max-w-xl mx-auto">
          Llamada de 15 min con Pablo. Sin presion. Si encaja, arrancamos esta semana.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/contacto?ref=portafolio-${v.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-accent-gold text-paper font-heading font-semibold text-sm hover:brightness-110 transition shadow-lg"
          >
            Reservar llamada <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/portafolio"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-ink border border-ink/15 hover:border-ink/30 font-heading font-medium text-sm transition"
          >
            Ver otros sectores
          </Link>
        </div>
      </section>

      {/* Related verticals */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/40 mb-3">
            Otras sub-marcas
          </div>
          <h3 className="font-heading font-semibold text-2xl text-ink mb-8">
            Explora mas sectores PACAME
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((r) => {
              const RIcon = ICONS[r.icon_key || ""] || Sparkles;
              return (
                <Link
                  key={r.slug}
                  href={`/portafolio/${r.slug}`}
                  className="group p-5 rounded-2xl bg-ink/[0.03] border border-ink/[0.06] hover:border-ink/[0.15] hover:bg-ink/[0.05] transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${r.color_primary}12 0%, transparent 60%)`,
                  }}
                >
                  <RIcon
                    className="w-5 h-5 mb-3"
                    style={{ color: r.color_accent || "#F1E194" }}
                  />
                  <div className="font-heading font-semibold text-ink text-sm mb-1 group-hover:text-accent-gold transition-colors">
                    {r.sub_brand}
                  </div>
                  <div className="text-[12px] text-ink/50 font-body">
                    {r.vertical_label}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
