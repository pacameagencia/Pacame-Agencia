"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ArrowRight } from "lucide-react";

type Status = "loading" | "ready" | "already" | "submitting" | "submitted" | "error" | "invalid";

const SCORE_DESCRIPTORS: Record<number, string> = {
  0: "Nada probable",
  1: "Nada probable",
  2: "Muy poco probable",
  3: "Poco probable",
  4: "Poco probable",
  5: "Neutral",
  6: "Neutral",
  7: "Probable",
  8: "Probable",
  9: "Muy probable",
  10: "Totalmente seguro",
};

export default function NpsForm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [finalCategory, setFinalCategory] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Valida token al montar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/nps/${token}`);
        if (!res.ok) {
          if (!cancelled) setStatus("invalid");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data.already_responded) {
          setStatus("already");
          setFinalCategory(data.category);
          setScore(data.score);
        } else {
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submit() {
    if (score === null) return;
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/public/nps/${token}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ score, feedback: feedback.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || "Error");
        setStatus("error");
        return;
      }
      setFinalCategory(data.category);
      setStatus("submitted");
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("error");
    }
  }

  if (status === "loading") {
    return (
      <div className="text-center py-20 text-ink/50">
        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-accent-gold" />
        Cargando encuesta...
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="bg-paper-deep border border-ink/[0.08] rounded-2xl p-10 text-center">
        <h1 className="text-2xl font-bold mb-3 text-ink">Encuesta no encontrada</h1>
        <p className="text-ink/60 mb-6">
          El enlace no es valido o ha expirado. Si crees que es un error, escribenos a{" "}
          <a className="text-accent-gold" href="mailto:hola@pacameagencia.com">
            hola@pacameagencia.com
          </a>
          .
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-gold text-ink font-semibold text-sm"
        >
          Volver al inicio <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  if (status === "already" || status === "submitted") {
    const isPromoter = finalCategory === "promoter";
    return (
      <div className="bg-paper-deep border border-ink/[0.08] rounded-2xl p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-gold/15 border border-accent-gold/30 flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-accent-gold" />
        </div>
        <h1 className="text-2xl font-bold mb-3 text-ink">
          {status === "already" ? "Ya tenemos tu respuesta" : "Gracias por responder"}
        </h1>
        <p className="text-ink/60 mb-6 leading-relaxed">
          {isPromoter
            ? "¡Gracias! Nos alegra muchisimo. Si puedes, comparte lo que te ha gustado con alguien que crees que le vendria bien PACAME."
            : "Tomamos nota. Cada respuesta nos ayuda a mejorar el servicio."}
        </p>
        {isPromoter && (
          <a
            href="https://g.page/r/pacameagencia/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-gold text-ink font-semibold text-sm"
          >
            Dejar review en Google <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bg-paper-deep border border-ink/[0.08] rounded-2xl p-8 md:p-10">
      <div className="text-xs uppercase tracking-[0.2em] text-accent-gold/80 font-mono mb-3">
        Encuesta PACAME
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-ink mb-3 leading-tight">
        ¿Que probabilidad hay de que nos recomiendes a alguien que conoces?
      </h1>
      <p className="text-ink/60 mb-8">
        Del 0 (nada probable) al 10 (seguro que si). Solo 30 segundos.
      </p>

      {/* Score selector */}
      <div className="grid grid-cols-11 gap-1.5 mb-2">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => {
          const selected = score === n;
          const bg =
            n <= 6
              ? selected
                ? "bg-red-500 border-red-500 text-white"
                : "border-red-500/30 text-red-400/70 hover:bg-red-500/10"
              : n <= 8
              ? selected
                ? "bg-amber-500 border-amber-500 text-black"
                : "border-amber-500/30 text-amber-400/70 hover:bg-amber-500/10"
              : selected
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-emerald-500/30 text-emerald-400/70 hover:bg-emerald-500/10";
          return (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className={`py-3 rounded-lg border font-bold transition text-sm md:text-base ${bg}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-ink/40 mb-8 font-mono uppercase tracking-wider">
        <span>Nada probable</span>
        <span>Neutral</span>
        <span>Seguro</span>
      </div>

      {score !== null && (
        <div className="text-center mb-6 text-ink/70 text-sm">
          Seleccionaste <strong className="text-accent-gold">{score}</strong> —{" "}
          {SCORE_DESCRIPTORS[score]}
        </div>
      )}

      <label className="block text-sm text-ink/70 mb-2 font-medium">
        ¿Por que ese numero? <span className="text-ink/40">(opcional, pero nos ayuda)</span>
      </label>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder={
          score === null
            ? "Cuentanos lo que creas..."
            : score >= 9
            ? "¿Que te ha gustado mas?"
            : score <= 6
            ? "¿Que podriamos mejorar?"
            : "¿Que podria empujar el numero hacia arriba?"
        }
        rows={4}
        maxLength={2000}
        className="w-full bg-white/[0.02] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 text-sm outline-none focus:border-accent-gold/40 transition mb-6"
      />

      {errorMsg && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      <button
        type="button"
        disabled={score === null || status === "submitting"}
        onClick={submit}
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent-gold text-ink font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition hover:brightness-110"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
          </>
        ) : (
          <>
            Enviar respuesta <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-[11px] text-ink/40 mt-6">
        Tus datos se guardan cifrados. Nunca los compartimos con terceros. Si marcas 0-6, Pablo
        recibe un aviso para escribirte y entender que ha fallado.
      </p>
    </div>
  );
}
