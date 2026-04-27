"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import type { PacameProduct, ProductTier } from "@/lib/products/registry";
import { AppLaunchOverlay } from "@/components/products/AppLauncher";

interface TierWithLimits extends ProductTier {
  limits_formatted: string[];
}

interface Props {
  product: PacameProduct;
  tiers: TierWithLimits[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: i * 0.08, ease: [0.7, 0, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function ProductLanding({ product, tiers }: Props) {
  const primary = product.marketing.primary_color ?? "#283B70";
  const accent = product.marketing.accent_color ?? "#B54E30";

  return (
    <main className="min-h-screen bg-paper">
      <Hero product={product} primary={primary} accent={accent} />
      <PainQuote product={product} accent={accent} />
      <FeaturesSection product={product} accent={accent} />
      <PricingSection product={product} tiers={tiers} primary={primary} accent={accent} />
      <SignupSection product={product} primary={primary} accent={accent} />
      <PacameFooter />
    </main>
  );
}

function Hero({ product, primary, accent }: { product: PacameProduct; primary: string; accent: string }) {
  const trialCta = product.marketing.trial_cta ?? `Empieza gratis ${product.trial_days} días`;
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      {/* Background composition */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-10"
          style={{ background: primary }}
        />
        <div
          className="absolute top-1/2 -left-32 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ background: accent }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Banda editorial */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="flex items-center justify-between mb-12 pb-6 border-b-2 border-ink"
        >
          <div className="flex items-center gap-6">
            <Link
              href="/p"
              className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink hover:text-terracotta-500 transition-colors"
            >
              ← PACAME / Productos
            </Link>
            <span
              className="font-mono text-[11px] tracking-[0.25em] uppercase"
              style={{ color: primary }}
            >
              {product.category ?? "—"}
            </span>
          </div>
          <span
            className="font-mono text-[10px] tracking-[0.25em] uppercase px-2 py-1"
            style={{ background: accent + "20", color: accent }}
          >
            {product.status === "beta" ? "★ EARLY ACCESS" : "★ LIVE"}
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="lg:col-span-9">
            <span className="kicker block mb-6" style={{ color: primary }}>
              {product.name} · {product.tagline}
            </span>
            <h1
              className="font-display text-ink text-balance"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 6rem)",
                lineHeight: "0.95",
                letterSpacing: "-0.035em",
                fontWeight: 500,
              }}
            >
              {(product.marketing.hero_headline ?? product.tagline).split(".").map((part, i, arr) => (
                <span key={i} className="block">
                  {i === arr.length - 2 ? (
                    <span
                      className="italic font-light"
                      style={{ color: accent, fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
                    >
                      {part.trim()}.
                    </span>
                  ) : part.trim() ? (
                    `${part.trim()}.`
                  ) : null}
                </span>
              ))}
            </h1>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="lg:col-span-3 lg:pb-6">
            {product.marketing.hero_sub && (
              <p className="font-sans text-ink-soft text-[16px] leading-relaxed">
                {product.marketing.hero_sub}
              </p>
            )}
          </motion.div>
        </div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="mt-12 flex flex-col sm:flex-row gap-4">
          <a
            href="#signup"
            className="group inline-flex items-center justify-center gap-3 px-7 py-4 text-paper font-sans font-medium text-[15px] tracking-wide transition-all duration-300 rounded-sm"
            style={{
              background: accent,
              boxShadow: "5px 5px 0 #1A1813",
            }}
          >
            {trialCta}
            <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center gap-3 px-7 py-4 border-2 border-ink text-ink font-sans font-medium text-[15px] tracking-wide hover:bg-ink hover:text-paper transition-all duration-300 rounded-sm"
          >
            Ver qué hace
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function PainQuote({ product, accent }: { product: PacameProduct; accent: string }) {
  if (!product.marketing.pain_quote) return null;
  return (
    <section className="bg-ink py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <Sparkles className="w-6 h-6 mx-auto mb-6" style={{ color: accent }} />
        <p
          className="font-display text-paper italic"
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            lineHeight: "1.25",
            letterSpacing: "-0.015em",
            fontWeight: 300,
            fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
          }}
        >
          &ldquo;{product.marketing.pain_quote}&rdquo;
        </p>
        <p className="mt-6 font-mono text-[11px] tracking-[0.25em] uppercase text-paper/50">
          {product.marketing.target_persona}
        </p>
      </div>
    </section>
  );
}

function FeaturesSection({ product, accent }: { product: PacameProduct; accent: string }) {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 pb-10 border-b-2 border-ink">
          <div className="lg:col-span-2">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">§ Qué hace</span>
          </div>
          <div className="lg:col-span-7">
            <h2
              className="font-display text-ink"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
            >
              Todo lo que necesitas{" "}
              <span
                className="italic font-light"
                style={{ color: accent, fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                en un sitio.
              </span>
            </h2>
          </div>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {product.features.map((f, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="flex items-start gap-4"
            >
              <span
                className="flex-shrink-0 mt-1 w-6 h-6 rounded-sm flex items-center justify-center"
                style={{ background: accent + "20", color: accent }}
              >
                <Check className="w-3.5 h-3.5" />
              </span>
              <span className="font-sans text-ink text-[16px] leading-snug">{f}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PricingSection({
  product,
  tiers,
  primary,
  accent,
}: {
  product: PacameProduct;
  tiers: TierWithLimits[];
  primary: string;
  accent: string;
}) {
  return (
    <section id="pricing" className="py-24 px-6 bg-sand-100">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 pb-10 border-b-2 border-ink">
          <div className="lg:col-span-2">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">§ Precio</span>
          </div>
          <div className="lg:col-span-7">
            <h2
              className="font-display text-ink"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
            >
              Pagas cuando{" "}
              <span
                className="italic font-light"
                style={{ color: accent, fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                ya te ha resuelto la vida.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <p className="font-sans text-ink-soft text-[14px] leading-relaxed">
              {product.trial_days} días gratis. Sin tarjeta. Sin compromiso. Cancela en 1 click.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((t, idx) => {
            const isFeatured = t.recommended;
            return (
              <motion.div
                key={t.tier}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.7, 0, 0.3, 1] as [number, number, number, number] }}
                className={`relative bg-paper border-2 flex flex-col ${
                  isFeatured ? "border-ink lg:scale-[1.02] lg:-translate-y-2" : "border-ink/30"
                }`}
                style={{
                  boxShadow: isFeatured ? "8px 8px 0 #1A1813" : "5px 5px 0 #1A1813",
                }}
              >
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-4 py-1.5 text-paper" style={{ background: accent }}>
                      <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-medium">
                        ★ Más vendido
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-8 border-b-2 border-ink/20">
                  <span
                    className="font-mono text-[10px] tracking-[0.25em] uppercase mb-3 block"
                    style={{ color: primary }}
                  >
                    {t.tier.toUpperCase()}
                  </span>
                  <h3
                    className="font-display text-ink mb-2"
                    style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", lineHeight: "1", fontWeight: 500 }}
                  >
                    {t.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span
                      className="font-display text-ink tabular-nums"
                      style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
                    >
                      {t.price_eur}
                    </span>
                    <span className="font-mono text-ink-mute text-[12px]">
                      €/{t.interval === "month" ? "mes" : "año"}
                    </span>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {t.limits_formatted.map((l, li) => (
                      <li key={li} className="flex items-start gap-3 text-[14px] font-sans text-ink leading-snug">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`#signup?tier=${t.tier}`}
                    className={`group inline-flex items-center justify-center gap-3 px-5 py-3 font-sans font-medium text-[14px] transition-all duration-300 rounded-sm ${
                      isFeatured ? "text-paper" : "border-2 border-ink text-ink hover:bg-ink hover:text-paper"
                    }`}
                    style={isFeatured ? { background: accent } : {}}
                  >
                    Empezar 14 días gratis
                    <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SignupSection({ product, primary, accent }: { product: PacameProduct; primary: string; accent: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}/trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Algo falló al crear la cuenta");
        return;
      }
      const target = json.redirect ?? `/app/${product.id}`;
      setLaunching(true);
      router.prefetch(target);
      window.setTimeout(() => router.push(target), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="signup" className="py-24 px-6 bg-paper">
      <div className="max-w-3xl mx-auto">
        <div className="bg-ink text-paper p-12 relative" style={{ boxShadow: `10px 10px 0 ${accent}` }}>
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-paper/15">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase" style={{ color: accent }}>
              § Cierre · Empezar
            </span>
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-paper/50">
              {product.trial_days} días · sin tarjeta
            </span>
          </div>

          <h2
            className="font-display text-paper mb-8 text-balance"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: "0.95", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            Crea tu cuenta en 30 segundos.{" "}
            <span
              className="italic font-light"
              style={{ color: accent, fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
            >
              Sin compromiso.
            </span>
          </h2>

          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Email"
              type="email"
              required
              value={email}
              onChange={setEmail}
              placeholder="tu@email.com"
            />
            <Field
              label="Nombre"
              type="text"
              required
              value={fullName}
              onChange={setFullName}
              placeholder="Tu nombre completo"
            />
            <Field
              label="Contraseña (mínimo 8 caracteres)"
              type="password"
              required
              value={password}
              onChange={setPassword}
              placeholder="Una buena contraseña"
              minLength={8}
            />

            {error && (
              <div className="flex items-start gap-3 p-3 border border-rose-alert/40 bg-rose-alert/10 text-sm text-rose-alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !fullName || password.length < 8}
              className="w-full inline-flex items-center justify-center gap-3 px-7 py-4 text-ink font-sans font-medium text-[15px] tracking-wide transition-all duration-300 disabled:opacity-50 rounded-sm"
              style={{ background: accent, boxShadow: "5px 5px 0 #B54E30" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Empezar mis {product.trial_days} días gratis
                  <ArrowUpRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[12px] font-mono text-paper/50 text-center pt-2">
              Acepto los términos. Puedo cancelar en cualquier momento desde mi cuenta.
            </p>
          </form>
        </div>
      </div>
      <AppLaunchOverlay
        open={launching}
        name={product.name}
        color={primary}
        accentColor={accent || "#FAF6EE"}
      />
    </section>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
  minLength,
}: {
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-paper/60 block mb-2">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full px-4 py-3 bg-paper/5 border border-paper/20 text-paper text-[15px] focus:outline-none focus:border-mustard-500 rounded-sm placeholder:text-paper/30"
      />
    </label>
  );
}

function PacameFooter() {
  return (
    <footer className="bg-paper border-t-2 border-ink py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink hover:text-terracotta-500">
          ← PACAME · Madrid · 2026
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/p" className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute hover:text-ink">
            Otros productos
          </Link>
          <a
            href="mailto:hola@pacameagencia.com"
            className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute hover:text-ink"
          >
            Soporte
          </a>
          <Link href="/factoria" className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute hover:text-ink">
            ¿Por qué PACAME?
          </Link>
        </div>
      </div>
    </footer>
  );
}
