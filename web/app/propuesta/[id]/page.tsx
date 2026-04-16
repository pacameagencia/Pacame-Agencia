"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  Check, Clock, ArrowRight, MessageSquare, Shield,
  FileCheck, Loader2, AlertCircle, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";
import Celebration from "@/components/effects/Celebration";

async function handlePayNow(proposalId: string, totalOnetime: number, totalMonthly: number, clientName: string, leadId: string) {
  try {
    // Determine payment type based on services
    const hasOnetime = totalOnetime > 0;
    const hasMonthly = totalMonthly > 0;

    // If both, start with onetime payment
    const amount = hasOnetime ? totalOnetime : totalMonthly;
    const mode = (hasOnetime ? "payment" : "subscription") as "payment" | "subscription";

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        product: hasOnetime ? "Proyecto PACAME" : "Suscripcion PACAME",
        mode,
        client_name: clientName,
        client_email: "",
        lead_id: leadId,
        proposal_id: proposalId,
        services: "web,seo", // Will be filled from proposal
        success_url: `https://pacameagencia.com/propuesta/${proposalId}?paid=true`,
        cancel_url: `https://pacameagencia.com/propuesta/${proposalId}`,
      }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  } catch {
    // Fallback to WhatsApp
    window.open("https://wa.me/34722669381?text=Hola%20Pablo%2C%20quiero%20aceptar%20la%20propuesta", "_blank");
  }
}

interface ProposalData {
  id: string;
  brief_original: string;
  sage_analysis: {
    title?: string;
    greeting?: string;
    diagnosis?: string[];
    solution?: string[];
    timeline?: Array<{ week: string; tasks: string }>;
    deliverables?: string[];
    guarantee?: string;
    cta?: string;
  };
  services_proposed: Array<{ name: string; price: number; type: string }>;
  total_onetime: number;
  total_monthly: number;
  status: string;
  created_at: string;
  lead: { name: string; business_name: string } | null;
}

export default function PublicProposalPage() {
  const params = useParams();
  const id = params.id as string;
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchProposal() {
      const { data } = await supabase
        .from("proposals")
        .select("id, brief_original, sage_analysis, services_proposed, total_onetime, total_monthly, status, created_at, leads(name, business_name)")
        .eq("id", id)
        .single();

      if (!data) {
        setError(true);
        setLoading(false);
        return;
      }

      // Mark as viewed via public tracking endpoint (no anon writes)
      if (data.status === "sent") {
        fetch("/api/proposals/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }).catch(() => {});
      }

      setProposal({
        ...data,
        sage_analysis: (data.sage_analysis || {}) as ProposalData["sage_analysis"],
        services_proposed: (data.services_proposed || []) as ProposalData["services_proposed"],
        lead: (Array.isArray(data.leads) ? data.leads[0] : data.leads) as ProposalData["lead"],
      });
      setLoading(false);
    }
    if (id) fetchProposal();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-pacame-black min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-electric-violet" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="bg-pacame-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-pacame-white/20 mx-auto mb-4" />
          <h1 className="font-heading font-bold text-xl text-pacame-white mb-2">Propuesta no encontrada</h1>
          <p className="text-sm text-pacame-white/40 font-body mb-6">
            Este enlace puede haber expirado o no ser valido.
          </p>
          <Button variant="gradient" asChild>
            <Link href="/contacto">Contactar con PACAME</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sage = proposal.sage_analysis;
  const services = proposal.services_proposed;
  const onetimeServices = services.filter((s) => s.type === "onetime");
  const monthlyServices = services.filter((s) => s.type === "monthly");
  const clientName = proposal.lead?.name || "Cliente";
  const businessName = proposal.lead?.business_name || "";
  const [paying, setPaying] = useState(false);

  // Check if just paid
  const justPaid = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("paid") === "true";

  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Payment success celebration */}
      {justPaid && <Celebration />}
      {justPaid && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-lime-pulse/20 border-b border-lime-pulse/30 px-4 py-3 text-center">
          <p className="text-sm font-body text-lime-pulse font-medium">
            <Check className="w-4 h-4 inline-block mr-2" />
            Pago procesado correctamente. Nuestro equipo ya esta trabajando en tu proyecto.
          </p>
        </div>
      )}

      {/* Hero */}
      <section className={`relative ${justPaid ? "pt-44" : "pt-32"} pb-16 overflow-hidden`}>
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-electric-violet/15 rounded-full blur-[140px] pointer-events-none" />

        <ScrollReveal className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-electric-violet/10 border border-electric-violet/20 mb-6">
            <FileCheck className="w-4 h-4 text-electric-violet" />
            <span className="text-sm text-electric-violet font-body font-medium">Propuesta personalizada</span>
          </div>

          <h1 className="font-heading font-bold text-[clamp(2rem,4vw,3rem)] text-pacame-white leading-tight mb-4">
            {sage.title || `Propuesta para ${businessName || clientName}`}
          </h1>

          {sage.greeting && (
            <p className="text-lg text-pacame-white/60 font-body max-w-2xl mx-auto">
              {sage.greeting}
            </p>
          )}
        </ScrollReveal>
      </section>

      {/* Diagnosis */}
      {sage.diagnosis && sage.diagnosis.length > 0 && (
        <section className="section-padding bg-dark-elevated">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="font-heading font-bold text-xl text-pacame-white mb-6">Lo que hemos detectado</h2>
            </ScrollReveal>
            <StaggerContainer className="space-y-4" staggerDelay={0.1}>
              {sage.diagnosis.map((point, i) => (
                <StaggerItem key={i}>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-dark-card border border-white/[0.06] card-golden-shine">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-heading font-bold text-amber-400">{i + 1}</span>
                    </div>
                    <p className="text-sm text-pacame-white/70 font-body leading-relaxed">{point}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"><GoldenDivider variant="line" /></div>

      {/* Solution */}
      {sage.solution && sage.solution.length > 0 && (
        <section className="section-padding bg-pacame-black">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="font-heading font-bold text-xl text-pacame-white mb-6">Nuestra solucion</h2>
            </ScrollReveal>
            <StaggerContainer className="space-y-3" staggerDelay={0.1}>
              {sage.solution.map((step, i) => (
                <StaggerItem key={i}>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-electric-violet/15 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-electric-violet" />
                    </div>
                    <p className="text-sm text-pacame-white/70 font-body leading-relaxed pt-1.5">{step}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Services & Pricing */}
      <section className="section-padding bg-dark-elevated">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="font-heading font-bold text-xl text-pacame-white mb-6">Inversion</h2>
          </ScrollReveal>

          {onetimeServices.length > 0 && (
            <ScrollReveal delay={0.1} className="mb-6">
              <h3 className="text-xs font-mono uppercase tracking-widest text-pacame-white/40 mb-3">Pago unico</h3>
              <div className="space-y-2">
                {onetimeServices.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-dark-card border border-white/[0.06]">
                    <span className="text-sm text-pacame-white font-body">{s.name}</span>
                    <span className="font-heading font-bold text-pacame-white">{s.price.toLocaleString("es-ES")}€</span>
                  </div>
                ))}
                <CardTilt tiltMaxAngle={4}>
                  <CardTiltContent className="flex items-center justify-between p-4 rounded-xl bg-electric-violet/10 border border-electric-violet/20 card-golden-shine">
                    <span className="text-sm text-pacame-white font-heading font-semibold">Total unico</span>
                    <span className="font-heading font-bold text-xl text-pacame-white">
                      {Number(proposal.total_onetime).toLocaleString("es-ES")}€
                    </span>
                  </CardTiltContent>
                </CardTilt>
              </div>
            </ScrollReveal>
          )}

          {monthlyServices.length > 0 && (
            <ScrollReveal delay={0.2}>
              <h3 className="text-xs font-mono uppercase tracking-widest text-pacame-white/40 mb-3">Mensual</h3>
              <div className="space-y-2">
                {monthlyServices.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-dark-card border border-white/[0.06]">
                    <span className="text-sm text-pacame-white font-body">{s.name}</span>
                    <span className="font-heading font-bold text-lime-pulse">{s.price.toLocaleString("es-ES")}€/mes</span>
                  </div>
                ))}
                <CardTilt tiltMaxAngle={4}>
                  <CardTiltContent className="flex items-center justify-between p-4 rounded-xl bg-lime-pulse/10 border border-lime-pulse/20 card-golden-shine">
                    <span className="text-sm text-pacame-white font-heading font-semibold">Total mensual</span>
                    <span className="font-heading font-bold text-xl text-lime-pulse">
                      {Number(proposal.total_monthly).toLocaleString("es-ES")}€/mes
                    </span>
                  </CardTiltContent>
                </CardTilt>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"><GoldenDivider variant="line" /></div>

      {/* Timeline */}
      {sage.timeline && sage.timeline.length > 0 && (
        <section className="section-padding bg-pacame-black">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="font-heading font-bold text-xl text-pacame-white mb-6">Timeline</h2>
            </ScrollReveal>
            <StaggerContainer className="space-y-4" staggerDelay={0.1}>
              {sage.timeline.map((item, i) => (
                <StaggerItem key={i}>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-neon-cyan/15 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-neon-cyan" />
                    </div>
                    <div>
                      <div className="text-sm font-heading font-semibold text-neon-cyan">{item.week}</div>
                      <p className="text-sm text-pacame-white/60 font-body">{item.tasks}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Deliverables */}
      {sage.deliverables && sage.deliverables.length > 0 && (
        <section className="section-padding bg-dark-elevated">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="font-heading font-bold text-xl text-pacame-white mb-6">Que incluye</h2>
            </ScrollReveal>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-3" staggerDelay={0.08}>
              {sage.deliverables.map((d, i) => (
                <StaggerItem key={i}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-card border border-white/[0.06] card-golden-shine">
                    <Check className="w-4 h-4 text-lime-pulse flex-shrink-0" />
                    <span className="text-sm text-pacame-white/70 font-body">{d}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"><GoldenDivider variant="laurel" /></div>

      {/* Guarantee */}
      <section className="section-padding bg-pacame-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <CardTilt tiltMaxAngle={4}>
              <CardTiltContent className="rounded-2xl bg-brand-gradient p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10">
                  <Shield className="w-10 h-10 text-white mx-auto mb-4 golden-pulse" />
                  <h2 className="font-heading font-bold text-xl text-white mb-3">Garantia</h2>
                  <p className="text-white/80 font-body max-w-lg mx-auto">
                    {sage.guarantee || "Satisfaccion garantizada o devolucion del 100%. 2 rondas de revision incluidas en cada proyecto. 30 dias de soporte tecnico gratuito post-entrega."}
                  </p>
                </div>
              </CardTiltContent>
            </CardTilt>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-dark-elevated text-center">
        <ScrollReveal className="max-w-2xl mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-pacame-white mb-4">
            {sage.cta || "¿Empezamos?"}
          </h2>
          <p className="text-pacame-white/60 font-body mb-8">
            Acepta la propuesta y empezamos a trabajar hoy mismo.
          </p>

          {/* Payment button — THE most important CTA on the site */}
          {(proposal.total_onetime > 0 || proposal.total_monthly > 0) && proposal.status !== "accepted" && !justPaid && (
            <div className="mb-6">
              {paying ? (
                <Button
                  variant="gradient"
                  size="xl"
                  className="shadow-glow-violet"
                  disabled
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </Button>
              ) : (
                <MagneticButton>
                  <ShinyButton
                    gradientFrom="#D4A853"
                    gradientTo="#7C3AED"
                    gradientOpacity={0.8}
                    className="min-w-[320px] h-16 px-10 text-lg font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
                  >
                    <button
                      type="button"
                      className="flex items-center gap-3 text-pacame-white w-full h-full justify-center"
                      onClick={async () => {
                        setPaying(true);
                        await handlePayNow(
                          proposal.id,
                          proposal.total_onetime,
                          proposal.total_monthly,
                          clientName,
                          proposal.id,
                        );
                        setPaying(false);
                      }}
                    >
                      <CreditCard className="w-5 h-5" />
                      Aceptar y pagar {proposal.total_onetime > 0
                        ? `${Number(proposal.total_onetime).toLocaleString("es-ES")}€`
                        : `${Number(proposal.total_monthly).toLocaleString("es-ES")}€/mes`}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </ShinyButton>
                </MagneticButton>
              )}
              <p className="text-xs text-pacame-white/30 font-body mt-3">Pago seguro con Stripe · Factura incluida</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="outline" size="lg" asChild className="group border-white/[0.08] hover:border-white/20">
              <a href="https://wa.me/34722669381?text=Hola%20Pablo%2C%20he%20visto%20la%20propuesta%20y%20me%20interesa" target="_blank" rel="noopener noreferrer">
                <MessageSquare className="w-4 h-4" />
                Hablar por WhatsApp
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild className="border-white/[0.08] hover:border-white/20">
              <Link href="/contacto">Contactar</Link>
            </Button>
          </div>

          <p className="text-xs text-pacame-white/30 font-body mt-8">
            Propuesta valida durante 14 dias · Creada el {new Date(proposal.created_at).toLocaleDateString("es-ES")}
          </p>
        </ScrollReveal>
      </section>
    </div>
  );
}
