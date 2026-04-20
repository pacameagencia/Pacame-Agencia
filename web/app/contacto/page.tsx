"use client";

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar, Mail, MapPin, Clock, ArrowRight,
  Send, CheckCircle2, Loader2, Gift, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";
import Celebration from "@/components/effects/Celebration";

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

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

function ContactoForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const serviceParam = searchParams.get("service") || "";
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const errorRef = useRef<HTMLDivElement>(null);

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

  function validateField(field: string, value: string): string | undefined {
    if (field === "name" && value.trim().length < 2) return "El nombre debe tener al menos 2 caracteres";
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Introduce un email valido";
    if (field === "message" && value.trim().length < 10) return "Describe tu proyecto con al menos 10 caracteres";
    return undefined;
  }

  function handleBlur(field: keyof FieldErrors, value: string) {
    if (!value) return;
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    const newErrors: FieldErrors = {
      name: validateField("name", name),
      email: validateField("email", email),
      message: validateField("message", message),
    };

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setFormState("sending");
    setErrors({});

    const payload = {
      name,
      email,
      phone: formData.get("phone") || undefined,
      company: formData.get("company"),
      services: selectedServices,
      budget: formData.get("budget"),
      message,
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
      setFormState("error");
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-olympus-radial pointer-events-none" />

        <ScrollReveal className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-accent-gold/70 mb-5 uppercase tracking-[0.2em]">
            Contacto
          </p>
          <h1 className="font-accent font-bold text-display text-ink mb-6 text-balance">
            Cuentanos tu problema.{" "}
            <span className="gradient-text-aurora">Nosotros lo resolvemos.</span>
          </h1>
          <p className="text-xl text-ink/60 font-body max-w-2xl mx-auto font-light">
            30 minutos. Sin compromiso. Sin presupuestos ciegos.
          </p>
        </ScrollReveal>
      </section>

      {/* Form + info */}
      <section className="section-padding relative">
        <div className="px-6"><GoldenDivider variant="line" /></div>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              {refCode && (
                <div className="rounded-2xl bg-mint/10 border border-mint/20 p-4 mb-6 flex items-center gap-3">
                  <Gift className="w-5 h-5 text-mint flex-shrink-0" />
                  <div>
                    <p className="text-sm font-heading font-semibold text-mint">Vienes recomendado — 10% de descuento aplicado</p>
                    <p className="text-xs text-ink/60 font-body">Codigo: {refCode}</p>
                  </div>
                </div>
              )}
              {formState === "sent" ? (
                <div className="rounded-3xl glass p-10 sm:p-14 text-center">
                  <Celebration />
                  <div className="w-16 h-16 rounded-full bg-mint/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-mint" />
                  </div>
                  <h2 className="font-heading font-bold text-2xl text-ink mb-3">
                    Mensaje recibido
                  </h2>
                  <p className="text-ink/60 font-body mb-8">
                    Pablo te responderá en menos de 2 horas. Si es urgente,
                    escríbenos a{" "}
                    <a href="mailto:hola@pacameagencia.com" className="text-brand-primary hover:underline">
                      hola@pacameagencia.com
                    </a>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" asChild className="rounded-full">
                      <Link href="/blog">Leer el blog mientras esperas</Link>
                    </Button>
                    <Button variant="outline" asChild className="rounded-full border-ink/[0.06]">
                      <Link href="/portfolio">Ver nuestro portfolio</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {formState === "error" && (
                    <div ref={errorRef} className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-heading font-semibold text-red-400">Error al enviar</p>
                        <p className="text-xs text-ink/60 font-body">Intentalo de nuevo o escribenos a hola@pacameagencia.com</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-body text-ink/70 mb-2">
                        Nombre *
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        placeholder="Tu nombre"
                        onBlur={(e) => handleBlur("name", e.target.value)}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "error-name" : undefined}
                        className={`w-full h-12 px-4 rounded-xl bg-paper-deep border text-ink font-body text-sm placeholder:text-ink/50 input-premium outline-none transition-colors ${errors.name ? "border-red-500/50" : "border-ink/[0.08]"}`}
                      />
                      {errors.name && <p id="error-name" className="text-xs text-red-400 font-body mt-1.5">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-body text-ink/70 mb-2">
                        Email *
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        placeholder="tu@empresa.com"
                        onBlur={(e) => handleBlur("email", e.target.value)}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "error-email" : undefined}
                        className={`w-full h-12 px-4 rounded-xl bg-paper-deep border text-ink font-body text-sm placeholder:text-ink/50 input-premium outline-none transition-colors ${errors.email ? "border-red-500/50" : "border-ink/[0.08]"}`}
                      />
                      {errors.email && <p id="error-email" className="text-xs text-red-400 font-body mt-1.5">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-company" className="block text-sm font-body text-ink/70 mb-2">
                        Empresa
                      </label>
                      <input
                        id="contact-company"
                        name="company"
                        type="text"
                        placeholder="Nombre de tu empresa (opcional)"
                        className="w-full h-12 px-4 rounded-xl bg-paper-deep border border-ink/[0.08] text-ink font-body text-sm placeholder:text-ink/50 input-premium outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-phone" className="block text-sm font-body text-ink/70 mb-2">
                        Teléfono
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        placeholder="+34 600 000 000 (opcional)"
                        className="w-full h-12 px-4 rounded-xl bg-paper-deep border border-ink/[0.08] text-ink font-body text-sm placeholder:text-ink/50 input-premium outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Service selector */}
                  <fieldset>
                    <legend className="block text-sm font-body text-ink/70 mb-3">
                      ¿Qué necesitas? (selecciona uno o varios)
                    </legend>
                    <div className="flex flex-wrap gap-2" role="group">
                      {services.map((service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => toggleService(service)}
                          aria-pressed={selectedServices.includes(service)}
                          className={`px-4 py-2 rounded-full text-sm font-body border transition-all duration-200 ${
                            selectedServices.includes(service)
                              ? "bg-accent-gold/15 border-accent-gold text-accent-gold"
                              : "bg-transparent border-white/10 text-ink/60 hover:border-accent-gold/30 hover:text-ink/70"
                          }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Budget */}
                  <div>
                    <label htmlFor="contact-budget" className="block text-sm font-body text-ink/70 mb-2">
                      Presupuesto orientativo
                    </label>
                    <select id="contact-budget" name="budget" className="w-full h-12 px-4 rounded-xl bg-paper-deep border border-ink/[0.08] text-ink font-body text-sm input-premium outline-none transition-colors appearance-none">
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
                    <label htmlFor="contact-message" className="block text-sm font-body text-ink/70 mb-2">
                      Cuéntanos tu proyecto *
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={5}
                      placeholder="Describe brevemente qué necesitas, para cuándo y cualquier detalle que nos ayude a entenderte mejor..."
                      onBlur={(e) => handleBlur("message", e.target.value)}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "error-message" : undefined}
                      className={`w-full px-4 py-3 rounded-xl bg-paper-deep border text-ink font-body text-sm placeholder:text-ink/50 input-premium outline-none transition-colors resize-none ${errors.message ? "border-red-500/50" : "border-ink/[0.08]"}`}
                    />
                    {errors.message && <p id="error-message" className="text-xs text-red-400 font-body mt-1.5">{errors.message}</p>}
                  </div>

                  {formState === "sending" ? (
                    <Button
                      type="submit"
                      variant="gradient"
                      size="xl"
                      className="w-full sm:w-auto"
                      disabled
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </Button>
                  ) : (
                    <MagneticButton>
                      <ShinyButton
                        gradientFrom="#D4A853"
                        gradientTo="#7C3AED"
                        gradientOpacity={0.8}
                        className="group min-w-[220px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
                      >
                        <button type="submit" className="flex items-center gap-2 text-ink w-full h-full justify-center">
                          <Send className="w-4 h-4" />
                          Enviar mensaje
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </ShinyButton>
                    </MagneticButton>
                  )}

                  <p className="text-xs text-ink/60 font-body">
                    Al enviar este formulario aceptas nuestra{" "}
                    <Link href="/privacidad" className="text-accent-gold/70 hover:underline">
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
              <ScrollReveal delay={0.1}>
              <CardTilt tiltMaxAngle={6} scale={1.02}>
              <CardTiltContent>
              <div className="glass rounded-2xl p-6 border border-accent-gold/10">
                <h3 className="font-heading font-bold text-lg text-ink mb-5">
                  Contacto directo
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-gold/15 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-accent-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-ink/60 font-body">Email</p>
                      <a href="mailto:hola@pacameagencia.com" className="text-sm text-ink font-body hover:text-accent-gold transition-colors">
                        hola@pacameagencia.com
                      </a>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-mint/15 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-mint" />
                    </div>
                    <div>
                      <p className="text-xs text-ink/60 font-body">Ubicación</p>
                      <p className="text-sm text-ink font-body">Madrid, España (remoto)</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-mint/15 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-mint" />
                    </div>
                    <div>
                      <p className="text-xs text-ink/60 font-body">Tiempo de respuesta</p>
                      <p className="text-sm text-ink font-body">Menos de 2 horas</p>
                    </div>
                  </li>
                </ul>
              </div>
              </CardTiltContent>
              </CardTilt>
              </ScrollReveal>

              {/* FAQ mini */}
              <ScrollReveal delay={0.2}>
              <CardTilt tiltMaxAngle={6} scale={1.02}>
              <CardTiltContent>
              <div className="glass rounded-2xl p-6">
                <h3 className="font-heading font-bold text-lg text-ink mb-5">
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
                      <p className="text-sm font-heading font-semibold text-ink mb-1">
                        {faq.q}
                      </p>
                      <p className="text-xs text-ink/60 font-body leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              </CardTiltContent>
              </CardTilt>
              </ScrollReveal>

              {/* Trust */}
              <ScrollReveal delay={0.3}>
              <CardTilt tiltMaxAngle={6} scale={1.02}>
              <CardTiltContent>
              <div className="rounded-2xl p-6 relative overflow-hidden border border-accent-gold/20" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #D4A853 50%, #06B6D4 100%)" }}>
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
              </CardTiltContent>
              </CardTilt>
              </ScrollReveal>
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
