"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, CheckCircle2, Download, Loader2,
  Globe, Smartphone, Gauge, Eye, Shield, Search, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const errores = [
  {
    number: 1,
    icon: Globe,
    title: "No tener web — o tener una de hace 5 anos",
    problem: "El 73% de los consumidores juzgan la credibilidad de un negocio por su web. Si tu web parece de 2018, pierdes clientes antes de que te conozcan.",
    stat: "73%",
    statLabel: "juzgan por la web",
    solution: "Una web moderna, rapida y profesional desde 300€. Entrega en 5-7 dias.",
  },
  {
    number: 2,
    icon: Search,
    title: "No aparecer en Google cuando te buscan",
    problem: "Si alguien busca 'tu servicio + tu ciudad' y no sales en los primeros 5 resultados, no existes. El 75% de usuarios no pasa de la primera pagina.",
    stat: "75%",
    statLabel: "no pasan de pagina 1",
    solution: "SEO local optimizado: Google Business, meta tags, contenido. Resultados en 30-90 dias.",
  },
  {
    number: 3,
    icon: Smartphone,
    title: "Web no adaptada a movil",
    problem: "El 65% del trafico web viene de moviles. Si tu web no se ve bien en un telefono, pierdes 2 de cada 3 visitantes.",
    stat: "65%",
    statLabel: "del trafico es movil",
    solution: "Diseno mobile-first. Todas nuestras webs se ven perfectas en cualquier dispositivo.",
  },
  {
    number: 4,
    icon: Gauge,
    title: "Web lenta (mas de 3 segundos)",
    problem: "El 53% de los usuarios abandona una web que tarda mas de 3 segundos en cargar. Cada segundo extra reduce las conversiones un 7%.",
    stat: "53%",
    statLabel: "abandona si >3s",
    solution: "Optimizacion de rendimiento: imagenes WebP, lazy loading, CDN. Lighthouse 90+.",
  },
  {
    number: 5,
    icon: Eye,
    title: "Sin llamada a la accion clara",
    problem: "Tienes visitas pero nadie te contacta. El problema: no hay un boton visible que diga al usuario que hacer. Sin CTA, una web es un folleto digital.",
    stat: "0%",
    statLabel: "conversion sin CTA",
    solution: "CTAs estrategicos, formularios optimizados, WhatsApp widget. Conversion inmediata.",
  },
  {
    number: 6,
    icon: Shield,
    title: "No tener HTTPS (el candado verde)",
    problem: "Google penaliza las webs sin HTTPS. Chrome muestra 'No seguro' al visitante. Pierdes posicionamiento Y confianza a la vez.",
    stat: "-50%",
    statLabel: "trafico sin HTTPS",
    solution: "Certificado SSL gratuito incluido en todas nuestras webs. Configuracion automatica.",
  },
  {
    number: 7,
    icon: TrendingUp,
    title: "No medir nada (sin Analytics)",
    problem: "Si no mides, no mejoras. El 60% de las PYMEs no tiene Google Analytics instalado. No saben cuantas visitas tienen, de donde vienen ni que hacen.",
    stat: "60%",
    statLabel: "PYMEs sin analytics",
    solution: "Google Analytics 4 + Search Console configurados. Dashboard con metricas clave.",
  },
];

export default function SieteErroresPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("sending");

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: email.split("@")[0],
          email,
          source: "lead_magnet_7errores",
          services: [],
          message: "Descargo la guia de 7 errores",
        }),
      });
    } catch {
      // Non-blocking
    }
    setState("sent");
  }

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[300px] bg-red-500/8 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-body text-ink/60 mb-6">
            <AlertTriangle className="w-3.5 h-3.5 text-accent-gold" />
            Guia gratuita
          </div>

          <h1 className="font-heading font-bold text-[clamp(2rem,5vw,3.5rem)] text-ink leading-tight mb-6">
            7 errores que hacen que tu web
            <br />
            <span className="text-red-400">pierda clientes cada dia.</span>
          </h1>
          <p className="text-lg text-ink/60 font-body max-w-xl mx-auto mb-10">
            El 78% de las PYMEs en Espana comete al menos 3 de estos errores.
            Lee esta guia en 5 minutos y descubre cuales te afectan a ti.
          </p>
        </div>
      </section>

      {/* Errors */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <div className="space-y-6">
          {errores.map((error) => (
            <div key={error.number} className="rounded-2xl glass p-6 sm:p-8">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-heading font-bold text-2xl text-red-400">{error.number}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="font-heading font-bold text-lg text-ink">{error.title}</h2>
                    <div className="flex-shrink-0 text-right">
                      <div className="font-heading font-bold text-xl text-red-400">{error.stat}</div>
                      <div className="text-[10px] text-ink/50 font-body">{error.statLabel}</div>
                    </div>
                  </div>

                  <p className="text-sm text-ink/50 font-body mb-4 leading-relaxed">{error.problem}</p>

                  <div className="flex items-start gap-2 p-3 rounded-xl bg-mint/5 border border-mint/10">
                    <CheckCircle2 className="w-4 h-4 text-mint mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-mint/80 font-body">{error.solution}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-3xl bg-brand-gradient p-8 sm:p-12 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            {state === "sent" ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-white mx-auto mb-4" />
                <h2 className="font-heading font-bold text-2xl text-white mb-3">Guia en tu email</h2>
                <p className="text-white/80 font-body mb-6">
                  Revisa tu bandeja de entrada. Mientras tanto, ¿quieres que analicemos tu web gratis?
                </p>
                <Button variant="secondary" size="xl" asChild className="bg-white/20 border-white/30 text-white hover:bg-white/30 group">
                  <Link href="/auditoria">
                    Auditoria gratuita
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Download className="w-10 h-10 text-white mx-auto mb-4" />
                <h2 className="font-heading font-bold text-2xl text-white mb-3">
                  ¿Cuantos de estos errores tiene tu web?
                </h2>
                <p className="text-white/80 font-body mb-6 max-w-md mx-auto">
                  Dejanos tu email y te enviamos la guia completa en PDF con checklist
                  para que revises tu web punto por punto.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="flex-1 h-12 px-5 rounded-xl bg-white/10 border border-white/20 text-white font-body text-sm placeholder:text-white/50 focus:border-white/40 outline-none"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    size="lg"
                    className="bg-white text-ink hover:bg-white/90 font-heading font-bold"
                    disabled={state === "sending"}
                  >
                    {state === "sending" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Descargar gratis</>
                    )}
                  </Button>
                </form>
                <p className="text-xs text-white/50 font-body mt-4">
                  Sin spam. Solo la guia + un email de seguimiento.
                </p>
              </>
            )}
          </div>
        </div>

        {/* After the CTA, additional trust elements */}
        <div className="mt-8 text-center">
          <p className="text-xs text-ink/50 font-body mb-4">
            ¿No quieres dar tu email? No pasa nada. Toda la info esta en esta pagina.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" size="sm" asChild>
              <Link href="/contacto">
                Hablar con Pablo directamente
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/auditoria">
                Auditar mi web gratis
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/calculadora-roi">
                Calcular mi ROI
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
