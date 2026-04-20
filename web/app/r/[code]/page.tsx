"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Zap, ArrowRight, Gift, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReferralLandingPage() {
  const params = useParams();
  const code = params.code as string;
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!code) return;
    fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "track_visit", code }),
    })
      .then((r) => r.json())
      .then((d) => setValid(!!d.valid))
      .catch(() => setValid(false));
  }, [code]);

  return (
    <div className="bg-paper min-h-screen">
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-mint/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-mint/20 flex items-center justify-center mx-auto mb-6">
            <Gift className="w-8 h-8 text-mint" />
          </div>

          <h1 className="font-heading font-bold text-[clamp(2rem,5vw,3rem)] text-ink leading-tight mb-4">
            Alguien que confía en nosotros
            <br />
            <span className="gradient-text">te recomienda PACAME.</span>
          </h1>

          <p className="text-lg text-ink/60 font-body max-w-lg mx-auto mb-8">
            Tu contacto trabaja con nosotros y quiere que tu negocio también crezca.
            Como vienes recomendado, ambos os lleváis un <strong className="text-mint">10% de descuento</strong>.
          </p>

          {valid === false && (
            <p className="text-xs text-accent-gold/60 font-body mb-4">
              Codigo de referido no encontrado, pero puedes contactarnos igualmente.
            </p>
          )}

          <div className="rounded-2xl glass p-8 mb-8 text-left">
            <h2 className="font-heading font-semibold text-lg text-ink mb-4">
              Lo que incluye tu ventaja de referido:
            </h2>
            <div className="space-y-3">
              {[
                "10% de descuento en tu primer servicio",
                "Diagnostico gratuito de tu negocio en 24h",
                "Propuesta personalizada sin compromiso",
                "Tu contacto tambien recibe descuento",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-mint flex-shrink-0" />
                  <span className="text-sm text-ink/70 font-body">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="gradient" size="xl" asChild className="group">
              <Link href={`/contacto?ref=${code}`}>
                <Zap className="w-4 h-4" />
                Quiero mi diagnostico gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href={`https://wa.me/34722669381?text=Hola! Vengo recomendado con el codigo ${code}`} target="_blank" rel="noopener">
                Escribir por WhatsApp
              </Link>
            </Button>
          </div>

          <p className="text-xs text-ink/50 font-body mt-6">
            Codigo de referido: <span className="font-mono text-ink/40">{code}</span>
          </p>
        </div>
      </section>
    </div>
  );
}
