/**
 * Botón cliente para iniciar checkout Stripe.
 * Llama a /api/products/[product]/checkout y hace window.location al checkout_url.
 */

"use client";

import { useState } from "react";

interface Props {
  productId: string;
  tier: string;
  priceLabel: string;
}

export default function CuentaActions({ productId, tier, priceLabel }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tier }),
      });
      const json = await res.json();
      if (!res.ok || !json.checkout_url) {
        if (json.error?.includes("stripe_price_id missing")) {
          setError(
            "El plan Premium aún no tiene precio configurado en Stripe. Pablo lo está activando — vuelve en unas horas."
          );
        } else {
          setError("No he podido iniciar el cobro. Inténtalo de nuevo en un momento.");
        }
        return;
      }
      window.location.href = json.checkout_url;
    } catch {
      setError("No he podido conectar con la pasarela. Inténtalo de nuevo en un momento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        style={{
          width: "100%",
          padding: "13px 18px",
          background: loading ? "rgba(244,239,227,0.55)" : "#f4efe3",
          color: "#7a2e18",
          border: "none",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 700,
          cursor: loading ? "wait" : "pointer",
          fontFamily: "inherit",
        }}
      >
        {loading ? "Abriendo pasarela…" : `Pasar a Premium · ${priceLabel}`}
      </button>
      {error && (
        <p
          style={{
            background: "rgba(0,0,0,0.18)",
            color: "#fde9d9",
            padding: "10px 12px",
            borderRadius: 10,
            fontSize: 13,
            marginTop: 10,
          }}
        >
          {error}
        </p>
      )}
    </>
  );
}
