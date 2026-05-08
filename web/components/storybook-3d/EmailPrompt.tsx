"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { z } from "zod/v4";

import {
  EMAIL_PROMPT_TITLE,
  EMAIL_PROMPT_BODY,
} from "@/lib/storybook/content";
import {
  loadTrackerState,
  markEmailPromptShown,
  setEmailCaptured,
  shouldShowEmailPrompt,
  tickSecondsOnSite,
} from "@/lib/storybook/lead-tracker";

/**
 * Email-prompt progresivo del Storybook 3D — bottom-sheet no bloqueante.
 *
 * Trigger: tras 3 islas visitadas O 60s en sitio (ver lead-tracker.ts).
 * Estado: dismissable, no se vuelve a mostrar en la misma sesión.
 *
 * Submit:
 *  - Validación cliente (z.email).
 *  - POST a /api/leads (extendido en Fase 4) con flag
 *    `audit_source: "storybook_lite_capture"` y snapshot del tracker.
 *  - On success: setEmailCaptured(email) + cierre animado.
 *
 * Diseño: pill inferior, paper background, terracota CTA, dismiss en X.
 * Mobile: full-width-ish con padding lateral; desktop: max 24rem.
 */

const emailValidator = z.email("Email no válido");

type Status = "idle" | "submitting" | "success" | "error";

export default function EmailPrompt() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tick segundos cada 1s + check trigger
  useEffect(() => {
    const interval = setInterval(() => {
      const state = tickSecondsOnSite();
      if (shouldShowEmailPrompt(state)) {
        setVisible(true);
        markEmailPromptShown();
        clearInterval(interval);
      }
    }, 1000);

    // Check inicial (por si vuelve user con state ya cumplido)
    const initialState = loadTrackerState();
    if (shouldShowEmailPrompt(initialState)) {
      // Pequeño delay para no saltar nada más cargar
      const t = setTimeout(() => {
        setVisible(true);
        markEmailPromptShown();
      }, 1500);
      return () => {
        clearTimeout(t);
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = emailValidator.safeParse(email);
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Email no válido");
      return;
    }

    setStatus("submitting");
    try {
      const tracker = loadTrackerState();
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Visitante anónimo",
          email,
          message: "Captura email progresivo desde Storybook 3D",
          sage_analysis_extra: {
            audit_source: "storybook_lite_capture",
            islands_visited: tracker.islandsVisited,
            seconds_on_site: tracker.secondsOnSite,
          },
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || "Error al enviar");
      }
      setEmailCaptured(email);
      setStatus("success");
      // Auto-cerrar tras 3s
      setTimeout(() => setVisible(false), 3000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const dismiss = () => setVisible(false);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="email-prompt"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-label="Captura de email"
          className="
            fixed z-40 left-1/2 -translate-x-1/2
            bottom-24 sm:bottom-6 sm:left-6 sm:translate-x-0
            w-[calc(100%-2rem)] max-w-md
            rounded-2xl bg-paper border border-ink/10 shadow-xl shadow-ink/10
            p-5 sm:p-6
          "
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar"
            className="absolute top-3 right-3 h-7 w-7 rounded-full text-ink/40 hover:text-ink/80 hover:bg-ink/5 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {status === "success" ? (
            <div>
              <p className="font-display text-lg font-bold text-ink mb-1">
                ✓ Te lo mando ya
              </p>
              <p className="text-sm text-ink/70">
                Revisa tu bandeja en unos minutos.
              </p>
            </div>
          ) : (
            <>
              <p className="font-display text-lg font-bold text-ink mb-1">
                ✨ {EMAIL_PROMPT_TITLE}
              </p>
              <p className="text-sm text-ink/70 mb-4">{EMAIL_PROMPT_BODY}</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    aria-label="Email"
                    required
                    disabled={status === "submitting"}
                    className="flex-1 rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus-visible:outline-none focus-visible:border-terracotta-500"
                  />
                  <button
                    type="submit"
                    disabled={status === "submitting" || !email}
                    className="rounded-lg bg-terracotta-500 px-4 py-2 text-sm font-medium text-paper hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500"
                  >
                    {status === "submitting" ? "..." : "Mándamelo"}
                  </button>
                </div>
                {errorMsg && (
                  <p className="text-xs text-red-600" role="alert">
                    {errorMsg}
                  </p>
                )}
              </form>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
