"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { getReferralCode } from "@/lib/referral-client";

interface Props {
  appSlug: string;
  appName: string;
  priceMonthlyCents: number;
  priceYearlyCents?: number | null;
  billingInterval: "month" | "year";
  className?: string;
  variant?: "primary" | "outline";
  children?: React.ReactNode;
}

export default function AppBuyButton({
  appSlug,
  appName,
  priceMonthlyCents,
  priceYearlyCents,
  billingInterval,
  className = "",
  variant = "primary",
  children,
}: Props) {
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
          app_slug: appSlug,
          billing_interval: billingInterval,
          source: "public",
          ref: getReferralCode() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "No se pudo crear el pago. Intenta de nuevo.");
        setLoading(false);
        return;
      }
      router.push(data.url);
    } catch {
      setError("Error de red. Comprueba tu conexion.");
      setLoading(false);
    }
  }

  const priceEur =
    billingInterval === "year" && priceYearlyCents
      ? priceYearlyCents / 100
      : priceMonthlyCents / 100;

  const baseStyles =
    variant === "primary"
      ? "bg-accent-gold text-ink hover:bg-accent-gold/90 shadow-lg hover:shadow-xl hover:shadow-accent-gold/20"
      : "bg-transparent text-accent-gold border-2 border-accent-gold/40 hover:border-accent-gold hover:bg-accent-gold/5";

  return (
    <div className={className}>
      <button
        onClick={handleBuy}
        disabled={loading}
        className={`w-full ${baseStyles} disabled:opacity-60 disabled:cursor-not-allowed font-heading font-semibold py-4 px-6 rounded-xl text-lg flex items-center justify-center gap-2 transition-all`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirigiendo...
          </>
        ) : (
          children || (
            <>
              Empezar con {appName} — {priceEur}€
              {billingInterval === "month" ? "/mes" : "/año"}
              <ArrowRight className="w-5 h-5" />
            </>
          )
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-400 font-body text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
