import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pago confirmado — PACAME",
  description: "Tu pago ha sido procesado correctamente. El equipo PACAME se pone en marcha.",
  robots: { index: false, follow: false },
};

export default function GraciasPage() {
  return (
    <div className="bg-pacame-black min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        {/* Success icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-lime-pulse/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-lime-pulse" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-pacame-white mb-4">
          Pago confirmado
        </h1>
        <p className="text-lg text-pacame-white/60 font-body mb-10 leading-relaxed">
          Tu equipo PACAME ya esta en marcha. Recibiras un email con los proximos pasos
          en menos de 2 horas.
        </p>

        {/* Next steps */}
        <div className="bg-dark-card border border-white/[0.06] rounded-2xl p-7 mb-10 text-left">
          <h2 className="font-heading font-semibold text-lg text-pacame-white mb-5">
            Que pasa ahora
          </h2>
          <ol className="space-y-4">
            {[
              { step: "1", text: "Pablo revisa tu pedido y asigna los agentes adecuados" },
              { step: "2", text: "Te contactamos por email o WhatsApp para alinear detalles" },
              { step: "3", text: "Empezamos a trabajar. Entrega en el plazo acordado" },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-electric-violet/10 text-electric-violet font-heading font-bold text-sm flex items-center justify-center">
                  {item.step}
                </span>
                <span className="text-sm text-pacame-white/60 font-body pt-0.5">
                  {item.text}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="gradient" size="lg" asChild className="group rounded-full shadow-glow-violet">
            <a href="https://wa.me/34722669381?text=Acabo%20de%20contratar%20un%20servicio%20PACAME" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
              Escribenos por WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="lg" asChild className="group rounded-full border-white/[0.08] hover:border-white/20">
            <Link href="/">
              Volver al inicio
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-pacame-white/25 font-body mt-12">
          Si tienes alguna duda, escribe a{" "}
          <a href="mailto:hola@pacameagencia.com" className="text-electric-violet/60 hover:text-electric-violet">
            hola@pacameagencia.com
          </a>
        </p>
      </div>
    </div>
  );
}
