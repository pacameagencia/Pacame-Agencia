/**
 * AuthoritySection — activación sesgo de Autoridad.
 *
 * Founder + certificaciones + press mentions + numeros reales.
 * Refactor Sprint 22:
 *  - Clases inexistentes corregidas: text-accent-gold→text-mustard-500,
 *    bg-paper-soft→bg-sand-50, text-mint→text-olive-500, etc.
 *  - Avatar SVG genérico → foto editorial de Pablo Calleja
 *    (placeholder hasta que Pablo suba foto real a /public/generated/pablo-calleja.jpg).
 *  - Bloque "Próximas asociaciones" con VerificationBadges.
 *
 * Server component, estatico, editorial.
 */

import Image from "next/image";
import Link from "next/link";
import { Award, CheckCircle, Shield, Sparkles, TrendingUp, Users } from "lucide-react";
import VerificationBadges, {
  PACAME_ASSOCIATIONS,
} from "@/components/cro/VerificationBadges";

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
          <span className="text-mustard-600">§ 007 · AUTORIDAD</span>
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
              <div className="flex-shrink-0 relative w-24 h-32 md:w-28 md:h-36 overflow-hidden border border-mustard-500/30 bg-sand-50 rounded-sm">
                <Image
                  src="/generated/pablo-calleja.jpg"
                  alt="Pablo Calleja, CEO y fundador de PACAME"
                  fill
                  sizes="(max-width: 768px) 96px, 112px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 pt-1">
                <div className="font-display italic text-[28px] md:text-[34px] text-ink leading-tight mb-1" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}>
                  Pablo Calleja
                </div>
                <div className="text-[13px] text-ink/55 font-mono uppercase tracking-wider mb-3">
                  CEO · Director editorial
                </div>
                <p className="text-[15px] text-ink/70 font-sans leading-relaxed max-w-[48ch]">
                  15 años creando producto digital para PYMEs, grandes marcas y
                  mis propios proyectos. PACAME es lo que{" "}
                  <span className="text-ink font-medium">habría querido tener yo</span>{" "}
                  cuando empecé — agencia con precio claro, entrega rápida, cero humo.
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
                    className="flex items-center gap-2.5 text-[13px] text-ink/70 font-sans"
                  >
                    {c.status === "active" ? (
                      <CheckCircle className="w-4 h-4 text-olive-500 flex-shrink-0" />
                    ) : (
                      <Shield className="w-4 h-4 text-ink/30 flex-shrink-0" />
                    )}
                    <span>{c.label}</span>
                    {c.status === "pending" && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-mustard-600">
                        en trámite
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {/* Press */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/40 mb-3">
                  Próximamente mencionados en
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESS.map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1.5 rounded-sm text-[11px] font-mono uppercase tracking-wider text-ink/50 border border-ink/10 bg-sand-50/50"
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
                  className="p-5 rounded-sm bg-sand-50 border border-ink/10"
                >
                  <m.Icon className="w-4 h-4 text-mustard-600 mb-3" />
                  <div className="font-display font-bold text-[32px] text-ink leading-none tabular-nums mb-1">
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
              className="group block p-5 rounded-sm border border-mustard-500/30 bg-mustard-500/5 hover:bg-mustard-500/10 transition"
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-mustard-600 mb-2">
                Ver casos completos
              </div>
              <div className="font-display font-semibold text-[15px] text-ink">
                Métricas antes/después de clientes reales →
              </div>
            </Link>
          </aside>
        </div>

        {/* ── Próximas asociaciones (verificaciones en proceso) ── */}
        <div className="mt-20 pt-12 border-t border-ink/10">
          <VerificationBadges
            items={PACAME_ASSOCIATIONS}
            title="008 · Próximas asociaciones"
            subtitle="Verificaciones nacionales en curso"
            layout="row"
          />
        </div>
      </div>
    </section>
  );
}
