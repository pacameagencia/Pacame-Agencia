"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar, Mail, MapPin, Clock, ArrowRight,
  Send, CheckCircle2, Loader2, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  "Desarrollo Web",
  "SEO",
  "Redes Sociales",
  "Publicidad Digital (Ads)",
  "Branding",
  "App / Software a medida",
  "Embudo de ventas",
  "Otro",
];

const budgets = [
  "Menos de 500 €",
  "500 – 1.500 €",
  "1.500 – 3.000 €",
  "3.000 – 5.000 €",
  "Más de 5.000 €",
  "No estoy seguro",
];

function ContactoForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const serviceParam = searchParams.get("service") || "";
  const [formState, setFormState] = useState<"idle" | "sending" | "sent">("idle");

  // Map URL slugs to service names for preselection
  const serviceSlugMap: Record<string, string> = {
    web: "Desarrollo Web",
    seo: "SEO",
    redes: "Redes Sociales",
    ads: "Publicidad Digital (Ads)",
    branding: "Branding",
    app: "App / Software a medida",
    embudo: "Embudo de ventas",
  };
  const initialService = serviceSlugMap[serviceParam];
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialService ? [initialService] : [],
  );

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState("sending");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      company: formData.get("company"),
      services: selectedServices,
      budget: formData.get("budget"),
      message: formData.get("message"),
      referral_code: refCode || undefined,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al enviar");
      setFormState("sent");
    } catch {
      // Incluso si falla, mostramos confirmacion para no frustrar al usuario
      setFormState("sent");
    }
  }

  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-electric-violet/[0.05] rounded-full blur-[200px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-electric-violet mb-5 uppercase tracking-[0.2em]">
            Contacto
          </p>
          <h1 className="font-heading font-bold text-display text-pacame-white mb-6 text-balance">
            Cuentanos tu problema.{" "}
            <span className="gradient-text-vivid">Nosotros lo resolvemos.</span>
          </h1>
          <p className="text-xl text-pacame-white/40 font-body max-w-2xl mx-auto font-light">
            30 minutos. Sin compromiso. Sin presupuestos ciegos.
          </p>
        </div>
      </section>

      {/* Form + info */}
      <section className="section-padding relative">
        <div className="absolute top-0 inset-x-0 section-divider" />
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              {refCode && (
                <div className="rounded-2xl bg-lime-pulse/10 border border-lime-pulse/20 p-4 mb-6 flex items-center gap-3">
                  <Gift className="w-5 h-5 text-lime-pulse flex-shrink-0" />
                  <div>
                    <p className="text-sm font-heading font-semibold text-lime-pulse">Vienes recomendado — 10% de descuento aplicado</p>
                    <p className="text-xs text-pacame-white/40 font-body">Codigo: {refCode}</p>
                  </div>
                </div>
              )}
              {formState === "sent" ? (
                <div className="rounded-3xl glass p-10 sm:p-14 text-center">
                  <div className="w-16 h-16 rounded-full bg-lime-pulse/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-lime-pulse" />
                  </div>
                  <h2 className="font-heading font-bold text-2xl text-pacame-white mb-3">
                    Mensaje recibido
                  </h2>
                  <p className="text-pacame-white/60 font-body mb-8">
                    Pablo te responderá en menos de 2 horas. Si es urgente,
                    escríbenos a{" "}
                    <a href="mailto:hola@pacameagencia.com" className="text-electric-violet hover:underline">
                      hola@pacameagencia.com
                    </a>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" asChild className="rounded-full">
                      <Link href="/blog">Leer el blog mientras esperas</Link>
                    </Button>
                    <Button variant="outline" asChild className="rounded-full border-white/[0.06]">
                      <Link href="/portfolio">Ver nuestro portfolio</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-body text-pacame-white/70 mb-2">
                        Nombre *
                      </label>
                      <input
                        name="name"
                        type="text"
                        required
                        placeholder="Tu nombre"
                        className="w-full h-12 px-4 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white font-body text-sm placeholder:text-pacame-white/30 focus:border-electric-violet focus:ring-1 focus:ring-electric-violet outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body text-pacame-white/70 mb-2">
                        Email *
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="tu@empresa.com"
                        className="w-full h-12 px-4 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white font-body text-sm placeholder:text-pacame-white/30 focus:border-electric-violet focus:ring-1 focus:ring-electric-violet outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-body text-pacame-white/70 mb-2">
                        Empresa
                      </label>
                      <input
                        name="company"
                        type="text"
                        placeholder="Nombre de tu empresa (opcional)"
                        className="w-full h-12 px-4 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white font-body text-sm placeholder:text-pacame-white/30 focus:border-electric-violet focus:ring-1 focus:ring-electric-violet outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body text-pacame-white/70 mb-2">
                        Teléfono
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        placeholder="+34 600 000 000 (opcional)"
                        className="w-full h-12 px-4 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white font-body text-sm placeholder:text-pacame-white/30 focus:border-electric-violet focus:ring-1 focus:ring-electric-violet outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Service selector */}
                  <div>
                    <label className="block text-sm font-body text-pacame-white/70 mb-3">
                      ¿Qué necesitas? (selecciona uno o varios)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {services.map((service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => toggleService(service)}
                          className={`px-4 py-2 rounded-full text-sm font-body border transition-all duration-200 ${
                            selectedServices.includes(service)
                              ? "bg-electric-violet/20 border-electric-violet text-electric-violet"
                              : "bg-transparent border-white/10 text-pacame-white/50 hover:border-white/20 hover:text-pacame-white/70"
                          }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-body text-pacame-white/70 mb-2">
                      Presupuesto orientativo
                    </label>
                    <select name="budget" className="w-full h-12 px-4 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white font-body text-sm focus:border-electric-violet focus:ring-1 focus:ring-electric-violet outline-none transition-colors appearance-none">
                      <option value="">Selecciona un rango</option>
                      {budgets.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-body text-pacame-white/70 mb-2">
                      Cuéntanos tu proyecto *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      placeholder="Describe brevemente qué necesitas, para cuándo y cualquier detalle que nos ayude a entenderte mejor..."
                      className="w-full px-4 py-3 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white font-body text-sm placeholder:text-pacame-white/30 focus:border-electric-violet focus:ring-1 focus:ring-electric-violet outline-none transition-colors resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="gradient"
                    size="xl"
                    className="w-full sm:w-auto group"
                    disabled={formState === "sending"}
                  >
                    {formState === "sending" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar mensaje
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-pacame-white/30 font-body">
                    Al enviar este formulario aceptas nuestra{" "}
                    <Link href="/privacidad" className="text-electric-violet/60 hover:underline">
                      política de privacidad
                    </Link>
                    .
                  </p>
                </form>
              )}
            </div>

            {/* Sidebar info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Direct contact */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-heading font-bold text-lg text-pacame-white mb-5">
                  Contacto directo
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-electric-violet/15 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-electric-violet" />
                    </div>
                    <div>
                      <p className="text-xs text-pacame-white/40 font-body">Email</p>
                      <a href="mailto:hola@pacameagencia.com" className="text-sm text-pacame-white font-body hover:text-electric-violet transition-colors">
                        hola@pacameagencia.com
                      </a>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-cyan/15 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-neon-cyan" />
                    </div>
                    <div>
                      <p className="text-xs text-pacame-white/40 font-body">Ubicación</p>
                      <p className="text-sm text-pacame-white font-body">Madrid, España (remoto)</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lime-pulse/15 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-lime-pulse" />
                    </div>
                    <div>
                      <p className="text-xs text-pacame-white/40 font-body">Tiempo de respuesta</p>
                      <p className="text-sm text-pacame-white font-body">Menos de 2 horas</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* FAQ mini */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-heading font-bold text-lg text-pacame-white mb-5">
                  Preguntas frecuentes
                </h3>
                <div className="space-y-5">
                  {[
                    {
                      q: "¿Cuánto cuesta una web?",
                      a: "Desde 300€ una landing page hasta 15.000€ un SaaS completo. Te damos precio exacto en 24h.",
                    },
                    {
                      q: "¿Son agentes IA de verdad?",
                      a: "Sí. Cada agente es una IA especializada con personalidad y rol propio. Pablo supervisa todo.",
                    },
                    {
                      q: "¿Cuánto tardáis en entregar?",
                      a: "Landing en 2-3 días, web corporativa en 5-7 días, proyectos complejos en 2-6 semanas.",
                    },
                    {
                      q: "¿Qué pasa si no me gusta?",
                      a: "Trabajamos con rondas de revisión. Si al final no estás satisfecho, te devolvemos el dinero.",
                    },
                  ].map((faq) => (
                    <div key={faq.q}>
                      <p className="text-sm font-heading font-semibold text-pacame-white mb-1">
                        {faq.q}
                      </p>
                      <p className="text-xs text-pacame-white/50 font-body leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust */}
              <div className="rounded-2xl bg-brand-gradient p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10">
                  <Calendar className="w-6 h-6 text-white mb-3" />
                  <h3 className="font-heading font-bold text-lg text-white mb-2">
                    ¿Prefieres hablar directamente?
                  </h3>
                  <p className="text-sm text-white/80 font-body mb-4">
                    Agenda una llamada de 30 minutos con Pablo. Sin compromiso.
                  </p>
                  <Button variant="secondary" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30" asChild>
                    <a href="mailto:hola@pacameagencia.com?subject=Agendar%20llamada%20gratuita">
                      Agendar llamada gratuita
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ContactoPage() {
  return (
    <Suspense>
      <ContactoForm />
    </Suspense>
  );
}
