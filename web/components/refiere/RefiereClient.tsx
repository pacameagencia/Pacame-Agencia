"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Mail, TrendingUp, ArrowRight } from "lucide-react";

interface CodeData {
  code: string;
  discount_pct: number;
  commission_pct: number;
  stats: {
    total_uses: number;
    total_revenue_cents: number;
    total_commission_cents: number;
  };
}

export default function RefiereClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CodeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/referral/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.message || json?.error || "Error");
        return;
      }
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function copy(kind: "code" | "link") {
    if (!data) return;
    const text =
      kind === "code" ? data.code : `https://pacameagencia.com?ref=${data.code}`;
    navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  if (data) {
    const link = `https://pacameagencia.com?ref=${data.code}`;
    const eur = (c: number) => `${(c / 100).toLocaleString("es-ES")}€`;
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-gradient-to-br from-olympus-gold/10 via-amber-500/5 to-transparent border border-olympus-gold/30 p-8">
          <div className="text-[11px] uppercase tracking-wider text-olympus-gold font-mono mb-2">
            Tu codigo personal
          </div>
          <div className="font-heading font-bold text-4xl text-pacame-white mb-1">
            {data.code}
          </div>
          <div className="text-sm text-pacame-white/60 mb-6">
            {data.discount_pct}% descuento para tu amigo · {data.commission_pct}% comision
            para ti
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <input
                type="text"
                readOnly
                value={link}
                className="flex-1 bg-transparent text-sm text-pacame-white/80 outline-none font-mono"
              />
              <button
                onClick={() => copy("link")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-olympus-gold text-pacame-black text-xs font-semibold hover:brightness-110 transition"
              >
                {copied === "link" ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar link
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-5 border-t border-white/[0.06]">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-pacame-white/40 font-mono">
                Referidos
              </div>
              <div className="font-heading font-bold text-xl text-pacame-white">
                {data.stats.total_uses}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-pacame-white/40 font-mono">
                Facturacion
              </div>
              <div className="font-heading font-bold text-xl text-pacame-white">
                {eur(data.stats.total_revenue_cents)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-pacame-white/40 font-mono">
                Comision
              </div>
              <div className="font-heading font-bold text-xl text-olympus-gold">
                {eur(data.stats.total_commission_cents)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-5 rounded-xl bg-dark-card border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-electric-violet" />
            <span className="font-heading font-semibold text-pacame-white text-sm">
              Consejo de Pablo
            </span>
          </div>
          <p className="text-sm text-pacame-white/60 leading-relaxed">
            Los que mejor rinden mandan el link con un mensaje personal tipo: &quot;Oye, he
            estado probando PACAME y les curra bien — mira si te encaja. Con este link
            tienes 10% off&quot;. No necesita ser un discurso, necesita ser real.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="max-w-xl mx-auto p-8 rounded-2xl bg-dark-card border border-white/[0.08]"
    >
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-olympus-gold" />
        <span className="font-heading font-semibold text-pacame-white">
          Consigue tu codigo
        </span>
      </div>
      <label className="block text-sm text-pacame-white/60 mb-2">
        Email con el que compraste (necesitamos comprobar que eres cliente)
      </label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@empresa.com"
        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-pacame-white placeholder:text-pacame-white/30 text-sm outline-none focus:border-olympus-gold/40 transition mb-4"
      />
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!email || loading}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-olympus-gold text-pacame-black font-semibold text-sm disabled:opacity-50 hover:brightness-110 transition"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Generando...
          </>
        ) : (
          <>
            Generar mi codigo <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      <p className="text-[11px] text-pacame-white/40 mt-4 text-center">
        ¿Aun no eres cliente?{" "}
        <a href="/servicios" className="text-olympus-gold hover:underline">
          Empieza por aqui
        </a>
      </p>
    </form>
  );
}
