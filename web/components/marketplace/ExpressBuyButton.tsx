"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, ArrowRight } from "lucide-react";
import { getReferralCode } from "@/lib/referral-client";

interface Props {
  serviceSlug: string;
  serviceName: string;
  priceCents: number;
}

export default function ExpressBuyButton({ serviceSlug, serviceName, priceCents }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_slug: serviceSlug,
          source: "public",
          ref: getReferralCode() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || "No se pudo crear el pago. Intentalo de nuevo.");
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      router.push(data.url);
    } catch (err) {
      setError("Error de red. Comprueba tu conexion.");
      setLoading(false);
    }
  }

  const priceEur = (priceCents / 100).toFixed(0);

  return (
    <div>
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-60 disabled:cursor-not-allowed text-paper font-heading font-semibold py-4 px-6 rounded-xl text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:shadow-accent-gold/20"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirigiendo...
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            Comprar por {priceEur}€
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-400 font-body text-center" role="alert">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs text-ink/40 font-body text-center">
        Pago seguro via Stripe. Te redirigiremos a su pasarela.
      </p>
    </div>
  );
}
