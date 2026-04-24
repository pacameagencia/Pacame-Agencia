"use client";

/**
 * ExitIntentPopup — captura lead cuando usuario sale de la web.
 *
 * Sesgo activado: Reciprocidad + aversión a la pérdida.
 * Desktop: mouse sale por top edge.
 * Mobile: scroll-up rápido después de inactividad.
 * Show max 1x por sesión (localStorage), respeta cookie consent.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Lock, ArrowRight, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";

const SEEN_KEY = "pacame_exit_popup_seen_v1";
const DELAY_MS = 8000; // mínimo 8s en la web antes de triggerar

export default function ExitIntentPopup() {
  const [shown, setShown] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip si ya mostrado en esta sesión
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {
      /* ignore */
    }

    let triggered = false;
    const pageLoadTime = Date.now();

    function trigger(reason: string) {
      if (triggered || Date.now() - pageLoadTime < DELAY_MS) return;
      triggered = true;
      setShown(true);
      try {
        localStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      trackEvent("exit_intent_triggered", { reason });
    }

    // Desktop: mouse leaves viewport por el top
    function onMouseLeave(e: MouseEvent) {
      if (e.clientY <= 5 && e.relatedTarget == null) {
        trigger("desktop_mouse_top");
      }
    }

    // Mobile: scroll-up brusco (>100px) tras inactividad
    let lastScrollY = window.scrollY;
    let scrollUpVelocity = 0;
    function onScroll() {
      const delta = window.scrollY - lastScrollY;
      if (delta < -50) scrollUpVelocity += Math.abs(delta);
      else scrollUpVelocity *= 0.7;
      if (scrollUpVelocity > 200 && window.innerWidth < 768) {
        trigger("mobile_scroll_up");
      }
      lastScrollY = window.scrollY;
    }

    // Fallback: inactividad 45s + luego cualquier scroll (last resort)
    let inactiveTimer: ReturnType<typeof setTimeout> | null = null;
    function resetInactive() {
      if (inactiveTimer) clearTimeout(inactiveTimer);
      inactiveTimer = setTimeout(() => {
        if (window.innerWidth < 768 && !triggered) {
          trigger("mobile_inactivity");
        }
      }, 45000);
    }

    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    ["mousemove", "touchstart", "keydown"].forEach((ev) =>
      document.addEventListener(ev, resetInactive, { passive: true })
    );
    resetInactive();

    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
      ["mousemove", "touchstart", "keydown"].forEach((ev) =>
        document.removeEventListener(ev, resetInactive)
      );
      if (inactiveTimer) clearTimeout(inactiveTimer);
    };
  }, []);

  function close() {
    setShown(false);
    trackEvent("exit_intent_closed", { submitted });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Email invalido");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source: "exit_intent",
          status: "exit_intent_captured",
        }),
      });
      trackEvent("exit_intent_captured", { email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!shown) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_240ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-popup-title"
      onClick={close}
    >
      <div
        className="relative max-w-lg w-full bg-paper rounded-3xl border border-accent-gold/30 shadow-[0_40px_100px_rgba(0,0,0,0.5)] p-8 md:p-10 animate-[slideUp_300ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-ink/40 hover:text-ink hover:bg-ink/5 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {!submitted ? (
          <>
            <div className="flex items-baseline gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-accent-gold mb-5">
              <span>§ ANTES QUE TE VAYAS</span>
              <span className="h-px flex-1 bg-ink/10" />
            </div>

            <h2
              id="exit-popup-title"
              className="font-heading font-bold text-[28px] md:text-[36px] text-ink leading-[1.02] tracking-[-0.02em] mb-4"
            >
              Espera. Te regalo una{" "}
              <span className="font-accent italic font-normal text-accent-gold">
                auditoria + 30 min
              </span>
              {" "}de estrategia con Pablo
              <span className="text-accent-burgundy">.</span>
            </h2>

            <p className="text-[15px] text-ink/60 font-body leading-relaxed mb-6">
              Sin compromiso. Sin CRM. Sin llamadas frias despues. Solo 30 min
              donde te digo que cambiaria YO en tu negocio digital. Valor
              real <strong className="text-ink">197€</strong>, hoy 0€.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoFocus
                required
                className="w-full bg-ink/[0.03] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 outline-none focus:border-accent-gold/40 transition"
              />
              {error && (
                <div className="text-[12px] text-accent-burgundy" role="alert">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent-gold text-paper font-heading font-semibold text-[14px] disabled:opacity-50 hover:brightness-110 transition shadow-xl"
              >
                {submitting ? (
                  "Enviando..."
                ) : (
                  <>
                    Reservar 30 min gratis <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-ink/40">
                <Lock className="w-2.5 h-2.5" />
                <span>Cero spam · GDPR compliant · Unsubscribe 1 click</span>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-mint/10 border border-mint/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-mint" />
            </div>
            <h2 className="font-heading font-bold text-[26px] text-ink mb-3">
              Hecho. Pablo te contacta en menos de 2h.
            </h2>
            <p className="text-[15px] text-ink/60 font-body leading-relaxed mb-6">
              Mientras tanto, echa un vistazo a nuestras herramientas gratis.
            </p>
            <Link
              href="/herramientas"
              onClick={close}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ink text-paper font-heading font-semibold text-[14px] hover:brightness-110 transition"
            >
              Ver 8 herramientas gratis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
