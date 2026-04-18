import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import PlansGrid from "@/components/plans/PlansGrid";
import AppAddonsGrid, { type AppAddonData } from "@/components/plans/AppAddonsGrid";
import type { PlanCardData } from "@/components/plans/PlanCard";
import { Star, Shield, Sparkles } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Planes PACAME — Tu equipo digital desde 29€/mes",
  description:
    "Web + RRSS + SEO + Ads + Apps IA gestionado por agentes PACAME supervisados por Pablo. Planes desde 29€/mes. Cancela cuando quieras.",
  alternates: { canonical: "https://pacameagencia.com/planes" },
  openGraph: {
    title: "Planes PACAME — Tu equipo digital completo",
    description:
      "Mucho menos de lo que pagarias a una agencia. Desde 29€/mes.",
    url: "https://pacameagencia.com/planes",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

async function fetchPlansAndApps() {
  try {
    const supabase = createServerSupabase();
    const [{ data: plans }, { data: apps }] = await Promise.all([
      supabase
        .from("subscription_plans")
        .select(
          "slug, tier, name, tagline, price_monthly_cents, price_yearly_cents, features, included_apps, is_featured, sort_order"
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("apps_catalog")
        .select("slug, name, tagline, price_monthly_cents, features, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);
    return {
      plans: (plans || []) as unknown as PlanCardData[],
      apps: (apps || []) as unknown as AppAddonData[],
    };
  } catch (err) {
    console.error("[planes] fetch failed:", err);
    return { plans: [], apps: [] };
  }
}

const faqs = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Si. Desde tu portal puedes subir o bajar de plan cuando quieras. La factura se prorratea automaticamente.",
  },
  {
    q: "¿Hay permanencia?",
    a: "No. Ningun plan tiene permanencia. Cancelas cuando quieras desde el portal y el cobro se detiene al final del periodo.",
  },
  {
    q: "¿Que incluye exactamente cada plan?",
    a: "Cada plan tiene una lista clara de features y quotas mensuales (posts, articulos, paginas, horas de soporte). Si te falta algo, compra apps sueltas o sube de plan.",
  },
  {
    q: "¿Como cancelo?",
    a: "Desde el portal: Suscripcion → Gestionar suscripcion. Stripe Billing Portal te permite cancelar en un clic. Tienes 7 dias de garantia.",
  },
  {
    q: "¿Pablo trabaja conmigo directamente?",
    a: "Si. Pablo supervisa todos los entregables. En el plan Scale tienes 8h/mes de acceso directo.",
  },
];

export default async function PlanesPage() {
  const { plans, apps } = await fetchPlansAndApps();

  return (
    <div className="min-h-screen bg-pacame-black text-pacame-white">
      {/* Hero */}
      <section className="px-4 pt-24 pb-16 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-body font-semibold uppercase tracking-wider text-olympus-gold mb-5">
            <Sparkles className="w-4 h-4" />
            Planes PACAME
          </div>
          <h1 className="font-heading font-bold text-4xl md:text-6xl leading-tight mb-5">
            Tu equipo digital completo.
            <br />
            <span className="text-olympus-gold">
              Mucho menos de lo que pagarias a una agencia.
            </span>
          </h1>
          <p className="text-pacame-white/60 font-body text-lg max-w-2xl mx-auto mb-8">
            10 agentes IA especialistas + Pablo supervisando. Web, SEO, RRSS,
            Ads, Branding y Apps productizadas. Desde 29€/mes.
          </p>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-body text-pacame-white/60">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-olympus-gold fill-olympus-gold" />
              <span>4.9/5 (500+ PYMEs)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-olympus-gold" />
              <span>Garantia 7 dias</span>
            </div>
            <div>Sin permanencia</div>
          </div>
        </div>
      </section>

      {/* Plans grid */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {plans.length === 0 ? (
            <p className="text-center text-pacame-white/50 font-body">
              No hay planes disponibles ahora mismo.
            </p>
          ) : (
            <PlansGrid plans={plans} />
          )}
        </div>
      </section>

      {/* Apps addons */}
      <AppAddonsGrid apps={apps} />

      {/* FAQ */}
      <section className="px-4 py-20 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-pacame-white mb-2">
              Preguntas frecuentes
            </h2>
            <p className="text-pacame-white/60 font-body">
              Todo lo que quieres saber antes de empezar.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl p-5 bg-dark-card border border-white/[0.06] hover:border-white/[0.12] transition"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-heading font-semibold text-pacame-white">
                    {f.q}
                  </span>
                  <span className="text-olympus-gold text-xl transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="text-pacame-white/60 font-body text-sm mt-3 leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-pacame-white mb-3">
            Empieza hoy. Sin riesgo.
          </h2>
          <p className="text-pacame-white/60 font-body mb-6">
            7 dias de garantia. Si no te convence, te devolvemos el dinero.
          </p>
          <p className="text-olympus-gold font-body text-sm">
            +500 PYMEs ya confian en PACAME
          </p>
        </div>
      </section>
    </div>
  );
}
