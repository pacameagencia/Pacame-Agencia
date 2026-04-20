import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { ArrowRight, Sparkles, Check, Shield, Zap } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Apps productizadas IA | PACAME",
  description:
    "Apps listas para instalar en tu negocio: WhatsApp IA 24/7, reservas online, y mas. Setup en 10 minutos, sin permanencia.",
  alternates: { canonical: "https://pacameagencia.com/apps" },
  openGraph: {
    title: "Apps productizadas con IA para PYMEs | PACAME",
    description: "Asistente WhatsApp IA, reservas online, automatizaciones. Instala en minutos.",
    url: "https://pacameagencia.com/apps",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

interface AppRow {
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price_monthly_cents: number;
  price_yearly_cents: number | null;
  integrations: string[];
  category: string | null;
  tags: string[] | null;
  is_featured: boolean;
  benefits: Array<{ title: string; icon: string }>;
}

async function getApps(): Promise<AppRow[]> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("apps_catalog")
    .select(
      "slug, name, tagline, description, price_monthly_cents, price_yearly_cents, integrations, category, tags, is_featured, benefits"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data || []) as unknown as AppRow[];
}

export default async function AppsPage() {
  const apps = await getApps();

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-olympus-radial pointer-events-none opacity-60" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-body font-semibold text-accent-gold uppercase tracking-wider bg-accent-gold/10 rounded-full px-3 py-1 mb-6 border border-accent-gold/20">
            <Sparkles className="w-3 h-3" />
            Apps productizadas IA
          </span>
          <h1 className="font-accent font-bold text-4xl sm:text-6xl text-ink mb-6 text-balance">
            Apps que trabajan por ti.
          </h1>
          <p className="text-xl text-ink/60 font-body max-w-2xl mx-auto mb-10 font-light">
            Instala, configura en 10 minutos, deja que la IA haga el trabajo pesado. Sin
            permanencia, cancela cuando quieras.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-ink/60 font-body">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-accent-gold" />
              Setup 10 min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-accent-gold" />
              Sin permanencia
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-accent-gold" />
              Cancel 1-click
            </span>
          </div>
        </div>
      </section>

      {/* Apps grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          {apps.length === 0 ? (
            <div className="text-center text-ink/50 font-body py-16">
              Aun no hay apps publicadas.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {apps.map((app) => (
                <Link
                  key={app.slug}
                  href={`/apps/${app.slug}`}
                  className="group relative rounded-2xl p-7 bg-paper-deep border border-ink/[0.06] hover:border-accent-gold/40 transition card-golden-shine"
                >
                  {app.is_featured && (
                    <div className="absolute top-5 right-5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent-gold bg-accent-gold/10 border border-accent-gold/20 rounded-full px-2 py-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Destacado
                    </div>
                  )}

                  <div className="text-[11px] font-mono uppercase tracking-wider text-ink/40 mb-3">
                    {app.category || "app"}
                  </div>

                  <h2 className="font-heading font-bold text-2xl text-ink mb-2 group-hover:text-accent-gold transition">
                    {app.name}
                  </h2>
                  <p className="text-ink/70 font-body mb-5">
                    {app.tagline}
                  </p>

                  {/* Top 3 benefits */}
                  {app.benefits && app.benefits.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {app.benefits.slice(0, 3).map((b, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-ink/70 font-body"
                        >
                          <Check className="w-4 h-4 text-accent-gold flex-shrink-0 mt-0.5" />
                          <span>{b.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-end justify-between pt-5 border-t border-ink/[0.06]">
                    <div>
                      <div className="font-heading font-bold text-3xl text-ink">
                        {(app.price_monthly_cents / 100).toFixed(0)}€
                      </div>
                      <div className="text-xs text-ink/40 font-body">
                        por mes · sin permanencia
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-sm font-heading font-semibold text-accent-gold group-hover:translate-x-0.5 transition-transform">
                      Ver detalles
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-accent font-bold text-2xl sm:text-3xl text-ink mb-4">
            ¿Quieres una app a medida?
          </h2>
          <p className="text-ink/60 font-body mb-6">
            Si tu negocio necesita algo especifico, hablamos. Desarrollamos apps productizadas
            con IA a partir de 299€/mes segun complejidad.
          </p>
          <a
            href="mailto:hola@pacameagencia.com?subject=App custom PACAME"
            className="inline-flex items-center gap-2 bg-accent-gold text-paper font-heading font-semibold px-6 py-3 rounded-xl hover:bg-accent-gold/90 transition"
          >
            Hablar con Pablo
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
