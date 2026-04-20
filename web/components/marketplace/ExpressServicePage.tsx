import Link from "next/link";
import { Check, Clock, ShieldCheck, Zap, HelpCircle } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ExpressBuyButton from "@/components/marketplace/ExpressBuyButton";

export interface ExpressProduct {
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price_cents: number;
  currency: string;
  agent_id: string;
  delivery_sla_hours: number;
  revisions_included: number;
  features: string[];
  faq: { q: string; a: string }[];
  cover_image_url: string | null;
}

function formatSla(hours: number): string {
  if (hours < 1) return "Menos de 1 hora";
  if (hours === 1) return "1 hora";
  if (hours < 24) return `${hours} horas`;
  if (hours === 24) return "24 horas";
  const days = Math.round(hours / 24);
  return `${days} dias`;
}

function formatPrice(cents: number, currency: string): string {
  const eur = cents / 100;
  const symbol = currency.toLowerCase() === "eur" ? "€" : currency.toUpperCase();
  return `${eur}${symbol}`;
}

export default function ExpressServicePage({ product }: { product: ExpressProduct }) {
  return (
    <div className="bg-paper min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Servicios", url: "https://pacameagencia.com/servicios" },
          {
            name: product.name,
            url: `https://pacameagencia.com/servicios/${product.slug}`,
          },
        ]}
      />

      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-olympus-radial pointer-events-none" />

        <ScrollReveal className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 text-sm font-body text-ink/30 mb-8">
            <Link href="/servicios" className="hover:text-ink/50 transition-colors">
              Servicios
            </Link>
            <span>/</span>
            <span className="text-ink/50">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left */}
            <div className="lg:col-span-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-body font-semibold text-accent-gold uppercase tracking-wider bg-accent-gold/10 rounded-full px-3 py-1 mb-4 border border-accent-gold/20">
                <Zap className="w-3 h-3" /> Express · Entregado por IA
              </span>

              <h1 className="font-accent font-bold text-4xl sm:text-5xl text-ink mb-4">
                {product.name}
              </h1>
              <p className="text-xl text-ink/60 font-body leading-relaxed mb-8">
                {product.tagline || product.description}
              </p>

              {/* Trust pills */}
              <div className="flex flex-wrap items-center gap-3 mb-10">
                <div className="flex items-center gap-1.5 text-sm font-body px-3 py-1.5 rounded-full bg-white/[0.04] border border-ink/[0.06] text-ink/70">
                  <Clock className="w-3.5 h-3.5 text-accent-gold" />
                  Entrega en {formatSla(product.delivery_sla_hours)}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-body px-3 py-1.5 rounded-full bg-white/[0.04] border border-ink/[0.06] text-ink/70">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent-gold" />
                  Garantia 100%
                </div>
                <div className="flex items-center gap-1.5 text-sm font-body px-3 py-1.5 rounded-full bg-white/[0.04] border border-ink/[0.06] text-ink/70">
                  <Check className="w-3.5 h-3.5 text-accent-gold" />
                  {product.revisions_included} revisiones
                </div>
              </div>

              {/* Long description */}
              {product.description && product.tagline && (
                <div className="prose prose-invert max-w-none mb-10">
                  <p className="text-ink/70 font-body leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Features */}
              {product.features.length > 0 && (
                <div className="mb-12">
                  <h2 className="font-heading font-bold text-2xl text-ink mb-6">
                    Que incluye
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2.5 text-sm font-body text-ink/70"
                      >
                        <Check className="w-4 h-4 text-accent-gold flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* How it works */}
              <div className="mb-12">
                <h2 className="font-heading font-bold text-2xl text-ink mb-6">
                  Como funciona
                </h2>
                <ol className="space-y-4">
                  {[
                    "Compras el producto con un clic — pago seguro via Stripe",
                    "Rellenas un brief rapido (60 segundos)",
                    `Nuestra IA genera tu entregable en ${formatSla(product.delivery_sla_hours)}`,
                    `Recibes avisos por email y accedes a tu entregable en el portal. Incluye ${product.revisions_included} revisiones.`,
                  ].map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-4 text-ink/80 font-body"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-gold/15 text-accent-gold flex items-center justify-center font-bold text-sm border border-accent-gold/30">
                        {i + 1}
                      </span>
                      <span className="pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* FAQ */}
              {product.faq.length > 0 && (
                <div className="mb-12">
                  <h2 className="font-heading font-bold text-2xl text-ink mb-6 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-accent-gold" />
                    Preguntas frecuentes
                  </h2>
                  <div className="space-y-4">
                    {product.faq.map((f, i) => (
                      <details
                        key={i}
                        className="group rounded-xl p-5 bg-paper-deep border border-ink/[0.06]"
                      >
                        <summary className="cursor-pointer font-heading font-semibold text-ink flex items-center justify-between">
                          <span>{f.q}</span>
                          <span className="text-accent-gold group-open:rotate-45 transition-transform text-xl">
                            +
                          </span>
                        </summary>
                        <p className="mt-3 text-ink/70 font-body text-sm leading-relaxed">
                          {f.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Sticky buy card */}
            <div className="lg:col-span-1">
              <CardTilt tiltMaxAngle={6} scale={1.02}>
                <CardTiltContent>
                  <div className="rounded-2xl p-7 bg-paper-deep border border-ink/[0.06] sticky top-28 card-golden-shine">
                    <div className="font-heading font-bold text-4xl text-ink mb-1">
                      {formatPrice(product.price_cents, product.currency)}
                    </div>
                    <div className="text-sm text-ink/40 font-body mb-1">
                      Pago unico
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-ink/60 font-body mb-6">
                      <Clock className="w-3.5 h-3.5 text-accent-gold" />
                      Entrega en {formatSla(product.delivery_sla_hours)}
                    </div>

                    <ExpressBuyButton
                      serviceSlug={product.slug}
                      serviceName={product.name}
                      priceCents={product.price_cents}
                    />

                    <ul className="mt-6 space-y-2.5 text-sm font-body text-ink/70">
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-accent-gold" />
                        Garantia 100% — reembolso si no te gusta
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-accent-gold" />
                        {product.revisions_included} revisiones incluidas
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-accent-gold" />
                        Pago seguro via Stripe
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-accent-gold" />
                        Soporte por WhatsApp
                      </li>
                    </ul>
                  </div>
                </CardTiltContent>
              </CardTilt>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
