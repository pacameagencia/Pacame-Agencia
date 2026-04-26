"use client";

/**
 * PACAME AssociationsBar (refactor de TrustLogos · Sprint 22)
 *
 * Sustituye los SVGs hand-drawn de tech stack por una franja de
 * asociaciones, certificaciones tech y prensa con badges de estado.
 *
 * Tres bloques:
 *  1. Asociaciones (Sequra, ICEX, Cámara Madrid, Confebask, ENAC)
 *  2. Tech partners (Stripe Verified, Google Partner, Meta Business, Vercel, Supabase, GDPR)
 *  3. Prensa (Forbes, El País, Genbeta, Marketing4Ecommerce, Startup Pulse)
 *
 * Cada badge muestra estado real: verificado / en revisión / en proceso.
 *
 * Color contrast fix: clases `text-pacame-white/25` que tras el remap
 * quedaban invisibles (ink/25 sobre paper) → `text-ink/45`.
 */

import { motion, useReducedMotion } from "framer-motion";
import VerificationBadges, {
  PACAME_ASSOCIATIONS,
  PACAME_PARTNERS,
  PACAME_PRESS,
} from "@/components/cro/VerificationBadges";

export default function TrustLogos() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative py-20 sm:py-24 bg-sand-50 border-y border-ink/10">
      <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14">
        <motion.div
          className="mb-12 text-center"
          initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-[10px] md:text-[11px] font-mono uppercase tracking-[0.28em] text-mustard-600 mb-3">
            § Confianza · Verificable
          </span>
          <h2
            className="font-display text-ink text-balance"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
              lineHeight: "1.1",
              letterSpacing: "-0.02em",
              fontWeight: 500,
            }}
          >
            Asociaciones, partners y prensa.
            <span
              className="block italic font-light"
              style={{
                color: "#B54E30",
                fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
              }}
            >
              Cada estado es real.
            </span>
          </h2>
          <p className="mt-4 text-[14px] md:text-[15px] text-ink/60 font-sans max-w-2xl mx-auto">
            No mostramos logos decorativos. Cada credencial aparece con su
            estado actual: verificado, en revisión o en proceso.
          </p>
        </motion.div>

        {/* ── Asociaciones ── */}
        <div className="mb-14">
          <VerificationBadges
            items={PACAME_ASSOCIATIONS}
            title="001 · Asociaciones"
            subtitle="Verificación nacional en proceso"
          />
        </div>

        {/* ── Tech Partners ── */}
        <div className="mb-14">
          <VerificationBadges
            items={PACAME_PARTNERS}
            title="002 · Tech & compliance"
            subtitle="Stack y compliance verificados"
          />
        </div>

        {/* ── Press ── */}
        <div>
          <VerificationBadges
            items={PACAME_PRESS}
            title="003 · Prensa"
            subtitle="Apariciones programadas"
          />
        </div>
      </div>
    </section>
  );
}
