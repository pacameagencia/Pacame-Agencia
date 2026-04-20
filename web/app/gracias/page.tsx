import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, ArrowRight, MessageCircle, UserCheck, Mail as MailIcon, ExternalLink } from "lucide-react";

// ISR: thank-you page — 1h cache
export const revalidate = 3600;
import { Button } from "@/components/ui/button";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";
import Celebration from "@/components/effects/Celebration";

export const metadata: Metadata = {
  title: "Pago confirmado — PACAME",
  description: "Tu pago ha sido procesado correctamente. El equipo PACAME se pone en marcha.",
  robots: { index: false, follow: false },
};

export default function GraciasPage() {
  return (
    <div className="bg-paper min-h-screen flex items-center justify-center px-6">
      <Celebration />
      <ScrollReveal className="max-w-lg text-center">
        {/* Success icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-mint/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-mint" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-ink mb-4">
          Pago confirmado
        </h1>
        <p className="text-lg text-ink/60 font-body mb-4 leading-relaxed">
          Tu equipo PACAME ya esta en marcha. Recibiras un email con los proximos pasos
          en menos de 2 horas.
        </p>

        <div className="mb-10"><GoldenDivider variant="star" /></div>

        {/* Next steps */}
        <CardTilt tiltMaxAngle={4} scale={1.01}>
        <CardTiltContent>
        <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-7 mb-10 text-left card-golden-shine">
          <h2 className="font-heading font-semibold text-lg text-ink mb-5">
            Que pasa ahora
          </h2>
          <StaggerContainer className="space-y-4" staggerDelay={0.15}>
            {[
              { step: "1", text: "Pablo revisa tu pedido y asigna los agentes adecuados" },
              { step: "2", text: "Te contactamos por email o WhatsApp para alinear detalles" },
              { step: "3", text: "Empezamos a trabajar. Entrega en el plazo acordado" },
            ].map((item) => (
              <StaggerItem key={item.step}>
              <li className="flex gap-4 list-none">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary font-heading font-bold text-sm flex items-center justify-center">
                  {item.step}
                </span>
                <span className="text-sm text-ink/60 font-body pt-0.5">
                  {item.text}
                </span>
              </li>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
        </CardTiltContent>
        </CardTilt>

        {/* Portal account card */}
        <CardTilt tiltMaxAngle={4} scale={1.01}>
        <CardTiltContent>
        <div className="bg-paper-deep border border-mint/10 rounded-2xl p-7 mb-10 text-left">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-mint" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-semibold text-lg text-ink mb-2">
                Tu cuenta ha sido creada
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <MailIcon className="w-4 h-4 text-ink/40 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-ink/60 font-body">
                    Revisa tu email — te hemos enviado tus credenciales de acceso
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <ExternalLink className="w-4 h-4 text-ink/40 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-ink/60 font-body">
                    Accede a tu portal para personalizar tu experiencia
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <Button variant="gradient" size="lg" asChild className="gap-2">
                  <Link href="/portal">
                    Ir a mi portal
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        </CardTiltContent>
        </CardTilt>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <MagneticButton>
            <ShinyButton
              gradientFrom="#D4A853"
              gradientTo="#7C3AED"
              gradientOpacity={0.8}
              className="group min-w-[260px] h-12 px-6 text-sm font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
            >
              <a href="https://wa.me/34722669381?text=Acabo%20de%20contratar%20un%20servicio%20PACAME" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ink">
                <MessageCircle className="w-4 h-4" />
                Escribenos por WhatsApp
              </a>
            </ShinyButton>
          </MagneticButton>
          <Button variant="outline" size="lg" asChild className="group rounded-full border-ink/[0.08] hover:border-white/20">
            <Link href="/">
              Volver al inicio
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-ink/25 font-body mt-12">
          Si tienes alguna duda, escribe a{" "}
          <a href="mailto:hola@pacameagencia.com" className="text-brand-primary/60 hover:text-brand-primary">
            hola@pacameagencia.com
          </a>
        </p>
      </ScrollReveal>
    </div>
  );
}
