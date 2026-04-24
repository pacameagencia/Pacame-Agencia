"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, Loader2, RefreshCw } from "lucide-react";

const TONES = [
  { value: "premium", label: "Premium · sofisticado" },
  { value: "friendly", label: "Cercano · amable" },
  { value: "bold", label: "Atrevido · disruptivo" },
  { value: "editorial", label: "Editorial · sobrio" },
  { value: "tech", label: "Tech · innovador" },
  { value: "warm", label: "Calido · artesano" },
];

export default function SloganClient() {
  const [sector, setSector] = useState("");
  const [tone, setTone] = useState("premium");
  const [keywords, setKeywords] = useState("");
  const [slogans, setSlogans] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  async function handleGenerate() {
    if (!sector.trim()) {
      setError("Dinos que sector es tu marca");
      return;
    }
    setLoading(true);
    setError(null);
    setSlogans([]);
    try {
      const res = await fetch("/api/tools/slogan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sector, tone, keywords }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setSlogans(json.slogans || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function copy(slogan: string, idx: number) {
    navigator.clipboard.writeText(slogan);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-3xl bg-ink/[0.03] border border-ink/[0.08] space-y-5">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-2">
            Sector de tu marca *
          </label>
          <input
            type="text"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Ej: clinica dental premium, cafeteria de especialidad, academia idiomas"
            className="w-full bg-paper border border-ink/10 rounded-xl px-4 py-3 text-ink font-body text-[15px] outline-none focus:border-accent-gold/40 transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-2">
            Tono de voz
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={`text-left px-4 py-3 rounded-xl border transition-all ${
                  tone === t.value
                    ? "border-accent-gold bg-accent-gold/10 text-ink"
                    : "border-ink/10 bg-paper text-ink/70 hover:border-ink/20"
                }`}
              >
                <div className="font-heading font-semibold text-[13px]">
                  {t.label.split(" · ")[0]}
                </div>
                <div className="text-[11px] text-ink/50 font-body">
                  {t.label.split(" · ")[1]}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-2">
            3 palabras clave (opcional)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Ej: artesano, local, rapido"
            className="w-full bg-paper border border-ink/10 rounded-xl px-4 py-3 text-ink font-body text-[15px] outline-none focus:border-accent-gold/40 transition"
          />
          <div className="text-[11px] text-ink/40 mt-1.5 font-body">
            Separadas por coma. La IA las integrara naturalmente.
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !sector.trim()}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-accent-gold text-paper font-heading font-semibold text-[15px] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generando 10 slogans...
            </>
          ) : slogans.length > 0 ? (
            <>
              <RefreshCw className="w-4 h-4" /> Generar otra tanda
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Generar 10 slogans
            </>
          )}
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-accent-burgundy/10 border border-accent-burgundy/30 text-accent-burgundy text-[13px]" role="alert">
            {error}
          </div>
        )}
      </div>

      {slogans.length > 0 && (
        <div className="p-6 md:p-8 rounded-3xl bg-paper-soft/20 border border-ink/10">
          <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-accent-gold mb-6 pb-3 border-b border-ink/10">
            <span>§ RESULTADO</span>
            <span className="h-px w-8 bg-ink/20" />
            <span>{slogans.length} slogans tier-1 · Copia el que te convenza</span>
          </div>
          <ol className="space-y-3">
            {slogans.map((slogan, idx) => (
              <li
                key={idx}
                className="group flex items-start gap-4 p-4 rounded-xl bg-paper border border-ink/10 hover:border-accent-gold/30 transition"
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent-gold tabular-nums pt-1.5">
                  N°{String(idx + 1).padStart(2, "0")}
                </span>
                <p className="flex-1 font-accent italic text-[19px] md:text-[22px] text-ink leading-snug">
                  &ldquo;{slogan}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => copy(slogan, idx)}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-heading font-medium text-ink/60 hover:text-accent-gold hover:bg-accent-gold/10 transition"
                >
                  {copied === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
