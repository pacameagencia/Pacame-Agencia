import type { Metadata } from "next";
import dynamic from "next/dynamic";
import KineticHeading from "@/components/cinematic/KineticHeading";
import ThemeBodyClass from "@/components/theme/ThemeBodyClass";
import { Mail, MessageCircle, Linkedin, MapPin, Clock } from "lucide-react";

const ContactCTA = dynamic(() => import("@/components/cinematic/ContactCTA"));

export const metadata: Metadata = {
  title: "Contacto — Hablar con PACAME · Respuesta en menos de 2 h",
  description:
    "Treinta minutos de llamada gratis. Sin compromiso. Te decimos exactamente qué necesitas y cuánto cuesta. Email, WhatsApp o LinkedIn.",
  alternates: { canonical: "https://pacameagencia.com/contacto" },
  openGraph: {
    title: "Contacto PACAME — Resolvemos tu problema digital",
    description: "Llamada gratis 30 min · Sin compromiso · Presupuesto en 24 h",
    url: "https://pacameagencia.com/contacto",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
    images: ["/generated/optimized/og/contacto.webp"],
  },
};

const CONTACT_METHODS = [
  {
    Icon: Mail,
    label: "Email",
    value: "hola@pacameagencia.com",
    href: "mailto:hola@pacameagencia.com",
    sub: "Respuesta en < 2 h en horario laboral",
  },
  {
    Icon: MessageCircle,
    label: "WhatsApp",
    value: "+34 722 669 381",
    href: "https://wa.me/34722669381",
    sub: "Lunes a viernes 9:00 – 19:00",
  },
  {
    Icon: Linkedin,
    label: "LinkedIn",
    value: "@pacameagencia",
    href: "https://www.linkedin.com/company/pacameagencia",
    sub: "Network · cases · contenido editorial",
  },
];

export default function ContactoPage() {
  return (
    <>
      <ThemeBodyClass className="theme-tech" />

      {/* Hero contacto split */}
      <section className="relative isolate overflow-hidden bg-tech-bg pb-24 pt-32 text-tech-text md:pt-44">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-tech-mesh opacity-60" />
          <div className="absolute inset-0 bg-tech-grid opacity-[0.04]" style={{ backgroundSize: "48px 48px" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-tech-bg/0 via-tech-bg/0 to-tech-bg" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-12 md:gap-12">
            {/* Left: copy */}
            <div className="md:col-span-7">
              <span className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tech-accent opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-tech-accent" />
                </span>
                En directo · Madrid
              </span>

              <KineticHeading
                as="h1"
                className="font-sans font-semibold tracking-tight text-tech-text"
                style={{
                  fontSize: "clamp(2.75rem, 7vw, 5.5rem)",
                  lineHeight: "0.98",
                  letterSpacing: "-0.04em",
                }}
              >
                <span className="block">Hablemos.</span>
              </KineticHeading>

              <KineticHeading
                as="div"
                delay={300}
                className="mt-1 font-sans font-light tracking-tight"
                style={{
                  fontSize: "clamp(2.75rem, 7vw, 5.5rem)",
                  lineHeight: "0.98",
                  letterSpacing: "-0.04em",
                  background:
                    "linear-gradient(120deg, var(--tech-accent) 0%, var(--tech-accent-2) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                <span className="block">Sin humo.</span>
              </KineticHeading>

              <p className="mt-10 max-w-xl text-[16px] leading-relaxed text-tech-text-soft md:text-[18px]">
                Treinta minutos de llamada. Sin compromiso. Te decimos
                exactamente qué necesitas, cuánto cuesta y cuándo lo tendrás.
                Si encajamos, encajamos. Si no, te referimos a alguien mejor.
              </p>

              {/* Trust line */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-tech-border-soft pt-6">
                {["Respuesta < 2h", "Sin compromiso", "Presupuesto 24h"].map(
                  (s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      {i > 0 && (
                        <span className="h-1 w-1 rounded-full bg-tech-accent" />
                      )}
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
                        {s}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Right: contact methods */}
            <div className="md:col-span-5">
              <div className="rounded-2xl border border-tech-border bg-tech-surface/60 p-7 backdrop-blur-md md:p-8">
                <div className="mb-6 flex items-center gap-2">
                  <span className="h-px w-6 bg-tech-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
                    Canales · Elige el tuyo
                  </span>
                </div>

                <ul className="space-y-1">
                  {CONTACT_METHODS.map(({ Icon, label, value, href, sub }) => (
                    <li key={label}>
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                        data-cursor="hover"
                        className="group flex items-start gap-4 rounded-xl px-3 py-4 transition-colors hover:bg-tech-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-accent/40"
                      >
                        <div className="mt-0.5 rounded-full border border-tech-border bg-tech-bg p-2.5 text-tech-text-soft transition-all duration-300 group-hover:border-tech-accent group-hover:text-tech-accent">
                          <Icon className="h-4 w-4" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
                            {label}
                          </div>
                          <div className="mt-0.5 truncate text-[15px] font-medium text-tech-text transition-colors group-hover:text-tech-accent">
                            {value}
                          </div>
                          <div className="mt-1 text-[12px] text-tech-text-soft">
                            {sub}
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-tech-border-soft pt-6">
                  <div className="flex items-center gap-2 text-tech-text-soft">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
                    <span className="text-[12px]">Madrid · ES</span>
                  </div>
                  <div className="flex items-center gap-2 text-tech-text-soft">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.8} />
                    <span className="text-[12px]">Lun–Vie 9–19h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContactCTA />
    </>
  );
}
