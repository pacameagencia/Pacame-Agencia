"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Send, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";
import Celebration from "@/components/effects/Celebration";

export default function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [state, setState] = useState<"form" | "sending" | "sent">("form");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) return;
    setState("sending");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          name: formData.get("name"),
          role: formData.get("role"),
          rating,
          text: formData.get("text"),
          service: formData.get("service"),
          city: formData.get("city"),
        }),
      });
      setState("sent");
    } catch {
      setState("sent"); // Show success anyway to not frustrate user
    }
  }

  return (
    <div className="bg-paper min-h-screen">
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-primary/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6">
          {state === "sent" ? (
            <div className="rounded-3xl glass p-10 text-center">
              <Celebration />
              <div className="w-16 h-16 rounded-full bg-mint/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-mint" />
              </div>
              <h1 className="font-heading font-bold text-2xl text-ink mb-3">
                Gracias por tu resena
              </h1>
              <p className="text-ink/60 font-body mb-6">
                Tu opinion nos ayuda a mejorar y a que mas negocios confien en PACAME.
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
              <ScrollReveal className="text-center mb-8">
                <p className="font-mono text-brand-primary text-sm mb-4 uppercase tracking-widest">
                  Tu opinion
                </p>
                <h1 className="font-heading font-bold text-[clamp(2rem,4vw,3rem)] text-ink leading-tight mb-4">
                  Cuentanos tu experiencia
                </h1>
                <p className="text-ink/60 font-body">
                  Tu resena ayuda a otros negocios a tomar la decision correcta.
                </p>
              </ScrollReveal>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Rating */}
                <div className="text-center">
                  <label className="block text-sm font-body text-ink/70 mb-3">
                    Valoracion *
                  </label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            n <= (hoverRating || rating)
                              ? "fill-accent-gold text-accent-gold"
                              : "text-ink/20"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-body text-ink/70 mb-2">Nombre *</label>
                    <input
                      name="name"
                      required
                      placeholder="Tu nombre"
                      className="w-full h-12 px-4 rounded-xl bg-paper-deep border border-ink/[0.08] text-ink font-body text-sm placeholder:text-ink/30 input-premium outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-body text-ink/70 mb-2">Rol / Empresa</label>
                    <input
                      name="role"
                      placeholder="CEO de MiEmpresa"
                      className="w-full h-12 px-4 rounded-xl bg-paper-deep border border-ink/[0.08] text-ink font-body text-sm placeholder:text-ink/30 input-premium outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-body text-ink/70 mb-2">Servicio contratado</label>
                    <select
                      name="service"
                      className="w-full h-12 px-4 rounded-xl bg-paper-deep border border-ink/[0.08] text-ink font-body text-sm input-premium outline-none transition-colors appearance-none"
                    >
                      <option value="">Selecciona</option>
                      <option value="Web Corporativa">Web Corporativa</option>
                      <option value="Landing Page">Landing Page</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="SEO">SEO</option>
                      <option value="Redes Sociales">Redes Sociales</option>
                      <option value="Meta Ads">Meta Ads</option>
                      <option value="Google Ads">Google Ads</option>
                      <option value="Branding">Branding</option>
                      <option value="Paquete Despega">Paquete Despega</option>
                      <option value="Paquete Crece">Paquete Crece</option>
                      <option value="Paquete Domina">Paquete Domina</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-body text-ink/70 mb-2">Ciudad</label>
                    <input
                      name="city"
                      placeholder="Madrid"
                      className="w-full h-12 px-4 rounded-xl bg-paper-deep border border-ink/[0.08] text-ink font-body text-sm placeholder:text-ink/30 input-premium outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-body text-ink/70 mb-2">Tu experiencia *</label>
                  <textarea
                    name="text"
                    required
                    rows={4}
                    placeholder="Cuentanos como fue trabajar con PACAME, que resultados obtuviste..."
                    className="w-full px-4 py-3 rounded-xl bg-paper-deep border border-ink/[0.08] text-ink font-body text-sm placeholder:text-ink/30 input-premium outline-none transition-colors resize-none"
                  />
                </div>

                {state === "sending" || rating === 0 ? (
                  <Button
                    type="submit"
                    variant="gradient"
                    size="xl"
                    className="w-full"
                    disabled={state === "sending" || rating === 0}
                  >
                    {state === "sending" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar resena
                      </>
                    )}
                  </Button>
                ) : (
                  <MagneticButton>
                    <ShinyButton
                      gradientFrom="#E8B730"
                      gradientTo="#B54E30"
                      gradientOpacity={0.8}
                      className="group w-full h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
                    >
                      <button type="submit" className="flex items-center gap-2 text-ink w-full justify-center">
                        <Send className="w-4 h-4" />
                        Enviar resena
                      </button>
                    </ShinyButton>
                  </MagneticButton>
                )}

                <p className="text-xs text-ink/30 font-body text-center">
                  Tu resena sera revisada antes de publicarse.{" "}
                  <Link href="/privacidad" className="text-brand-primary/60 hover:underline">
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
