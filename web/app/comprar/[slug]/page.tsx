import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "@/lib/supabase/server";
import ComprarClient from "./ComprarClient";
import {
  ArrowLeft,
  Shield,
  Lock,
  CreditCard,
  Clock,
  Check,
  Award,
  Zap,
  Star,
} from "lucide-react";

export const revalidate = 300;

interface ServiceDetail {
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price_cents: number;
  currency: string;
  deliverable_kind: string;
  delivery_sla_hours: number;
  features: string[];
  faq: { q: string; a: string }[];
  cover_image_url: string | null;
  revisions_included: number;
}

async function getService(slug: string): Promise<ServiceDetail | null> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("service_catalog")
      .select(
        "slug, name, tagline, description, price_cents, currency, deliverable_kind, delivery_sla_hours, features, faq, cover_image_url, revisions_included"
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!data) return null;
    return {
      ...data,
      features: Array.isArray(data.features) ? data.features : [],
      faq: Array.isArray(data.faq) ? data.faq : [],
    } as ServiceDetail;
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
  const s = await getService(slug);
  if (!s) return { title: "Producto no encontrado · PACAME" };
  return {
    title: `Comprar ${s.name} · ${(s.price_cents / 100).toFixed(0)}€ · PACAME`,
    description: s.tagline || s.description?.slice(0, 160) || undefined,
    alternates: { canonical: `https://pacameagencia.com/comprar/${s.slug}` },
    robots: { index: false, follow: true }, // checkout pages no se indexan
  };
}

export default async function ComprarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = await getService(slug);
  if (!s) notFound();

  const price = (s.price_cents / 100).toLocaleString("es-ES");
  const currency = (s.currency || "EUR").toUpperCase();

  return (
    <main className="min-h-screen bg-paper pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Back link */}
        <Link
          href={`/servicios/${s.slug}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-body text-ink/50 hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a detalles del producto
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-accent-gold mb-2">
            Finaliza tu pedido
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-5xl text-ink leading-tight max-w-3xl">
            A 60 segundos de tener tu{" "}
            <span className="text-accent-gold">{s.name.toLowerCase()}</span>.
          </h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10">
          {/* LEFT: Review producto */}
          <aside className="space-y-6">
            {/* Product summary card */}
            <div className="rounded-2xl border border-ink/[0.08] overflow-hidden bg-ink/[0.02]">
              {s.cover_image_url ? (
                <div className="aspect-[16/9] relative bg-ink overflow-hidden">
                  <Image
                    src={s.cover_image_url}
                    alt={s.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gradient-to-br from-brand-primary/20 via-accent-gold/10 to-transparent" />
              )}

              <div className="p-6">
                <div className="text-[11px] font-mono uppercase tracking-wider text-accent-gold mb-1">
                  PACAME · {s.deliverable_kind.replace(/_/g, " ")}
                </div>
                <h2 className="font-heading font-bold text-2xl text-ink leading-tight mb-2">
                  {s.name}
                </h2>
                {s.tagline && (
                  <p className="text-ink/60 font-body text-[15px] leading-relaxed mb-5">
                    {s.tagline}
                  </p>
                )}

                {/* Price breakdown */}
                <div className="space-y-2 pt-5 border-t border-ink/[0.06] text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-ink/60">Precio producto</span>
                    <span className="text-ink font-medium">{price} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Entrega</span>
                    <span className="text-ink font-medium">
                      {s.delivery_sla_hours <= 24
                        ? `${s.delivery_sla_hours}h`
                        : `${Math.round(s.delivery_sla_hours / 24)} dias`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Revisiones incluidas</span>
                    <span className="text-ink font-medium">
                      {s.revisions_included || 2}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-ink/[0.06] text-[16px]">
                    <span className="text-ink font-heading font-semibold">
                      Total (IVA incluido)
                    </span>
                    <span className="text-accent-gold font-heading font-bold text-lg">
                      {price} €
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features reminder */}
            {s.features.length > 0 && (
              <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] p-6">
                <div className="text-[11px] font-mono uppercase tracking-wider text-accent-gold mb-3">
                  Lo que recibes
                </div>
                <ul className="space-y-2">
                  {s.features.slice(0, 6).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-ink/80">
                      <Check className="w-4 h-4 text-accent-gold flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trust pills — visible mientras usuario rellena datos */}
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              {[
                { Icon: Shield, label: "Garantia 30 dias", sub: "Satisfaccion o refund" },
                { Icon: Lock, label: "Pago seguro", sub: "Stripe SSL TLS 1.3" },
                { Icon: Clock, label: "Entrega en horas", sub: "Velocidad IA + humano" },
                { Icon: Award, label: "4.9/5 rating", sub: "47+ clientes activos" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="flex items-start gap-2.5 p-3.5 rounded-xl border border-ink/[0.06] bg-ink/[0.02]"
                >
                  <div className="w-7 h-7 rounded-lg bg-accent-gold/10 border border-accent-gold/25 flex items-center justify-center flex-shrink-0">
                    <t.Icon className="w-3.5 h-3.5 text-accent-gold" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-heading font-semibold text-ink text-[13px] leading-tight">
                      {t.label}
                    </div>
                    <div className="text-ink/45 text-[11px] mt-0.5 leading-tight">
                      {t.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof quote */}
            <blockquote className="p-6 rounded-2xl bg-gradient-to-br from-accent-gold/[0.06] to-transparent border border-accent-gold/20">
              <div className="flex items-center gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-accent-gold text-accent-gold" />
                ))}
              </div>
              <p className="font-heading text-ink text-[15px] leading-relaxed mb-3 italic">
                &ldquo;Encargue la landing un viernes por la manana. Estaba online el
                sabado. 47 leads el primer mes. No he visto nada parecido en 15
                anos.&rdquo;
              </p>
              <div className="text-[12px] text-ink/50 font-body">
                <strong className="text-ink/80">Ana Martinez</strong> · Peluqueria Ana Bilbao ·
                Cliente PACAME
              </div>
            </blockquote>

            {/* FAQ inline — primeros 3 */}
            {s.faq.length > 0 && (
              <details className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] p-5 group">
                <summary className="cursor-pointer text-[13px] font-heading font-semibold text-ink flex items-center justify-between">
                  Preguntas frecuentes ({s.faq.length})
                  <span className="text-ink/40 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-4 space-y-4">
                  {s.faq.slice(0, 5).map((q, i) => (
                    <div key={i}>
                      <div className="font-heading font-semibold text-ink text-[13px] mb-1">
                        {q.q}
                      </div>
                      <div className="text-ink/60 font-body text-[13px] leading-relaxed">
                        {q.a}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </aside>

          {/* RIGHT: Form + CTA */}
          <section>
            <ComprarClient
              slug={s.slug}
              name={s.name}
              priceCents={s.price_cents}
              currency={currency}
            />

            {/* Support section */}
            <div className="mt-8 p-5 rounded-2xl border border-ink/[0.06] bg-ink/[0.02] text-[13px] text-ink/60">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-accent-gold" />
                <span className="font-heading font-semibold text-ink">
                  ¿Alguna duda antes de pagar?
                </span>
              </div>
              <p className="leading-relaxed mb-2">
                Escribe a{" "}
                <a
                  href="mailto:hola@pacameagencia.com"
                  className="text-accent-gold hover:underline"
                >
                  hola@pacameagencia.com
                </a>{" "}
                o por{" "}
                <a
                  href="https://wa.me/34722669381"
                  className="text-accent-gold hover:underline"
                >
                  WhatsApp +34 722 669 381
                </a>
                . Respondemos en menos de 2h.
              </p>
              <p className="leading-relaxed">
                Si no estas 100% satisfecho en los primeros 30 dias,{" "}
                <strong className="text-ink">te devolvemos cada euro</strong>. Sin
                preguntas.
              </p>
            </div>
          </section>
        </div>

        {/* Security banner full width */}
        <div className="mt-12 p-5 rounded-2xl border border-ink/[0.06] bg-gradient-to-r from-brand-primary/[0.04] via-transparent to-accent-gold/[0.04] flex flex-wrap items-center justify-between gap-4 text-[12px] text-ink/50">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-accent-gold" /> Visa · Mastercard ·
              Apple Pay · Google Pay
            </span>
            <span className="text-ink/20">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-accent-gold" /> Cifrado TLS 1.3 + PCI-DSS
              via Stripe
            </span>
            <span className="text-ink/20">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-accent-gold" /> GDPR + LOPDGDD
              compliant
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
