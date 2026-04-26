import { requireOwnerOrAdmin } from "@/lib/products/session";
import { getProduct, formatTierLimits, type ProductTier } from "@/lib/products/registry";
import { getActiveSubscription, daysLeftInTrial } from "@/lib/products/subscriptions";
import { CheckCircle2, Sparkles } from "lucide-react";
import { CheckoutCTA } from "./CheckoutCTA";

export const dynamic = "force-dynamic";

const TIER_NARRATIVE: Record<string, { headline: string; sub: string }> = {
  solo: { headline: "Asesor Solo", sub: "Hasta 15 clientes. Ideal para arrancar sin marearte." },
  pro: { headline: "Asesor Pro", sub: "50 clientes y pack mensual auto-empaquetado en ZIP." },
  despacho: { headline: "Despacho", sub: "Clientes ilimitados, hasta 5 asesores y API." },
};

function priceLabel(tier: ProductTier) {
  return `${tier.price_eur} €/${tier.interval === "year" ? "año" : "mes"}`;
}

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await requireOwnerOrAdmin();
  const sp = await searchParams;
  const product = await getProduct("asesor-pro");
  const subscription = await getActiveSubscription(user.id, "asesor-pro");
  const trialDays = subscription ? daysLeftInTrial(subscription) : null;

  if (!product) {
    return (
      <p className="font-sans text-ink-mute">No se ha encontrado el producto AsesorPro.</p>
    );
  }

  const currentTier = subscription?.tier;
  const tiers = product.pricing;

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
          AsesorPro · Plan y facturación
        </span>
        <h1
          className="font-display text-ink mt-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          Tu plan: <span className="text-terracotta-500 capitalize">{currentTier ?? "—"}</span>
        </h1>
        <p className="font-sans text-ink-mute mt-1 text-sm">
          {subscription?.status === "trialing" && trialDays !== null && trialDays >= 0
            ? `Trial activo · ${trialDays} día${trialDays === 1 ? "" : "s"} restante${trialDays === 1 ? "" : "s"}.`
            : subscription?.status === "active"
              ? "Suscripción activa. Pagos al día."
              : `Estado: ${subscription?.status ?? "sin suscripción"}.`}
        </p>
      </header>

      {sp.checkout === "success" && (
        <div className="bg-green-600/10 border border-green-600/30 text-green-700 px-4 py-3 font-sans text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Pago procesado. La actualización del plan puede tardar unos segundos en reflejarse.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const narrative = TIER_NARRATIVE[tier.tier] ?? { headline: tier.name, sub: "" };
          const isCurrent = tier.tier === currentTier && subscription?.status !== "trialing";
          const limits = formatTierLimits(tier);
          return (
            <article
              key={tier.tier}
              className={`bg-paper border-2 ${tier.recommended ? "border-terracotta-500" : "border-ink/15"} p-6 flex flex-col`}
            >
              {tier.recommended && (
                <span className="absolute -mt-9 -ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-terracotta-500 text-paper font-mono text-[10px] tracking-[0.15em] uppercase">
                  <Sparkles className="w-3 h-3" /> Recomendado
                </span>
              )}
              <h2 className="font-display text-ink text-xl" style={{ fontWeight: 500 }}>
                {narrative.headline}
              </h2>
              <p className="font-sans text-sm text-ink-mute mt-1">{narrative.sub}</p>
              <div className="mt-4 mb-4">
                <span className="font-display text-3xl text-ink" style={{ fontWeight: 500 }}>
                  {priceLabel(tier)}
                </span>
              </div>
              <ul className="font-sans text-sm text-ink-mute space-y-1.5 mb-6 flex-1">
                {limits.map((l) => (
                  <li key={l} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-terracotta-500 mt-0.5 flex-shrink-0" />
                    {l}
                  </li>
                ))}
              </ul>
              <CheckoutCTA
                productId="asesor-pro"
                tier={tier.tier}
                isCurrent={isCurrent}
                hasPriceId={Boolean(tier.stripe_price_id)}
              />
            </article>
          );
        })}
      </div>

      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-mute">
        Pagos procesados por Stripe. Cancela en cualquier momento desde tu portal.
      </p>
    </div>
  );
}
