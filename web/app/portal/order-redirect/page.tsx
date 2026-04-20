"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * /portal/order-redirect?session_id={CHECKOUT_SESSION_ID}
 * Pagina intermedia post-checkout.
 * Hace polling a /api/orders/by-session/[session_id] hasta que el webhook Stripe
 * haya creado la order, y luego redirige a /portal/orders/[id]/form.
 * Max ~25s de polling.
 */
export default function OrderRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"polling" | "ready" | "timeout" | "error">("polling");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    const maxAttempts = 15; // ~30s total
    let current = 0;

    const poll = async () => {
      if (cancelled) return;
      current += 1;
      setAttempts(current);
      try {
        const res = await fetch(`/api/orders/by-session/${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.order?.id) {
            setStatus("ready");
            // Small delay so user sees the success state briefly
            setTimeout(() => {
              router.replace(`/portal/orders/${data.order.id}/form?fresh=1`);
            }, 700);
            return;
          }
        }
      } catch {
        // transient — keep trying
      }

      if (current >= maxAttempts) {
        setStatus("timeout");
        return;
      }
      setTimeout(poll, 2000);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-pacame-black flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl p-8 bg-dark-card border border-white/[0.06] text-center">
        {status === "polling" && (
          <>
            <Loader2 className="w-12 h-12 text-olympus-gold animate-spin mx-auto mb-6" />
            <h1 className="font-heading font-bold text-2xl text-pacame-white mb-2">
              Confirmando tu pago
            </h1>
            <p className="text-pacame-white/60 font-body text-sm">
              Estamos preparando tu pedido. Esto tarda solo unos segundos.
            </p>
            <p className="text-pacame-white/30 font-body text-xs mt-4">
              Intento {attempts} de 15
            </p>
          </>
        )}

        {status === "ready" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-6" />
            <h1 className="font-heading font-bold text-2xl text-pacame-white mb-2">
              Pago confirmado
            </h1>
            <p className="text-pacame-white/60 font-body text-sm">
              Redirigiendo a tu brief...
            </p>
          </>
        )}

        {status === "timeout" && (
          <>
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
            <h1 className="font-heading font-bold text-2xl text-pacame-white mb-2">
              Casi listo
            </h1>
            <p className="text-pacame-white/60 font-body text-sm mb-6">
              Tu pago se recibio correctamente. Estamos terminando de crear tu pedido.
              Te llegara un email con el link en los proximos minutos.
            </p>
            <a
              href="/portal/orders"
              className="inline-block bg-olympus-gold text-pacame-black font-heading font-semibold px-6 py-3 rounded-xl hover:bg-olympus-gold/90 transition"
            >
              Ir a mis pedidos
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-6" />
            <h1 className="font-heading font-bold text-2xl text-pacame-white mb-2">
              Falta el session_id
            </h1>
            <p className="text-pacame-white/60 font-body text-sm mb-6">
              No podemos identificar tu pedido. Revisa tu email — te llegara el link directo.
            </p>
            <a
              href="/portal"
              className="inline-block bg-olympus-gold text-pacame-black font-heading font-semibold px-6 py-3 rounded-xl hover:bg-olympus-gold/90 transition"
            >
              Ir al portal
            </a>
          </>
        )}
      </div>
    </div>
  );
}
