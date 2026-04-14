"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users, DollarSign, TrendingUp, CheckCircle2, ArrowRight,
  Send, Loader2, Zap, Shield, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TIERS = [
  {
    name: "Bronce",
    range: "1-2 referidos",
    firstPct: "15%",
    recurringPct: "10%",
    months: "6 meses",
    color: "#CD7F32",
    example: "Si traes un restaurante que contrata redes a 397€/mes → 60€ primer mes + 40€/mes x 6 meses = 300€",
  },
  {
    name: "Plata",
    range: "3-5 referidos",
    firstPct: "20%",
    recurringPct: "12%",
    months: "9 meses",
    color: "#C0C0C0",
    example: "Si traes 3 negocios a 497€/mes → +1.600€ el primer año solo en comisiones recurrentes",
  },
  {
    name: "Oro",
    range: "6+ referidos",
    firstPct: "25%",
    recurringPct: "15%",
    months: "Indefinido",
    color: "#FFD700",
    example: "Red de 6+ clientes → ingresos pasivos recurrentes mientras sigan con PACAME. Sin limite.",
  },
];

const WHO_IS_FOR = [
  { title: "Gestores y asesores fiscales", desc: "Tus clientes necesitan web y marketing. Tu recomiendas, nosotros ejecutamos." },
  { title: "Community managers freelance", desc: "Ofrece servicios premium a tus clientes sin ampliar tu equipo." },
  { title: "Agentes inmobiliarios", desc: "Cada inmobiliaria que abren necesita presencia digital. Tu contacto vale dinero." },
  { title: "Consultores de negocio", desc: "Complementa tu asesoria con servicios de ejecucion digital real." },
  { title: "Coworkings y aceleradoras", desc: "Tu comunidad de emprendedores necesita lo que PACAME ofrece." },
  { title: "Cualquier profesional con red", desc: "Si conoces PYMEs, puedes ganar dinero recomendandolas." },
];

export default function ColaboraPage() {
  const [state, setState] = useState<"form" | "sending" | "success">("form");
  const [partnerCode, setPartnerCode] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_partner",
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          type: "freelance",
        }),
      });
      const data = await res.json();
      setPartnerCode(data.partner_code || "");
      setState("success");
    } catch {
      setState("success");
    }
  }

  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-electric-violet/[0.05] rounded-full blur-[200px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-lime-pulse mb-5 uppercase tracking-[0.2em]">
            Programa de colaboradores
          </p>
          <h1 className="font-heading font-bold text-display text-pacame-white leading-tight mb-6">
            Tu recomiendas.
            <br />
            <span className="gradient-text-vivid">Nosotros ejecutamos. Tu cobras.</span>
          </h1>
          <p className="text-lg text-pacame-white/60 font-body font-light max-w-2xl mx-auto mb-8">
            Gana comisiones recurrentes por cada negocio que recomiendes a PACAME.
            Sin exclusividad, sin compromiso, sin tener que vender nada.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-pacame-white/50 font-body">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-lime-pulse" />
              Hasta 25% de comision
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-lime-pulse" />
              Ingresos recurrentes
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-lime-pulse" />
              Sin permanencia
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-lime-pulse" />
              5 min de setup
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding bg-pacame-black border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[13px] font-body font-medium text-electric-violet mb-5 uppercase tracking-[0.2em]">
              Como funciona
            </p>
            <h2 className="font-heading font-bold text-section text-pacame-white">
              3 pasos. Cero complicaciones.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Te registras", desc: "Rellenar el formulario te lleva 1 minuto. Recibes tu link personal y tu codigo de colaborador.", icon: Users },
              { step: "2", title: "Recomiendas", desc: "Comparte tu link o dile que va de tu parte. Tu NO vendes nada. PACAME se encarga de cerrar.", icon: Send },
              { step: "3", title: "Cobras", desc: "Cada vez que un negocio que recomendaste firma, tu recibes comision. El primer mes y los siguientes.", icon: DollarSign },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl bg-dark-card border border-white/[0.06] p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-electric-violet/15 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-electric-violet" />
                </div>
                <div className="font-heading font-bold text-lg text-pacame-white mb-2">{item.title}</div>
                <p className="text-sm text-pacame-white/50 font-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="section-padding bg-pacame-black">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[13px] font-body font-medium text-amber-signal mb-5 uppercase tracking-[0.2em]">
              Comisiones
            </p>
            <h2 className="font-heading font-bold text-section text-pacame-white">
              Cuanto mas recomiendes, mas ganas.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div key={tier.name} className="rounded-2xl bg-dark-card border border-white/[0.06] p-6 hover:border-white/10 transition-colors">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 font-heading font-bold text-lg"
                  style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                >
                  {tier.name[0]}
                </div>
                <h3 className="font-heading font-bold text-xl text-pacame-white mb-1">{tier.name}</h3>
                <p className="text-xs text-pacame-white/60 font-body mb-4">{tier.range}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-pacame-white/50 font-body">Primer pago</span>
                    <span className="font-heading font-bold text-pacame-white">{tier.firstPct}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-pacame-white/50 font-body">Recurrente</span>
                    <span className="font-heading font-bold text-pacame-white">{tier.recurringPct}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-pacame-white/50 font-body">Duracion</span>
                    <span className="font-heading font-bold text-pacame-white">{tier.months}</span>
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.03] p-3">
                  <p className="text-xs text-pacame-white/60 font-body">{tier.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is this for */}
      <section className="section-padding bg-pacame-black border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[13px] font-body font-medium text-neon-cyan mb-5 uppercase tracking-[0.2em]">
              Para quien es
            </p>
            <h2 className="font-heading font-bold text-section text-pacame-white">
              Si conoces PYMEs, esto te interesa.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHO_IS_FOR.map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-dark-card border border-white/[0.06]">
                <CheckCircle2 className="w-5 h-5 text-lime-pulse flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-heading font-semibold text-sm text-pacame-white mb-1">{item.title}</h3>
                  <p className="text-xs text-pacame-white/60 font-body">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="section-padding bg-pacame-black">
        <div className="max-w-xl mx-auto px-6">
          {state === "success" ? (
            <div className="rounded-3xl glass p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-lime-pulse/20 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-lime-pulse" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-pacame-white mb-3">
                Bienvenido al equipo
              </h2>
              {partnerCode && (
                <div className="rounded-xl bg-dark-card border border-white/[0.06] p-4 mb-4">
                  <p className="text-xs text-pacame-white/60 font-body mb-1">Tu codigo de colaborador:</p>
                  <p className="font-mono text-lg text-electric-violet font-bold">{partnerCode}</p>
                  <p className="text-xs text-pacame-white/60 font-body mt-2">
                    Tu link: pacameagencia.com/p/{partnerCode}
                  </p>
                </div>
              )}
              <p className="text-pacame-white/60 font-body mb-6">
                Te enviaremos un email con tu kit de colaborador: link personal, argumentario y todo lo que necesitas.
              </p>
              <Button variant="outline" asChild>
                <Link href="/">
                  Volver al inicio
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <p className="text-[13px] font-body font-medium text-electric-violet mb-5 uppercase tracking-[0.2em]">
                  Unete
                </p>
                <h2 className="font-heading font-bold text-[clamp(1.5rem,4vw,2.5rem)] text-pacame-white leading-tight mb-4">
                  Empieza a ganar hoy
                </h2>
                <p className="text-pacame-white/60 font-body">
                  1 minuto de registro. Sin compromiso. Comisiones desde el primer referido.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-body text-pacame-white/70 mb-2">Nombre completo *</label>
                  <input
                    name="name"
                    required
                    placeholder="Tu nombre"
                    className="w-full h-12 px-4 rounded-xl bg-dark-card border border-white/[0.06] text-pacame-white font-body text-sm placeholder:text-pacame-white/50 focus:border-electric-violet focus:ring-1 focus:ring-electric-violet outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body text-pacame-white/70 mb-2">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    className="w-full h-12 px-4 rounded-xl bg-dark-card border border-white/[0.06] text-pacame-white font-body text-sm placeholder:text-pacame-white/50 focus:border-electric-violet focus:ring-1 focus:ring-electric-violet outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body text-pacame-white/70 mb-2">Telefono</label>
                  <input
                    name="phone"
                    placeholder="+34 600 000 000"
                    className="w-full h-12 px-4 rounded-xl bg-dark-card border border-white/[0.06] text-pacame-white font-body text-sm placeholder:text-pacame-white/50 focus:border-electric-violet focus:ring-1 focus:ring-electric-violet outline-none transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="xl"
                  className="w-full group"
                  disabled={state === "sending"}
                >
                  {state === "sending" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Quiero ser colaborador
                    </>
                  )}
                </Button>

                <p className="text-xs text-pacame-white/60 font-body text-center">
                  Sin permanencia. Sin exclusividad. Cancela cuando quieras.{" "}
                  <Link href="/privacidad" className="text-electric-violet/60 hover:underline">
                    Politica de privacidad
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
