"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, X, CreditCard, Lock } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { ProductKey } from "@/lib/stripe";

interface CheckoutButtonProps {
  product: ProductKey | string;
  amount: number; // en euros
  label?: string;
  recurring?: boolean;
  description?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  services?: string;
}

export default function CheckoutButton({
  product,
  amount,
  label,
  recurring = false,
  description,
  variant = "gradient",
  size = "lg",
  className = "",
  services,
}: CheckoutButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayLabel = label || `Comprar desde ${amount}\u00A0\u20AC${recurring ? "/mes" : ""}`;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          amount,
          client_name: name,
          client_email: email,
          recurring,
          description: description || undefined,
          services: services || undefined,
          source: "public",
          success_url: `${window.location.origin}/gracias?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/servicios`,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || "Error al crear la sesion de pago");
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError("Error de conexion. Intentalo de nuevo.");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`group rounded-full ${className}`}
        onClick={() => setShowModal(true)}
      >
        <CreditCard className="w-4 h-4" />
        {displayLabel}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Button>

      {/* Mini-modal overlay */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="relative w-full max-w-sm bg-[#141414] border border-ink/[0.08] rounded-2xl p-7 shadow-2xl">
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
              aria-label="Cerrar formulario de pago"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 id="checkout-title" className="font-heading font-bold text-xl text-ink mb-1">
                Un paso mas
              </h3>
              <p className="text-sm text-ink/50 font-body">
                Tu nombre y email para preparar el pago.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-white/[0.04] rounded-xl p-4 mb-6 border border-ink/[0.06]">
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink/70 font-body">
                  {description || product}
                </span>
                <span className="font-heading font-bold text-lg text-ink">
                  {amount}\u00A0\u20AC{recurring ? "/mes" : ""}
                </span>
              </div>
              {recurring && (
                <p className="text-xs text-ink/30 mt-1 font-body">
                  Cancela cuando quieras. Sin permanencia.
                </p>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink placeholder:text-ink/25 font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink placeholder:text-ink/25 font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors"
                />
              </div>

              {error && (
                <p className="text-accent-burgundy-soft text-xs font-body" aria-live="polite">{error}</p>
              )}

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full rounded-full shadow-glow-gold"
                disabled={loading || !name || !email}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pagar {amount}\u00A0\u20AC{recurring ? "/mes" : ""}
                  </>
                )}
              </Button>
            </form>

            {/* Trust strip */}
            <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/[0.04]">
              <Lock className="w-3.5 h-3.5 text-accent-gold/30" />
              <span className="text-[11px] text-ink/25 font-body">Pago 100% seguro con Stripe</span>
              <div className="flex items-center gap-1.5 ml-1">
                {/* Visa */}
                <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className="text-ink/15">
                  <rect width="24" height="16" rx="2" stroke="currentColor" strokeWidth="0.8" />
                  <path d="M10.5 10.5L12 5.5L13.2 5.5L11.7 10.5H10.5Z" fill="currentColor" />
                  <path d="M9.5 5.5L7.5 10.5H8.7L9 9.5H10.5L10.7 10.5H11.8L10.5 5.5H9.5ZM9.3 8.7L9.8 7L10.2 8.7H9.3Z" fill="currentColor" />
                  <path d="M14 5.5V10.5H15V8.5L16.5 10.5H17.8L16 8.3L17.5 5.5H16.3L15 7.8V5.5H14Z" fill="currentColor" />
                </svg>
                {/* Mastercard */}
                <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className="text-ink/15">
                  <rect width="24" height="16" rx="2" stroke="currentColor" strokeWidth="0.8" />
                  <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="0.8" />
                  <circle cx="14" cy="8" r="3.5" stroke="currentColor" strokeWidth="0.8" />
                </svg>
              </div>
            </div>

            {/* Alternative */}
            <p className="text-center text-xs text-ink/30 mt-4 font-body">
              Prefieres hablar primero?{" "}
              <Link
                href="/contacto"
                className="text-accent-gold/70 hover:text-accent-gold underline underline-offset-2"
              >
                Contactanos
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
