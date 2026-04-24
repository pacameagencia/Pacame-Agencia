/**
 * AuthoritySection — activación sesgo de Autoridad.
 *
 * Founder + certificaciones + press mentions + numeros reales.
 * Server component, estatico, editorial.
 */

import Image from "next/image";
import Link from "next/link";
import { Award, CheckCircle, Shield, Sparkles, TrendingUp, Users } from "lucide-react";

const TRUST_METRICS = [
  { n: "47+", label: "PYMEs activas", Icon: Users },
  { n: "4.9/5", label: "Rating verificado", Icon: Award },
  { n: "0%", label: "Churn 2025", Icon: TrendingUp },
  { n: "< 2h", label: "Tiempo respuesta", Icon: Sparkles },
];

const CERTIFICATIONS = [
  { label: "Stripe Verified Partner", status: "active" },
  { label: "Google Partner", status: "pending" },
  { label: "Meta Business Partner", status: "pending" },
  { label: "GDPR + LOPDGDD Compliant", status: "active" },
];

const PRESS = [
  "Startup Pulse",
  "Genbeta",
  "Marketing4Ecommerce",
  "El Referente",
];

export default function AuthoritySection() {
  return (
    <section className="relative bg-paper py-24 md:py-32 border-y border-ink/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14">
        <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45 mb-12 pb-3 border-b border-ink/10">
          <span className="text-accent-gold">§ 007 · AUTORIDAD</span>
          <span className="h-px w-8 bg-ink/20" />
          <span>Confianza real · Numeros comprobables</span>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 md:gap-20 items-start">
          {/* Founder card editorial */}
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/40">
                Firma editorial · Fundador
              </span>
              <span className="h-px flex-1 bg-ink/10" />
            </div>

            <div className="flex items-start gap-5 md:gap-7 mb-8">
              <div className="flex-shrink-0 relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-accent-gold/30 bg-paper-soft">
                <Image
                  src="/founder-avatar.svg"
                  alt="Pablo Calleja"
                  width={96}
                  height={96}
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 pt-1">
                <div className="font-accent italic text-[28px] md:text-[34px] text-ink leading-tight mb-1">
                  Pablo Calleja
                </div>
                <div className="text-[13px] text-ink/55 font-mono uppercase tracking-wider mb-3">
                  CEO · Director editorial
                </div>
                <p className="text-[15px] text-ink/70 font-body leading-relaxed max-w-[48ch]">
                  15 años creando producto digital para PYMEs, grandes marcas y
                  mis propios proyectos. PACAME es lo que{" "}
                  <span className="text-ink font-medium">habria querido tener yo</span>{" "}
                  cuando empece — agencia con precio claro, entrega rapida, cero humo.
                </p>
              </div>
            </div>

            {/* Certifications */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/40 mb-3">
                Certificaciones + compliance
              </div>
              <ul className="space-y-2 mb-8">
                {CERTIFICATIONS.map((c) => (
                  <li
                    key={c.label}
                    className="flex items-center gap-2.5 text-[13px] text-ink/70 font-body"
                  >
                    {c.status === "active" ? (
                      <CheckCircle className="w-4 h-4 text-mint flex-shrink-0" />
                    ) : (
                      <Shield className="w-4 h-4 text-ink/30 flex-shrink-0" />
                    )}
                    <span>{c.label}</span>
                    {c.status === "pending" && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink/35">
                        en tramite
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {/* Press */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/40 mb-3">
                  Proximamente mencionados en
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESS.map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider text-ink/50 border border-ink/10"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics side */}
          <aside className="lg:sticky lg:top-24">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/40 mb-5">
              Numeros reales · Actualizados mensual
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {TRUST_METRICS.map((m) => (
                <div
                  key={m.label}
                  className="p-5 rounded-2xl bg-paper-soft/30 border border-ink/10"
                >
                  <m.Icon className="w-4 h-4 text-accent-gold mb-3" />
                  <div className="font-heading font-bold text-[32px] text-ink leading-none tabular-nums mb-1">
                    {m.n}
                  </div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-ink/50">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/casos"
              className="group block p-5 rounded-2xl border border-accent-gold/25 bg-accent-gold/[0.05] hover:bg-accent-gold/[0.08] transition"
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent-gold mb-2">
                Ver casos completos
              </div>
              <div className="font-heading font-semibold text-[15px] text-ink">
                Metricas antes/despues de clientes reales →
              </div>
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
