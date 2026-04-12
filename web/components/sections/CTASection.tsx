import Link from "next/link";
import { Calendar, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="section-padding bg-pacame-black relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-100" />

      {/* Ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-electric-violet/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="glass rounded-3xl p-10 sm:p-14 border border-white/[0.08]">
          {/* Headline */}
          <div className="mb-4">
            <span className="font-mono text-electric-violet text-sm uppercase tracking-widest">
              El siguiente paso
            </span>
          </div>

          <h2 className="font-heading font-bold text-[clamp(2rem,4vw,3.5rem)] text-pacame-white leading-tight mb-6">
            Tienes un problema digital.
            <br />
            <span className="gradient-text">Nosotros lo resolvemos.</span>
          </h2>

          <p className="text-lg text-pacame-white/60 font-body mb-10 max-w-xl mx-auto">
            30 minutos de llamada. Sin compromiso. Sin presupuestos ciegos.
            Solo escuchamos tu problema y te decimos si podemos ayudarte y cuánto cuesta.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button variant="gradient" size="xl" asChild className="group min-w-[240px]">
              <Link href="/contacto">
                <Calendar className="w-5 h-5" />
                Agendar llamada gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="group min-w-[200px]">
              <Link href="mailto:hola@pacameagencia.com">
                <MessageSquare className="w-4 h-4" />
                Escribir por email
              </Link>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-pacame-white/40 font-body">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-pulse" />
              Respuesta en menos de 2h
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-pulse" />
              Sin compromiso de contratación
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-pulse" />
              Presupuesto en 24h
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
