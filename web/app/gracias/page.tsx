import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  MessageCircle,
  UserCheck,
  Mail as MailIcon,
  ExternalLink,
  Clock,
  Shield,
  FileText,
  Calendar,
  Sparkles,
  Download,
  ChevronRight,
  Star,
  Gift,
} from "lucide-react";
import { stripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase/server";
import Celebration from "@/components/effects/Celebration";

// No ISR — esta pagina es dinamica por session_id
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pago confirmado · Tu pedido PACAME esta en marcha",
  description:
    "Hemos recibido tu pago. Tu equipo PACAME ya esta asignado y en las proximas 2h recibiras todos los detalles.",
  robots: { index: false, follow: false },
};

interface OrderInfo {
  customer_email: string | null;
  customer_name: string | null;
  amount_paid: number | null;
  currency: string;
  payment_status: string;
  invoice_url: string | null;
  invoice_pdf: string | null;
  service_slug: string | null;
  product_name: string | null;
}

interface ServiceInfo {
  name: string;
  tagline: string | null;
  delivery_sla_hours: number;
  deliverable_kind: string;
  revisions_included: number;
}

async function getOrder(
  sessionId: string | null
): Promise<OrderInfo | null> {
  if (!sessionId) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["invoice", "customer"],
    });
    const invoice =
      typeof session.invoice === "object" && session.invoice !== null
        ? session.invoice
        : null;
    return {
      customer_email:
        session.customer_details?.email ||
        (session.metadata?.client_email as string | undefined) ||
        null,
      customer_name:
        session.customer_details?.name ||
        (session.metadata?.client_name as string | undefined) ||
        null,
      amount_paid: session.amount_total ?? null,
      currency: (session.currency || "eur").toUpperCase(),
      payment_status: session.payment_status || "paid",
      invoice_url: invoice?.hosted_invoice_url || null,
      invoice_pdf: invoice?.invoice_pdf || null,
      service_slug: (session.metadata?.service_slug as string | undefined) || null,
      product_name:
        (session.metadata?.product as string | undefined) ||
        session.line_items?.data?.[0]?.description ||
        null,
    };
  } catch {
    return null;
  }
}

async function getService(slug: string | null): Promise<ServiceInfo | null> {
  if (!slug) return null;
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("service_catalog")
      .select("name, tagline, delivery_sla_hours, deliverable_kind, revisions_included")
      .eq("slug", slug)
      .maybeSingle();
    return (data as ServiceInfo) || null;
  } catch {
    return null;
  }
}

function formatAmount(cents: number | null, currency: string): string {
  if (cents == null) return "";
  const amount = cents / 100;
  return `${amount.toLocaleString("es-ES")} ${currency.toUpperCase()}`;
}

function formatOrderRef(sessionId: string | null): string {
  if (!sessionId) return "PACAME-PEND";
  return `PACAME-${sessionId.slice(-8).toUpperCase()}`;
}

function formatDeliveryEta(hours: number | null | undefined): string {
  if (!hours) return "7-14 dias laborables";
  if (hours <= 24) return `${hours} horas`;
  return `${Math.round(hours / 24)} dias laborables`;
}

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; slug?: string }>;
}) {
  const { session_id, slug } = await searchParams;

  // Order primero — puede contener service_slug en metadata
  const order = await getOrder(session_id || null);
  // Service despues — fallback a slug de la URL o metadata Stripe
  const service = await getService(slug || order?.service_slug || null);

  const orderRef = formatOrderRef(session_id || null);
  const paidLabel = formatAmount(order?.amount_paid ?? null, order?.currency || "EUR");
  const deliveryEta = formatDeliveryEta(service?.delivery_sla_hours);
  const productName = service?.name || order?.product_name || "Tu pedido PACAME";
  const customerName = order?.customer_name?.split(" ")[0] || null;
  const customerEmail = order?.customer_email || null;

  return (
    <main className="min-h-screen bg-paper overflow-hidden">
      <Celebration />

      {/* ═══════════════════════════════════════════════════════════════
          HERO: Confirmation with order ref
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-12 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,161,155,0.10),transparent_70%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          {/* Success icon + pulse */}
          <div className="inline-flex relative mb-6">
            <span className="absolute inset-0 rounded-full bg-mint/20 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-mint/10 border border-mint/30 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-mint" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full bg-mint/10 border border-mint/25">
            <div className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-mint">
              Pago confirmado
            </span>
          </div>

          <h1 className="font-heading font-bold text-4xl md:text-6xl text-ink leading-[0.95] mb-4">
            {customerName ? (
              <>
                Gracias, <span className="text-accent-gold">{customerName}</span>.
              </>
            ) : (
              <>
                Tu pedido <span className="text-accent-gold">esta en marcha.</span>
              </>
            )}
          </h1>
          <p className="text-ink/60 font-body text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Hemos recibido tu pago. El equipo PACAME esta siendo asignado a tu
            proyecto <strong className="text-ink">{productName}</strong>. Te contactaremos en
            menos de <strong className="text-ink">2 horas laborables</strong>.
          </p>

          {/* Order chip bar */}
          <div className="inline-flex flex-wrap items-center gap-2 text-[12px] font-mono bg-ink/[0.04] border border-ink/[0.08] rounded-full px-4 py-2">
            <span className="text-ink/50">Pedido</span>
            <span className="text-ink font-semibold tracking-wider">{orderRef}</span>
            {paidLabel && (
              <>
                <span className="text-ink/20">·</span>
                <span className="text-mint font-semibold">{paidLabel} pagados</span>
              </>
            )}
            <span className="text-ink/20">·</span>
            <span className="text-ink/50">{new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          GRID: Left = Order details | Right = Next steps timeline
          ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8">
          {/* LEFT: Receipt + Actions */}
          <div className="space-y-6">
            {/* Order summary card */}
            <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] overflow-hidden">
              <div className="p-6 border-b border-ink/[0.06]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-accent-gold mb-1">
                      Resumen pedido
                    </div>
                    <h2 className="font-heading font-bold text-2xl text-ink leading-tight">
                      {productName}
                    </h2>
                    {service?.tagline && (
                      <p className="text-ink/60 font-body text-[14px] mt-1.5 leading-relaxed">
                        {service.tagline}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/25 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent-gold" />
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3 text-[14px]">
                {customerName && (
                  <div className="flex justify-between gap-4">
                    <span className="text-ink/55">Cliente</span>
                    <span className="text-ink font-medium text-right">{order?.customer_name}</span>
                  </div>
                )}
                {customerEmail && (
                  <div className="flex justify-between gap-4">
                    <span className="text-ink/55">Email</span>
                    <span className="text-ink font-medium text-right truncate max-w-[60%]">
                      {customerEmail}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-ink/55">Referencia pedido</span>
                  <span className="text-ink font-mono font-semibold tracking-wider">
                    {orderRef}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-ink/55">Metodo pago</span>
                  <span className="text-ink font-medium">Stripe (tarjeta)</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-ink/55">Estado</span>
                  <span className="inline-flex items-center gap-1.5 text-mint font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint" />
                    {order?.payment_status === "paid" ? "Pagado" : "Procesando"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-ink/55">Entrega estimada</span>
                  <span className="text-ink font-medium">{deliveryEta}</span>
                </div>
                {service?.revisions_included != null && (
                  <div className="flex justify-between gap-4">
                    <span className="text-ink/55">Revisiones incluidas</span>
                    <span className="text-ink font-medium">{service.revisions_included}</span>
                  </div>
                )}
                {paidLabel && (
                  <div className="flex justify-between gap-4 pt-3 border-t border-ink/[0.08] text-[16px]">
                    <span className="text-ink font-heading font-semibold">
                      Total pagado (IVA inc.)
                    </span>
                    <span className="text-accent-gold font-heading font-bold">{paidLabel}</span>
                  </div>
                )}
              </div>

              {/* Invoice download if available */}
              {(order?.invoice_pdf || order?.invoice_url) && (
                <div className="p-5 bg-accent-gold/[0.04] border-t border-accent-gold/15 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[13px] text-ink/70">
                    <Download className="w-4 h-4 text-accent-gold" />
                    <span>Tu factura ya esta lista</span>
                  </div>
                  <div className="flex gap-2">
                    {order.invoice_pdf && (
                      <a
                        href={order.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink/[0.04] border border-ink/[0.08] text-ink text-[12px] font-heading font-medium hover:bg-ink/[0.06] transition"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                    )}
                    {order.invoice_url && (
                      <a
                        href={order.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-gold text-paper text-[12px] font-heading font-semibold hover:brightness-110 transition"
                      >
                        Ver factura <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Portal access card */}
            <div className="rounded-2xl border border-mint/20 bg-gradient-to-br from-mint/[0.08] via-transparent to-accent-gold/[0.05] p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-mint/15 border border-mint/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-mint" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-lg text-ink mb-1.5">
                    Tu portal cliente esta listo
                  </h3>
                  <p className="text-ink/60 font-body text-[13px] leading-relaxed mb-4">
                    Hemos enviado tus credenciales de acceso a{" "}
                    <strong className="text-ink">{customerEmail || "tu email"}</strong>. Desde el
                    portal puedes:
                  </p>
                  <ul className="space-y-2 mb-5 text-[13px]">
                    {[
                      "Ver el progreso de tu entrega en tiempo real",
                      "Enviar feedback y aprobar revisiones",
                      "Descargar entregables + factura",
                      "Contratar servicios adicionales con descuento",
                    ].map((l) => (
                      <li key={l} className="flex items-start gap-2 text-ink/70">
                        <ChevronRight className="w-3.5 h-3.5 text-mint flex-shrink-0 mt-0.5" />
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/portal"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mint text-paper font-heading font-semibold text-[13px] hover:brightness-110 transition"
                  >
                    Acceder al portal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Bonus / referral card */}
            <div className="rounded-2xl border border-accent-gold/20 bg-accent-gold/[0.04] p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-accent-gold/15 border border-accent-gold/30 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-accent-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-[16px] text-ink mb-1">
                    Un cliente feliz trae otro — ganais los dos
                  </h3>
                  <p className="text-ink/60 font-body text-[13px] leading-relaxed mb-3">
                    Invita a otro negocio y os llevais{" "}
                    <strong className="text-ink">15% de descuento cada uno</strong>. Tu codigo
                    personal estara activo en tu portal en 24h.
                  </p>
                  <Link
                    href="/portal/referrals"
                    className="inline-flex items-center gap-1.5 text-[13px] font-heading font-semibold text-accent-gold hover:underline"
                  >
                    Ver programa referidos <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Next steps timeline + Support */}
          <aside className="space-y-6">
            {/* Timeline card */}
            <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-4 h-4 text-accent-gold" />
                <h3 className="font-heading font-bold text-[16px] text-ink">
                  Proximos pasos
                </h3>
              </div>

              <ol className="space-y-5 relative">
                {/* Line conector */}
                <div className="absolute left-[15px] top-8 bottom-4 w-[2px] bg-gradient-to-b from-mint via-accent-gold to-ink/20" />

                {[
                  {
                    icon: CheckCircle,
                    color: "mint",
                    kicker: "Hecho",
                    title: "Pago confirmado",
                    desc: "Hemos recibido tu pago correctamente.",
                    time: "Ahora",
                  },
                  {
                    icon: MailIcon,
                    color: "accent-gold",
                    kicker: "En minutos",
                    title: "Email confirmacion + credenciales",
                    desc: `A ${customerEmail || "tu email"} con acceso al portal cliente.`,
                    time: "< 5 min",
                  },
                  {
                    icon: UserCheck,
                    color: "accent-gold",
                    kicker: "< 2h laborables",
                    title: "Pablo te contacta",
                    desc: "Te llama o escribe por WhatsApp para alinear detalles y kickoff.",
                    time: "Hoy",
                  },
                  {
                    icon: Sparkles,
                    color: "brand-primary",
                    kicker: "Manos a la obra",
                    title: "Kick-off + trabajo",
                    desc: "El equipo empieza inmediatamente. Lo ves en tiempo real desde tu portal.",
                    time: "Dia 1",
                  },
                  {
                    icon: Clock,
                    color: "brand-primary",
                    kicker: "Entrega",
                    title: `Recibes tu ${(service?.deliverable_kind || "entregable").replace(/_/g, " ")}`,
                    desc: "Con todo listo para producir + 30 dias de soporte gratis.",
                    time: deliveryEta,
                  },
                ].map((step, i) => {
                  const isFirst = i === 0;
                  return (
                    <li key={i} className="relative pl-11">
                      <div
                        className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                          isFirst
                            ? "bg-mint border-mint"
                            : `bg-paper border-${step.color}/40`
                        }`}
                      >
                        <step.icon
                          className={`w-3.5 h-3.5 ${
                            isFirst ? "text-paper" : `text-${step.color}`
                          }`}
                        />
                      </div>
                      <div
                        className={`text-[10px] font-mono uppercase tracking-wider mb-1 text-${step.color}`}
                      >
                        {step.kicker}
                      </div>
                      <div className="font-heading font-semibold text-ink text-[14px] leading-tight mb-0.5">
                        {step.title}
                      </div>
                      <div className="text-ink/55 font-body text-[12.5px] leading-relaxed">
                        {step.desc}
                      </div>
                      <div className="text-[11px] font-mono text-ink/35 mt-1">
                        {step.time}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Support box */}
            <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] p-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-accent-gold" />
                <h3 className="font-heading font-bold text-[15px] text-ink">
                  ¿Necesitas hablarnos ya?
                </h3>
              </div>
              <p className="text-ink/60 font-body text-[13px] leading-relaxed mb-4">
                Pablo lee tu pedido antes de empezar. Si tienes algo urgente que anadir,
                escribele directamente:
              </p>
              <div className="space-y-2.5">
                <a
                  href={`https://wa.me/34722669381?text=${encodeURIComponent(
                    `Hola Pablo, acabo de contratar ${productName} (${orderRef}). Tengo algunas notas:`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/25 hover:bg-[#25D366]/15 transition group"
                >
                  <span className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span className="text-[13px] font-heading font-semibold text-ink">
                      WhatsApp +34 722 669 381
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-ink/40 group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                </a>
                <a
                  href="mailto:hola@pacameagencia.com"
                  className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-ink/[0.03] border border-ink/[0.08] hover:bg-ink/[0.05] transition group"
                >
                  <span className="flex items-center gap-2.5">
                    <MailIcon className="w-4 h-4 text-accent-gold" />
                    <span className="text-[13px] font-heading font-semibold text-ink">
                      hola@pacameagencia.com
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-ink/40 group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                </a>
              </div>
              <p className="text-[11px] text-ink/40 font-body mt-4">
                Tiempo medio de respuesta: <strong className="text-ink/70">12 min</strong> en
                horario laborable (9h-20h L-V).
              </p>
            </div>

            {/* Guarantee reminder */}
            <div className="rounded-2xl border border-mint/20 bg-mint/[0.04] p-5">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-mint flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="font-heading font-semibold text-ink text-[13px] mb-1">
                    Garantia 30 dias
                  </div>
                  <p className="text-ink/60 font-body text-[12.5px] leading-relaxed">
                    Si en los primeros 30 dias no estas 100% satisfecho,{" "}
                    <strong className="text-ink">te devolvemos cada euro</strong>. Sin preguntas,
                    sin paperwork.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SOCIAL PROOF: Review quote
          ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="p-8 md:p-12 rounded-3xl border border-accent-gold/20 bg-gradient-to-br from-accent-gold/[0.05] via-transparent to-brand-primary/[0.05]">
          <div className="flex items-center gap-1 mb-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-accent-gold text-accent-gold" />
            ))}
            <span className="ml-2 text-[12px] font-mono text-ink/50">
              4.9/5 · 47+ clientes activos
            </span>
          </div>
          <blockquote className="font-heading text-ink text-xl md:text-2xl leading-relaxed mb-5 max-w-3xl">
            &ldquo;El dia que pague fue el ultimo que me preocupe de la web. A las 6h tenia el
            kickoff agendado. Al dia siguiente, wireframe. A los 5 dias, landing online. Nunca
            habia visto a nadie moverse asi.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-heading font-bold text-sm">
              CR
            </div>
            <div>
              <div className="font-heading font-semibold text-ink text-[14px]">
                Carlos Rodriguez
              </div>
              <div className="text-ink/50 text-[12px] font-body">
                Dueno Restaurante La Mesa · Madrid · Cliente PACAME desde Feb 2025
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA: Back to home / continue browsing
          ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 text-center">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-accent-gold mb-3">
          Mientras esperas
        </div>
        <h3 className="font-heading font-bold text-2xl md:text-3xl text-ink leading-tight mb-4 max-w-2xl mx-auto">
          Descubre todo lo que PACAME puede hacer por tu negocio
        </h3>
        <p className="text-ink/60 font-body max-w-xl mx-auto mb-8 leading-relaxed">
          Tu pedido esta en marcha. Mientras, explora los servicios complementarios — clientes
          que combinan web + ads + redes crecen 3x mas rapido.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/servicios"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-accent-gold text-paper font-heading font-semibold text-sm hover:brightness-110 transition"
          >
            Ver todos los servicios <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/portafolio"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-ink/[0.04] border border-ink/[0.08] text-ink font-heading font-medium text-sm hover:bg-ink/[0.06] transition"
          >
            Ver portfolio
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-ink/60 font-body text-sm hover:text-ink transition"
          >
            Volver al inicio
          </Link>
        </div>

        <p className="text-[11px] text-ink/30 font-body mt-12 max-w-xl mx-auto">
          Guarda esta pagina como referencia · Tu pedido{" "}
          <strong className="text-ink/50 font-mono">{orderRef}</strong> quedara registrado en{" "}
          <Link href="/portal" className="text-accent-gold hover:underline">
            tu portal
          </Link>{" "}
          y recibiras copia del recibo por email.
        </p>
      </section>
    </main>
  );
}
