import type { Metadata } from "next";
import Link from "next/link";
import { listPortfolioVerticals } from "@/lib/data/portfolio";
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
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Portfolio — 8 webs profesionales por industria | PACAME",
  description:
    "PACAME Restaurante, Hotel, Clinica, Gym, Inmo, Shop, Academy, Core. Webs y SaaS por industria listos en 7-21 dias. 0% comisiones, 100% tuyo.",
  alternates: { canonical: "https://pacameagencia.com/portafolio" },
  openGraph: {
    title: "8 sub-marcas PACAME — webs por industria",
    description: "Restaurante · Hotel · Clinica · Gym · Inmo · Shop · Academy · SaaS",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

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

export default async function PortfolioIndex() {
  const verticals = await listPortfolioVerticals();

  return (
    <main className="min-h-screen bg-paper pb-24">
      {/* Hero */}
      <section className="relative pt-8 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(241,225,148,0.08),transparent_60%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-accent-gold/10 border border-accent-gold/25">
              <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-accent-gold">
                Portfolio · 8 sub-marcas PACAME
              </span>
            </div>
            <h1 className="font-heading font-bold text-5xl md:text-7xl text-ink leading-[0.95] mb-5 max-w-4xl mx-auto">
              Una web <span className="text-accent-gold">hecha para tu sector</span>.
              No una plantilla generica.
            </h1>
            <p className="text-ink/60 font-body text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Cada sub-marca PACAME es una base construida y probada en{" "}
              <strong className="text-ink">clientes reales del sector</strong>.
              Tu solo eliges cual y la adaptamos a tu negocio en dias.
            </p>
          </div>

          {/* Value pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 mb-6">
            {[
              "Desde 799€",
              "Entrega 7-21 dias",
              "Codigo 100% tuyo",
              "Sin permanencia",
              "0% comisiones",
              "SEO local incluido",
            ].map((v) => (
              <span
                key={v}
                className="text-[12px] font-mono text-ink/70 bg-ink/[0.04] border border-ink/[0.08] px-3 py-1.5 rounded-full"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {verticals.map((v) => {
            const Icon = ICONS[v.icon_key || ""] || Sparkles;
            const price = v.cta_price_cents
              ? `Desde ${(v.cta_price_cents / 100).toLocaleString("es-ES")}€`
              : "Bajo presupuesto";
            return (
              <Link
                key={v.slug}
                href={`/portafolio/${v.slug}`}
                className="group relative overflow-hidden rounded-3xl bg-paper border border-ink/[0.06] hover:border-ink/[0.15] transition-all hover:-translate-y-1 hover:shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${v.color_primary || "#2872A1"}15 0%, transparent 60%)`,
                }}
              >
                <div className="p-6 flex flex-col h-full">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border"
                    style={{
                      backgroundColor: `${v.color_primary}18`,
                      borderColor: `${v.color_primary}35`,
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: v.color_accent || "#F1E194" }}
                    />
                  </div>

                  {/* Sub-brand + label */}
                  <div
                    className="text-[10px] font-mono uppercase tracking-[0.15em] mb-1"
                    style={{ color: v.color_accent || "#F1E194" }}
                  >
                    {v.sub_brand}
                  </div>
                  <div className="text-[11px] text-ink/40 font-body mb-4">
                    {v.vertical_label}
                  </div>

                  {/* Headline */}
                  <h3 className="font-heading font-bold text-lg text-ink leading-tight mb-3 flex-1">
                    {v.hero_headline}
                  </h3>

                  {/* Footer row */}
                  <div className="flex items-center justify-between pt-4 border-t border-ink/[0.06] mt-auto">
                    <div>
                      <div className="text-[13px] font-heading font-semibold text-ink">
                        {price}
                      </div>
                      <div className="text-[11px] text-ink/40 font-mono uppercase tracking-wider">
                        {v.cta_timeline}
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center border border-ink/10 group-hover:border-accent-gold/40 group-hover:bg-accent-gold/10 transition-all">
                      <ArrowRight className="w-4 h-4 text-ink/50 group-hover:text-accent-gold transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Value prop + CTA final */}
        <section className="mt-20 p-10 md:p-14 rounded-3xl border border-accent-gold/20 bg-gradient-to-br from-accent-gold/[0.05] via-transparent to-brand-primary/[0.05] text-center">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-accent-gold mb-3">
            ¿Tu sector no esta?
          </div>
          <h3 className="font-heading font-bold text-3xl md:text-4xl text-ink leading-tight mb-4 max-w-2xl mx-auto">
            Te hacemos la web perfecta a medida en{" "}
            <span className="text-accent-gold">14 dias.</span>
          </h3>
          <p className="text-ink/60 font-body max-w-xl mx-auto mb-6 leading-relaxed">
            Cuentanos tu industria en 5 minutos. Pablo te arma un plan con
            presupuesto cerrado, timeline y deliverables concretos.
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-accent-gold text-paper font-heading font-semibold text-sm hover:brightness-110 transition"
          >
            <Check className="w-4 h-4" /> Hablar con Pablo
          </Link>
        </section>
      </section>
    </main>
  );
}
