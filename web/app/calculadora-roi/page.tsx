"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calculator, ArrowRight, Zap, TrendingUp, DollarSign,
  Users, BarChart3, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";

const sectors = [
  "Restaurante / Bar",
  "Peluqueria / Estetica",
  "Clinica dental",
  "Gimnasio / Centro deportivo",
  "Inmobiliaria",
  "Tienda local",
  "Consultor / Freelance",
  "Academia / Formacion",
  "Clinica veterinaria",
  "Estudio de arquitectura",
  "Otro",
];

const investmentOptions = [
  { label: "Despega", monthly: 180, description: "Web + logo + SEO basico (pago unico ~2.150€)", avgLeadsMonth: 15, avgConversion: 8 },
  { label: "Escala", monthly: 350, description: "Web + SEO 3 meses + Ads (pago unico ~4.250€)", avgLeadsMonth: 25, avgConversion: 10 },
  { label: "Domina", monthly: 600, description: "Web + branding + SEO + RRSS + Ads 6 meses", avgLeadsMonth: 40, avgConversion: 12 },
  { label: "Solo SEO mensual", monthly: 400, description: "Posicionamiento organico mensual", avgLeadsMonth: 20, avgConversion: 8 },
];

export default function CalculadoraROIPage() {
  const [sector, setSector] = useState("");
  const [ticketMedio, setTicketMedio] = useState(50);
  const [clientesMes, setClientesMes] = useState(100);
  const [selectedPack, setSelectedPack] = useState(2);
  const [calculated, setCalculated] = useState(false);

  const pack = investmentOptions[selectedPack];
  const newLeads = pack.avgLeadsMonth;
  const newClients = Math.round(newLeads * (pack.avgConversion / 100));
  const revenueIncrease = newClients * ticketMedio;
  const yearlyRevenue = revenueIncrease * 12;
  const yearlyCost = pack.monthly * 12;
  const roi = yearlyCost > 0 ? Math.round(((yearlyRevenue - yearlyCost) / yearlyCost) * 100) : 0;
  const paybackMonths = revenueIncrease > 0 ? Math.ceil(pack.monthly / revenueIncrease) : 99;

  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] bg-lime-pulse/[0.05] rounded-full blur-[200px] pointer-events-none" />

        <ScrollReveal className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-body text-pacame-white/60 mb-6">
            <Calculator className="w-3.5 h-3.5 text-lime-pulse" />
            Herramienta gratuita
          </div>

          <h1 className="font-heading font-bold text-display text-pacame-white leading-tight mb-6">
            ¿Cuanto dinero estas
            <br />
            <span className="gradient-text-vivid">dejando en la mesa?</span>
          </h1>
          <p className="text-lg text-pacame-white/60 font-body font-light max-w-xl mx-auto">
            Calcula en 30 segundos el retorno de inversion que tendria
            contratar marketing digital para tu negocio.
          </p>
        </ScrollReveal>
      </section>

      {/* Calculator */}
      <section className="section-padding">
        <div className="px-6"><GoldenDivider variant="line" /></div>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-6">
              <CardTilt tiltMaxAngle={4} scale={1.01}>
              <CardTiltContent>
              <div className="rounded-2xl glass p-6">
                <h2 className="font-heading font-semibold text-lg text-pacame-white mb-5">Tu negocio</h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs text-pacame-white/50 font-body mb-2">Sector</label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-dark-card border border-white/[0.06] text-pacame-white font-body text-sm focus:border-electric-violet outline-none"
                    >
                      <option value="">Selecciona tu sector</option>
                      {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-pacame-white/50 font-body mb-2">
                      Ticket medio por cliente: <strong className="text-pacame-white">{ticketMedio}€</strong>
                    </label>
                    <input
                      type="range" min={10} max={500} step={5} value={ticketMedio}
                      onChange={(e) => setTicketMedio(Number(e.target.value))}
                      className="w-full premium-range"
                    />
                    <div className="flex justify-between text-[10px] text-pacame-white/50 font-body mt-1">
                      <span>10€</span><span>500€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-pacame-white/50 font-body mb-2">
                      Clientes actuales al mes: <strong className="text-pacame-white">{clientesMes}</strong>
                    </label>
                    <input
                      type="range" min={10} max={500} step={5} value={clientesMes}
                      onChange={(e) => setClientesMes(Number(e.target.value))}
                      className="w-full premium-range"
                    />
                    <div className="flex justify-between text-[10px] text-pacame-white/50 font-body mt-1">
                      <span>10</span><span>500</span>
                    </div>
                  </div>
                </div>
              </div>
              </CardTiltContent>
              </CardTilt>

              <CardTilt tiltMaxAngle={4} scale={1.01}>
              <CardTiltContent>
              <div className="rounded-2xl glass p-6">
                <h2 className="font-heading font-semibold text-lg text-pacame-white mb-5">Inversion</h2>
                <div className="space-y-3">
                  {investmentOptions.map((opt, i) => (
                    <button
                      key={opt.label}
                      onClick={() => { setSelectedPack(i); setCalculated(true); }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedPack === i
                          ? "bg-electric-violet/10 border-electric-violet/30"
                          : "bg-white/[0.03] border-white/[0.06] hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-heading font-semibold text-sm text-pacame-white">{opt.label}</span>
                          <p className="text-xs text-pacame-white/60 font-body mt-0.5">{opt.description}</p>
                        </div>
                        <span className="font-heading font-bold text-lg text-pacame-white">{opt.monthly}€<span className="text-xs text-pacame-white/60">/mes</span></span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              </CardTiltContent>
              </CardTilt>

              {!calculated && (
                <MagneticButton>
                  <ShinyButton
                    gradientFrom="#84CC16"
                    gradientTo="#06B6D4"
                    gradientOpacity={0.8}
                    className="group w-full h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
                  >
                    <button onClick={() => setCalculated(true)} className="flex items-center gap-2 text-pacame-white w-full justify-center">
                      <Calculator className="w-4 h-4" />
                      Calcular mi ROI
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </ShinyButton>
                </MagneticButton>
              )}
            </div>

            {/* Results */}
            <ScrollReveal className={`space-y-5 transition-opacity duration-500 ${calculated ? "opacity-100" : "opacity-30"}`}>
              <CardTilt tiltMaxAngle={6} scale={1.02}>
              <CardTiltContent>
              <div className="rounded-3xl glass p-8 text-center card-golden-shine">
                <p className="text-xs text-pacame-white/60 font-body uppercase tracking-widest mb-2">ROI estimado</p>
                <div className={`font-heading font-bold text-6xl mb-2 ${roi > 0 ? "text-lime-pulse" : "text-amber-signal"}`}>
                  {roi}%
                </div>
                <p className="text-sm text-pacame-white/50 font-body">retorno anual sobre tu inversion</p>
              </div>
              </CardTiltContent>
              </CardTilt>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
                  <Users className="w-5 h-5 text-neon-cyan mx-auto mb-2" />
                  <div className="font-heading font-bold text-2xl text-neon-cyan">{newLeads}</div>
                  <div className="text-[10px] text-pacame-white/60 font-body">leads nuevos/mes</div>
                </div>
                <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
                  <Target className="w-5 h-5 text-electric-violet mx-auto mb-2" />
                  <div className="font-heading font-bold text-2xl text-electric-violet">{newClients}</div>
                  <div className="text-[10px] text-pacame-white/60 font-body">clientes nuevos/mes</div>
                </div>
                <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
                  <DollarSign className="w-5 h-5 text-lime-pulse mx-auto mb-2" />
                  <div className="font-heading font-bold text-2xl text-lime-pulse">+{revenueIncrease}€</div>
                  <div className="text-[10px] text-pacame-white/60 font-body">ingresos extra/mes</div>
                </div>
                <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
                  <BarChart3 className="w-5 h-5 text-amber-signal mx-auto mb-2" />
                  <div className="font-heading font-bold text-2xl text-amber-signal">{paybackMonths > 12 ? "12+" : paybackMonths}</div>
                  <div className="text-[10px] text-pacame-white/60 font-body">meses payback</div>
                </div>
              </div>

              <div className="rounded-2xl glass p-6">
                <h3 className="font-heading font-semibold text-pacame-white mb-3">Resumen anual</h3>
                <div className="space-y-3 text-sm font-body">
                  <div className="flex justify-between">
                    <span className="text-pacame-white/50">Inversion anual</span>
                    <span className="text-pacame-white font-heading font-semibold">{yearlyCost.toLocaleString("es-ES")}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pacame-white/50">Ingresos extra estimados</span>
                    <span className="text-lime-pulse font-heading font-semibold">+{yearlyRevenue.toLocaleString("es-ES")}€</span>
                  </div>
                  <div className="border-t border-white/[0.06] pt-3 flex justify-between">
                    <span className="text-pacame-white/50">Beneficio neto estimado</span>
                    <span className="text-lime-pulse font-heading font-bold text-lg">+{(yearlyRevenue - yearlyCost).toLocaleString("es-ES")}€</span>
                  </div>
                </div>
              </div>

              {calculated && (
                <div className="rounded-2xl bg-brand-gradient p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10 text-center">
                    <TrendingUp className="w-6 h-6 text-white mx-auto mb-3" />
                    <p className="text-sm text-white/90 font-body mb-4">
                      Con el <strong>{pack.label}</strong> podrias generar <strong>+{yearlyRevenue.toLocaleString("es-ES")}€/ano</strong> extra invirtiendo solo <strong>{pack.monthly}€/mes</strong>.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="secondary" size="sm" asChild className="bg-white/20 border-white/30 text-white hover:bg-white/30 group">
                        <Link href="/contacto">
                          <Zap className="w-4 h-4" />
                          Empezar ahora
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                      <Button variant="secondary" size="sm" asChild className="bg-white/10 border-white/20 text-white/80 hover:bg-white/20">
                        <Link href="https://wa.me/34722669381?text=Hola! Acabo de calcular mi ROI y me interesa el pack" target="_blank" rel="noopener">
                          Hablar por WhatsApp
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-pacame-white/50 font-body text-center">
                *Estimaciones basadas en medias del sector. Los resultados reales pueden variar segun negocio, ubicacion y competencia.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}
