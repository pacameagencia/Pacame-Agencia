"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  Check, Clock, ArrowRight, MessageSquare, Shield,
  FileCheck, Loader2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

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

      // Mark as viewed if currently "sent"
      if (data.status === "sent") {
        supabase.from("proposals").update({
          status: "viewed",
          viewed_at: new Date().toISOString(),
        }).eq("id", id).then(() => {});
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

  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-electric-violet/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
        </div>
      </section>

      {/* Diagnosis */}
      {sage.diagnosis && sage.diagnosis.length > 0 && (
        <section className="section-padding bg-dark-elevated">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-xl text-pacame-white mb-6">Lo que hemos detectado</h2>
            <div className="space-y-4">
              {sage.diagnosis.map((point, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-dark-card border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-heading font-bold text-amber-400">{i + 1}</span>
                  </div>
                  <p className="text-sm text-pacame-white/70 font-body leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Solution */}
      {sage.solution && sage.solution.length > 0 && (
        <section className="section-padding bg-pacame-black">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-xl text-pacame-white mb-6">Nuestra solucion</h2>
            <div className="space-y-3">
              {sage.solution.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-electric-violet/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-electric-violet" />
                  </div>
                  <p className="text-sm text-pacame-white/70 font-body leading-relaxed pt-1.5">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services & Pricing */}
      <section className="section-padding bg-dark-elevated">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading font-bold text-xl text-pacame-white mb-6">Inversion</h2>

          {onetimeServices.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-mono uppercase tracking-widest text-pacame-white/40 mb-3">Pago unico</h3>
              <div className="space-y-2">
                {onetimeServices.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-dark-card border border-white/[0.06]">
                    <span className="text-sm text-pacame-white font-body">{s.name}</span>
                    <span className="font-heading font-bold text-pacame-white">{s.price.toLocaleString("es-ES")}€</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-4 rounded-xl bg-electric-violet/10 border border-electric-violet/20">
                  <span className="text-sm text-pacame-white font-heading font-semibold">Total unico</span>
                  <span className="font-heading font-bold text-xl text-pacame-white">
                    {Number(proposal.total_onetime).toLocaleString("es-ES")}€
                  </span>
                </div>
              </div>
            </div>
          )}

          {monthlyServices.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-pacame-white/40 mb-3">Mensual</h3>
              <div className="space-y-2">
                {monthlyServices.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-dark-card border border-white/[0.06]">
                    <span className="text-sm text-pacame-white font-body">{s.name}</span>
                    <span className="font-heading font-bold text-lime-pulse">{s.price.toLocaleString("es-ES")}€/mes</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-4 rounded-xl bg-lime-pulse/10 border border-lime-pulse/20">
                  <span className="text-sm text-pacame-white font-heading font-semibold">Total mensual</span>
                  <span className="font-heading font-bold text-xl text-lime-pulse">
                    {Number(proposal.total_monthly).toLocaleString("es-ES")}€/mes
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Timeline */}
      {sage.timeline && sage.timeline.length > 0 && (
        <section className="section-padding bg-pacame-black">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-xl text-pacame-white mb-6">Timeline</h2>
            <div className="space-y-4">
              {sage.timeline.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-neon-cyan/15 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-neon-cyan" />
                  </div>
                  <div>
                    <div className="text-sm font-heading font-semibold text-neon-cyan">{item.week}</div>
                    <p className="text-sm text-pacame-white/60 font-body">{item.tasks}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Deliverables */}
      {sage.deliverables && sage.deliverables.length > 0 && (
        <section className="section-padding bg-dark-elevated">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-xl text-pacame-white mb-6">Que incluye</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sage.deliverables.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-dark-card border border-white/[0.06]">
                  <Check className="w-4 h-4 text-lime-pulse flex-shrink-0" />
                  <span className="text-sm text-pacame-white/70 font-body">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Guarantee */}
      <section className="section-padding bg-pacame-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-brand-gradient p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <Shield className="w-10 h-10 text-white mx-auto mb-4" />
              <h2 className="font-heading font-bold text-xl text-white mb-3">Garantia</h2>
              <p className="text-white/80 font-body max-w-lg mx-auto">
                {sage.guarantee || "Satisfaccion garantizada o devolucion del 100%. 2 rondas de revision incluidas en cada proyecto. 30 dias de soporte tecnico gratuito post-entrega."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-dark-elevated text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-pacame-white mb-4">
            {sage.cta || "¿Empezamos?"}
          </h2>
          <p className="text-pacame-white/60 font-body mb-8">
            Responde al email, escribenos por WhatsApp o rellena el formulario. Estamos listos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="gradient" size="xl" asChild className="group">
              <a href="https://wa.me/34722669381?text=Hola%20Pablo%2C%20he%20visto%20la%20propuesta%20y%20me%20interesa" target="_blank" rel="noopener noreferrer">
                <MessageSquare className="w-5 h-5" />
                WhatsApp directo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href="/contacto">Escribir por formulario</Link>
            </Button>
          </div>

          <p className="text-xs text-pacame-white/30 font-body mt-8">
            Propuesta valida durante 14 dias · Creada el {new Date(proposal.created_at).toLocaleDateString("es-ES")}
          </p>
        </div>
      </section>
    </div>
  );
}
