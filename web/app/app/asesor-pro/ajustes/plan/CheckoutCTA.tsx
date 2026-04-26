"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

export function CheckoutCTA({
  productId,
  tier,
  isCurrent,
  hasPriceId,
}: {
  productId: string;
  tier: string;
  isCurrent: boolean;
  hasPriceId: boolean;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (isCurrent) {
    return (
      <button
        disabled
        className="w-full px-4 py-2.5 bg-ink/10 text-ink-mute font-sans text-sm cursor-not-allowed"
      >
        Plan actual
      </button>
    );
  }

  async function startCheckout() {
    if (!hasPriceId) {
      toast({
        variant: "warning",
        title: "Plan no disponible aún",
        description: "Estamos terminando de configurar este tier. Escríbenos a hola@pacameagencia.com.",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = await res.json();
      if (!res.ok || !json.checkout_url) {
        toast({
          variant: "error",
          title: "No se pudo iniciar el pago",
          description: json.error ?? "Inténtalo de nuevo en unos minutos.",
        });
        setLoading(false);
        return;
      }
      window.location.href = json.checkout_url;
    } catch {
      toast({
        variant: "error",
        title: "Error de red",
        description: "Revisa tu conexión y vuelve a intentarlo.",
      });
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      className="w-full px-4 py-2.5 bg-ink text-paper font-sans text-sm hover:bg-terracotta-500 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? "Conectando con Stripe…" : "Activar este plan"}
    </button>
  );
}
