import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  TrendingUp,
  Sparkles,
  Share2,
  AlertTriangle,
} from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ServiceBundleItem } from "@/lib/finder/rules";

// Dynamic — each slug is unique, no benefit to ISR
export const dynamic = "force-dynamic";

interface QuizResultRow {
  slug: string;
  sector: string | null;
  business_size: string | null;
  goal: string | null;
  budget: string | null;
  urgency: string | null;
  persona_slug: string | null;
  recommended_bundle: ServiceBundleItem[];
  total_cents: number | null;
  timeline_days: number | null;
  created_at: string;
}

async function getResult(slug: string): Promise<QuizResultRow | null> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("quiz_results")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as QuizResultRow) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await getResult(slug);
  if (!r) return { title: "Resultado no encontrado · PACAME" };
  return {
    title: `Tu plan PACAME personalizado · ${slug} `,
    description: `Recomendacion tailor-made basada en tus respuestas del quiz: bundle de ${r.recommended_bundle.length} servicios.`,
    robots: { index: false, follow: true },
    alternates: {
      canonical: `https://pacameagencia.com/encuentra-tu-solucion/${slug}`,
    },
  };
}

function formatEuros(cents: number | null): string {
  if (!cents) return "";
  return `${(cents / 100).toLocaleString("es-ES")}€`;
}

const SECTOR_LABELS: Record<string, string> = {
  restaurante: "Restaurante",
  hotel: "Hotel",
  clinica: "Clinica",
  gym: "Gym / Fitness",
  inmobiliaria: "Inmobiliaria",
  ecommerce: "Ecommerce",
  formacion: "Formacion",
  saas: "SaaS",
  otro: "Negocio",
};

const GOAL_LABELS: Record<string, string> = {
  "mas-leads": "Capturar mas leads",
  "mejor-conversion": "Convertir mejor",
  "ahorrar-tiempo": "Ahorrar tiempo operativo",
  "expandir-canales": "Expandir a mas canales",
  "todo-en-uno": "Sistema todo-en-uno",
};

export default async function QuizResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = await getResult(slug);
  if (!r) notFound();

  const bundle = r.recommended_bundle || [];
  const subtotal = bundle.reduce((s, i) => s + i.price_cents, 0);
  const discount = subtotal - (r.total_cents || 0);
  const hasDiscount = discount > 0;
  const sectorLabel = r.sector ? SECTOR_LABELS[r.sector] || r.sector : "tu negocio";
  const goalLabel = r.goal ? GOAL_LABELS[r.goal] || r.goal : "";

  // Personalized headline
  const firstSentence = `Para tu ${sectorLabel.toLowerCase()}, recomendamos ${goalLabel.toLowerCase()}`;

  return (
    <main className="min-h-screen bg-paper pb-24">
      {/* Header chrono */}
      <div className="border-b border-ink/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-baseline justify-between text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">
          <span className="text-accent-gold">Tu plan personalizado</span>
          <span className="hidden md:inline">Ref: {slug}</span>
          <span>
            {new Date(r.created_at).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16">
        {/* Hero result */}
        <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-6">
          <span className="text-accent-gold">§ RESULTADO</span>
          <span className="h-px w-8 bg-ink/20" />
          <span>{bundle.length} servicios recomendados</span>
        </div>
        <h1 className="font-heading font-bold text-[clamp(2rem,5vw,4rem)] text-ink leading-[0.95] tracking-[-0.03em] mb-6 max-w-4xl">
          {firstSentence.split(" ").slice(0, -2).join(" ")}{" "}
          <span className="font-accent italic font-normal text-accent-gold">
            {firstSentence.split(" ").slice(-2).join(" ")}
          </span>
          <span className="text-accent-burgundy">.</span>
        </h1>

        <p className="text-[16px] md:text-[18px] text-ink/60 font-body leading-relaxed max-w-2xl mb-10">
          Basado en tus 5 respuestas, hemos seleccionado{" "}
          <strong className="text-ink">el bundle minimo-viable</strong> que
          mueve tu aguja. Sin relleno. Sin humo.
        </p>

        {/* Persona link si aplica */}
        {r.persona_slug && r.sector && r.sector !== "otro" && (
          <div className="mb-12 p-5 rounded-2xl bg-accent-gold/[0.06] border border-accent-gold/25">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent-gold mb-1">
                  Mejor match
                </div>
                <div className="font-heading font-semibold text-[17px] text-ink">
                  Ficha completa:{" "}
                  <span className="font-accent italic font-normal">
                    PACAME {r.sector} / {r.persona_slug.replace(/-/g, " ")}
                  </span>
                </div>
              </div>
              <Link
                href={`/portafolio/${r.sector}/${r.persona_slug}`}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper font-heading font-semibold text-[13px] hover:bg-ink/90 transition"
              >
                Ver ficha completa
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Bundle cards */}
        <div className="flex items-baseline justify-between border-b border-ink/15 pb-3 mb-6">
          <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45">
            <span className="text-accent-gold">§ BUNDLE</span>
            <span className="h-px w-8 bg-ink/20" />
            <span>Lo que te recomendamos</span>
          </div>
          {hasDiscount && (
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent-gold">
              -{Math.round((discount / subtotal) * 100)}% bundle discount
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {bundle.map((item, i) => (
            <div
              key={item.slug}
              className="p-5 rounded-2xl bg-ink/[0.03] border border-ink/[0.08]"
            >
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent-gold">
                  N°{String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[11px] font-mono text-ink/50">
                  {formatEuros(item.price_cents)}
                </span>
              </div>
              <h3 className="font-heading font-bold text-[17px] text-ink leading-tight mb-2">
                {item.name}
              </h3>
              <p className="text-[13px] text-ink/55 font-body leading-relaxed">
                {item.why}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="rounded-3xl border border-ink/[0.08] bg-paper-soft/30 overflow-hidden mb-10">
          <div className="p-6 md:p-8">
            <div className="flex items-baseline justify-between gap-4 text-[14px] font-body text-ink/60 mb-1.5">
              <span>Subtotal ({bundle.length} servicios)</span>
              <span className="font-mono">{formatEuros(subtotal)}</span>
            </div>
            {hasDiscount && (
              <div className="flex items-baseline justify-between gap-4 text-[14px] font-body text-mint mb-3">
                <span>Bundle discount 15%</span>
                <span className="font-mono">-{formatEuros(discount)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 pt-3 border-t border-ink/10 text-[18px] md:text-[22px]">
              <span className="font-heading font-semibold text-ink">
                Total tailor-made
              </span>
              <span className="font-heading font-bold text-accent-gold tabular-nums">
                {formatEuros(r.total_cents || subtotal)}
              </span>
            </div>
            {r.timeline_days && (
              <div className="mt-4 pt-4 border-t border-ink/5 flex items-center gap-2 text-[13px] text-ink/60 font-body">
                <Clock className="w-4 h-4 text-accent-gold" />
                Entrega estimada:{" "}
                <strong className="text-ink">
                  {r.timeline_days <= 21
                    ? `${r.timeline_days} dias`
                    : `${Math.round(r.timeline_days / 7)} semanas`}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            href={`/contacto?ref=quiz-${slug}`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-accent-gold text-paper font-heading font-semibold text-[15px] hover:brightness-110 transition shadow-xl"
          >
            Reservar slot con Pablo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/encuentra-tu-solucion"
            className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink transition-colors"
          >
            <span>Rehacer quiz</span>
            <span aria-hidden>↻</span>
          </Link>
          <div className="inline-flex items-center gap-2 text-[12px] text-ink/40 font-body ml-auto">
            <Share2 className="w-3.5 h-3.5" />
            <span>
              Comparte: pacameagencia.com/encuentra-tu-solucion/
              <strong className="text-ink/70 font-mono">{slug}</strong>
            </span>
          </div>
        </div>

        {/* Micro next steps */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {[
            {
              Icon: Sparkles,
              title: "1. Revisa tu bundle",
              desc: "Pablo lo valida y te envia propuesta formal en 2h",
            },
            {
              Icon: TrendingUp,
              title: "2. Kick-off 15 min",
              desc: "Videocall donde afinamos scope + contrato cerrado",
            },
            {
              Icon: Check,
              title: "3. Entrega garantia 30d",
              desc: "Si no esta tier-1, devolucion total sin preguntas",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="p-5 rounded-2xl bg-ink/[0.02] border border-ink/[0.06]"
            >
              <step.Icon className="w-5 h-5 text-accent-gold mb-3" />
              <div className="font-heading font-semibold text-[15px] text-ink mb-1">
                {step.title}
              </div>
              <div className="text-[13px] text-ink/55 font-body leading-relaxed">
                {step.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Honest disclaimer */}
        <p className="text-[11px] text-ink/40 font-mono max-w-3xl flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          Recomendacion generada algoritmicamente basada en tus 5 respuestas.
          Pablo la revisa antes de enviar propuesta formal y puede sugerir
          ajustes segun contexto especifico.
        </p>
      </div>
    </main>
  );
}
