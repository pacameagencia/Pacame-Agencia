"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight, Check, Loader2, AlertCircle, Sparkles, MessageCircle,
  Phone, Camera, FileText, Receipt, Package, Bell, Volume2, Clock, Trophy,
  ChevronDown, ChevronUp, Quote, Zap,
} from "lucide-react";
import type { PacameProduct, ProductTier } from "@/lib/products/registry";
import { isValidEmail } from "@/lib/validators";
import { PanelTour } from "./PanelTour";
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

export default function AsesorProLanding({ product, tiers }: Props) {
  return (
    <main className="min-h-screen bg-paper">
      <Hero product={product} />
      <NumbersStrip />
      <PainQuote product={product} />
      <PanelTour />
      <BenefitsForAsesor />
      <ClientPanelTour />
      <AICapabilities />
      <PricingSection product={product} tiers={tiers} />
      <FAQ />
      <SignupSection product={product} />
      <Footer />
    </main>
  );
}

// ─── Hero ─────────────────────────────────────────────────────

function Hero({ product }: { product: PacameProduct }) {
  const trialCta = product.marketing.trial_cta ?? `Empieza gratis ${product.trial_days} días`;
  return (
    <section className="relative pt-24 lg:pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-10 bg-indigo-600" />
        <div className="absolute top-1/2 -left-32 w-[500px] h-[500px] rounded-full opacity-5 bg-terracotta-500" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
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
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-indigo-600">
              fiscal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline font-mono text-[11px] tracking-[0.2em] uppercase text-ink-mute">
              14 días gratis · sin tarjeta
            </span>
            <Link
              href="#empezar"
              className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink hover:text-terracotta-500 transition-colors"
            >
              Empezar →
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-end">
          <div>
            <motion.span
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="kicker block mb-6 text-indigo-600"
            >
              {product.name} · {product.tagline}
            </motion.span>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="font-display text-ink mb-8 text-balance"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                lineHeight: "0.95",
                letterSpacing: "-0.025em",
                fontWeight: 500,
              }}
            >
              Tus clientes facturan.<br />
              Tú revisas.{" "}
              <span
                className="italic font-light"
                style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                Adiós al WhatsApp infierno.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="font-sans text-lg lg:text-xl text-ink-soft mb-8 max-w-2xl leading-relaxed"
            >
              Cada cliente factura desde su panel, sube tickets por foto y tu IA los lee en
              3 segundos. Tú revisas en 30 segundos por cliente y al final del mes
              <strong className="text-ink"> el ZIP se empaqueta solo</strong>. Cero papeles, cero excusas.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="flex flex-wrap items-center gap-4"
            >
              <Link
                href="#empezar"
                className="inline-flex items-center gap-3 px-7 py-4 bg-ink text-paper font-sans font-medium text-[15px] tracking-wide hover:bg-terracotta-500 transition-colors"
                style={{ boxShadow: "5px 5px 0 #B54E30" }}
              >
                <Sparkles className="w-4 h-4" />
                {trialCta}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="#tour"
                className="inline-flex items-center gap-2 px-5 py-3 border-2 border-ink text-ink font-sans text-[14px] hover:bg-ink hover:text-paper transition-colors"
              >
                Ver tour 60 seg
              </Link>
            </motion.div>
          </div>

          {/* Mock visual a la derecha: triple stack mobile + dashboard */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="relative h-[420px] hidden lg:block"
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative w-full h-full">
      {/* Dashboard de fondo */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-0 top-0 w-72 h-44 bg-paper border-2 border-ink p-3"
        style={{ boxShadow: "8px 8px 0 #283B70" }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-rose-alert/60" />
          <span className="w-2 h-2 rounded-full bg-mustard-500" />
          <span className="w-2 h-2 rounded-full bg-olive-500" />
          <span className="ml-2 font-mono text-[8px] uppercase tracking-[0.15em] text-ink-mute">
            asesor-pro · pipeline
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { c: "#E8B730", n: 4 },
            { c: "#283B70", n: 12 },
            { c: "#6B7535", n: 8 },
            { c: "#1A1813", n: 23 },
          ].map((col, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span
                className="h-1 w-full"
                style={{ background: col.c }}
              />
              {[...Array(Math.min(col.n, 3))].map((_, j) => (
                <div
                  key={j}
                  className="h-3 bg-sand-100 border border-ink/10"
                />
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Móvil cliente */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute left-4 bottom-0 w-44 h-72 bg-ink rounded-[20px] p-1.5"
        style={{ boxShadow: "8px 8px 0 #B54E30" }}
      >
        <div className="w-full h-full bg-paper rounded-[16px] overflow-hidden flex flex-col">
          <div className="h-6 bg-paper flex items-center justify-center">
            <span className="w-12 h-1 bg-ink/20 rounded-full" />
          </div>
          <div className="flex-1 p-3 flex flex-col">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink-mute mb-1">
              Casa Marisol
            </span>
            <span className="font-display text-ink text-xs leading-tight mb-3" style={{ fontWeight: 500 }}>
              Subir gasto
            </span>
            <div className="flex-1 bg-gradient-to-br from-mustard-500/20 to-terracotta-500/20 flex items-center justify-center">
              <Camera className="w-10 h-10 text-ink/60" />
            </div>
            <div className="mt-2 text-[8px] font-mono uppercase tracking-[0.15em] text-ink-mute text-center">
              Toca para hacer foto
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notificación flotante */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute right-8 bottom-8 bg-ink text-paper px-4 py-3 max-w-[220px]"
        style={{ boxShadow: "5px 5px 0 #E8B730" }}
      >
        <div className="flex items-start gap-2">
          <Bell className="w-3.5 h-3.5 text-mustard-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/60 block">
              Telegram · ahora
            </span>
            <span className="font-sans text-[12px] leading-tight">
              Casa Marisol ha subido un ticket de 47,50 €
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Numbers strip ────────────────────────────────────────────

function NumbersStrip() {
  const stats = [
    { n: "−80%", label: "tiempo metiendo facturas a mano" },
    { n: "30s", label: "para revisar y aprobar un gasto" },
    { n: "0€", label: "en herramientas externas (todo dentro)" },
    { n: "24/7", label: "recepcionista IA contesta llamadas" },
  ];
  return (
    <section className="bg-ink py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center lg:text-left"
            >
              <span
                className="font-display text-paper block leading-none"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 500, letterSpacing: "-0.025em" }}
              >
                {s.n}
              </span>
              <span className="font-sans text-paper/60 text-sm mt-2 block">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pain Quote ───────────────────────────────────────────────

function PainQuote({ product }: { product: PacameProduct }) {
  const quote = product.marketing.pain_quote ?? "Pierdo 30% del día metiendo facturas a mano.";
  return (
    <section className="bg-sand-100 py-20 lg:py-28">
      <div className="max-w-4xl mx-auto px-6">
        <Quote className="w-8 h-8 text-terracotta-500 mb-6" />
        <p
          className="font-display text-ink text-balance"
          style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)", lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: 500 }}
        >
          “{quote}”
        </p>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink-mute mt-6">
          — Asesor fiscal real, 18 clientes, una semana antes de irse a Pacame
        </p>
      </div>
    </section>
  );
}

// ─── Beneficios para el asesor ───────────────────────────────

function BenefitsForAsesor() {
  const benefits = [
    {
      icon: Receipt,
      title: "OCR de tickets en 3 segundos",
      body: "Tu cliente le hace foto al ticket en el bar. Gemini Vision lee proveedor, NIF, base, IVA y categoría con 90%+ de acierto. Tú solo apruebas.",
    },
    {
      icon: FileText,
      title: "Facturas legales españolas",
      body: "Numeración correlativa por serie, datos fiscales, IVA por línea, PDF con tu logo. Cumple norma BOE sin que tengas que configurar nada.",
    },
    {
      icon: Package,
      title: "Pack mensual auto-empaquetado",
      body: "El día 1 de cada mes recibes un ZIP con todas las facturas, gastos y un CSV resumen por cliente. Tú decides qué hacer con él (presentar o no).",
    },
    {
      icon: MessageCircle,
      title: "Chat asesor ↔ cliente integrado",
      body: "Realtime, con notificaciones a tu Telegram y a tu móvil. Tu cliente deja de WhatsAppearte fotos sueltas. Todo queda registrado.",
    },
    {
      icon: Phone,
      title: "Recepcionista IA en español 24/7",
      body: "Vapi atiende en tu nombre cuando no puedes. Identifica al cliente, recoge motivo y te lo deja resumido en alertas + Telegram.",
    },
    {
      icon: Volume2,
      title: "Audio resumen de cada factura",
      body: "Tu cliente puede escuchar la factura emitida en español natural (ElevenLabs) en lugar de leerla. Útil mientras conduce o cocina.",
    },
  ];

  return (
    <section className="bg-paper py-20 lg:py-28 border-t-2 border-ink/10" id="features">
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-12 max-w-2xl">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute">
            Lo que TÚ recibes
          </span>
          <h2
            className="font-display text-ink mt-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            Seis cosas que{" "}
            <span
              className="italic font-light"
              style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
            >
              ningún asesor pequeño
            </span>{" "}
            tenía hasta ahora.
          </h2>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/15">
          {benefits.map((b) => (
            <div key={b.title} className="bg-paper p-6 lg:p-8">
              <b.icon className="w-7 h-7 text-terracotta-500 mb-5" />
              <h3 className="font-display text-ink text-xl mb-3" style={{ fontWeight: 500 }}>
                {b.title}
              </h3>
              <p className="font-sans text-ink-soft text-[15px] leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Vista del cliente final ──────────────────────────────────

function ClientPanelTour() {
  return (
    <section className="bg-sand-100 py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <div>
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute">
              Lo que TU CLIENTE ve
            </span>
            <h2
              className="font-display text-ink mt-2 mb-6"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: 500 }}
            >
              Su panel propio.{" "}
              <span
                className="italic font-light"
                style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                Gratis para él.
              </span>{" "}
              Mientras tú tengas tu plan activo, él tiene panel.
            </h2>
            <ul className="space-y-3 font-sans text-ink-soft">
              {[
                "Crea facturas en 3 clicks (PDF al instante).",
                "Sube tickets desde el móvil con foto. OCR rellena los campos.",
                "Ve su IVA repercutido y soportado del trimestre en vivo.",
                "Te chatea sin salirse del sistema. Tú lo ves en tu panel.",
                "Escucha el resumen hablado de cada factura en lugar de leerla.",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-terracotta-500 mt-1 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <ClientPanelMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function ClientPanelMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative bg-paper border-2 border-ink p-6"
      style={{ boxShadow: "8px 8px 0 #283B70" }}
    >
      <div className="flex items-center justify-between pb-3 border-b border-ink/10 mb-4">
        <span className="font-display text-ink" style={{ fontWeight: 500 }}>
          Casa Marisol Cádiz · Q2 2026
        </span>
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-olive-600">
          ●  IVA al día
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-sand-100 border border-ink/10 p-3">
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-mute block">
            Facturado Q2
          </span>
          <span className="font-display text-xl text-ink block leading-none mt-1" style={{ fontWeight: 500 }}>
            12.430 €
          </span>
        </div>
        <div className="bg-sand-100 border border-ink/10 p-3">
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-mute block">
            IVA repercut.
          </span>
          <span className="font-display text-xl text-ink block leading-none mt-1" style={{ fontWeight: 500 }}>
            2.610 €
          </span>
        </div>
        <div className="bg-sand-100 border border-ink/10 p-3">
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-mute block">
            IVA soportado
          </span>
          <span className="font-display text-xl text-terracotta-500 block leading-none mt-1" style={{ fontWeight: 500 }}>
            1.184 €
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { label: "Factura · 2026-0042 · Bar Andaluz · 480 €", color: "#283B70" },
          { label: "Gasto · Endesa · 189,30 €", color: "#B54E30" },
          { label: "Factura · 2026-0041 · Comunidad · 1.350 €", color: "#283B70" },
          { label: "Gasto · La Boca SL · 47,50 €", color: "#B54E30" },
        ].map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="flex items-center gap-3 px-3 py-2 bg-paper border border-ink/10"
          >
            <span className="w-1 h-4" style={{ background: row.color }} />
            <span className="font-sans text-[13px] text-ink-soft flex-1">{row.label}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-mute">
              hace {i + 2}h
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── AI Capabilities ─────────────────────────────────────────

function AICapabilities() {
  return (
    <section className="bg-ink text-paper py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-10 max-w-2xl">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-mustard-500">
            La IA bajo el capó
          </span>
          <h2
            className="font-display mt-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            Modelos top trabajando para ti{" "}
            <span
              className="italic font-light text-mustard-500"
              style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
            >
              en segundo plano.
            </span>
          </h2>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Camera,
              tag: "OCR",
              tech: "Gemini 2.0 Flash",
              body: "Lee tickets en español, extrae 7 campos en 3 segundos con 90%+ de acierto.",
            },
            {
              icon: Phone,
              tag: "Voz",
              tech: "Vapi · GPT-4o · ElevenLabs",
              body: "Asistente que coge llamadas en tu nombre, identifica clientes, te deja resumen.",
            },
            {
              icon: Volume2,
              tag: "Audio",
              tech: "ElevenLabs Multilingual v2",
              body: "Voz natural española para resumir facturas y notificaciones por audio.",
            },
            {
              icon: MessageCircle,
              tag: "Chat",
              tech: "Supabase Realtime",
              body: "Mensajería asesor↔cliente en vivo sin recargar. Notificaciones push a Telegram.",
            },
            {
              icon: Bell,
              tag: "Alertas",
              tech: "Reglas + Claude",
              body: "Avisos de cliente inactivo, trimestre cerca de cerrar, factura pendiente revisar.",
            },
            {
              icon: Zap,
              tag: "Auto-pack",
              tech: "Cron + Storage",
              body: "El día 1 de cada mes empaquetamos PDF + fotos + CSV resumen en un ZIP firmado.",
            },
          ].map((c) => (
            <div key={c.tag} className="border border-paper/15 p-6 hover:border-mustard-500/50 transition-colors">
              <c.icon className="w-6 h-6 text-mustard-500 mb-4" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-mustard-500 block mb-1">
                {c.tag} · {c.tech}
              </span>
              <p className="font-sans text-paper/80 text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────

function PricingSection({ product, tiers }: { product: PacameProduct; tiers: TierWithLimits[] }) {
  return (
    <section className="bg-paper py-20 lg:py-28 border-t-2 border-ink/10" id="planes">
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-12 max-w-2xl">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute">
            Planes
          </span>
          <h2
            className="font-display text-ink mt-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            Empieza por menos de lo que te cuesta{" "}
            <span
              className="italic font-light"
              style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
            >
              una hora a mano.
            </span>
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <article
              key={tier.tier}
              className={`relative bg-paper border-2 ${tier.recommended ? "border-terracotta-500" : "border-ink/15"} p-6 flex flex-col`}
              style={tier.recommended ? { boxShadow: "8px 8px 0 #B54E30" } : undefined}
            >
              {tier.recommended && (
                <span className="absolute -top-3 left-4 inline-flex items-center gap-1 px-2 py-0.5 bg-terracotta-500 text-paper font-mono text-[10px] tracking-[0.15em] uppercase">
                  <Sparkles className="w-3 h-3" /> Recomendado
                </span>
              )}
              <h3 className="font-display text-ink text-2xl" style={{ fontWeight: 500 }}>
                {tier.name}
              </h3>
              <div className="mt-4 mb-5">
                <span className="font-display text-ink" style={{ fontSize: "2.5rem", fontWeight: 500, lineHeight: 1 }}>
                  {tier.price_eur}
                </span>
                <span className="font-mono text-sm text-ink-mute ml-1">€/mes</span>
              </div>
              <ul className="space-y-2 font-sans text-sm text-ink-soft mb-6 flex-1">
                {tier.limits_formatted.map((l) => (
                  <li key={l} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-terracotta-500 mt-1 flex-shrink-0" />
                    {l}
                  </li>
                ))}
              </ul>
              <Link
                href="#empezar"
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 font-sans text-sm transition-colors ${
                  tier.recommended
                    ? "bg-ink text-paper hover:bg-terracotta-500"
                    : "border-2 border-ink text-ink hover:bg-ink hover:text-paper"
                }`}
              >
                Probar {product.trial_days} días gratis
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
        <p className="text-center font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mt-8">
          Sin tarjeta. Cancelas en 1 click. Tu cliente final accede gratis mientras tu plan esté activo.
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────

function FAQ() {
  const faqs = [
    {
      q: "¿Presentáis el IVA a Hacienda por mí?",
      a: "No. AsesorPro no envía nada a Hacienda. Te empaquetamos toda la información (facturas + gastos + cálculo IVA por trimestre) en un ZIP que tú usas como te convenga: presentas tú, lo envías a un colaborador o lo dejas archivado. Tú sigues siendo el asesor responsable, nosotros te quitamos el trabajo manual de recopilar.",
    },
    {
      q: "¿Mis clientes tienen que pagar?",
      a: "No. Tu cliente accede gratis a su panel mientras tú mantengas tu suscripción de AsesorPro activa. Le mandas el link de invitación, crea su cuenta en 1 minuto y empieza a facturar.",
    },
    {
      q: "¿Funciona en móvil?",
      a: "Sí, panel completamente responsive. Tu cliente sube tickets desde el móvil haciendo foto en el bar. Tú revisas desde donde quieras.",
    },
    {
      q: "¿Qué pasa si la IA se equivoca leyendo un ticket?",
      a: "Marca confianza < 60% como warning. Tú lo ves en amarillo y lo editas en 5 segundos. Mejora con cada uso porque el modelo aprende de tus correcciones.",
    },
    {
      q: "¿Puedo migrar de FacturaScripts/Holded/Sage?",
      a: "Sí. Importa CSV de facturas y clientes desde el wizard inicial. Si necesitas ayuda, escribe a hola@pacameagencia.com — te montamos la migración en 24h sin coste extra en plan Despacho.",
    },
    {
      q: "¿Y si dejo de pagar?",
      a: "Tienes 30 días para descargar todos los datos. Pasados los 30 días, archivamos. Nada de bloquearte el acceso al instante — lo que es tuyo, es tuyo.",
    },
    {
      q: "¿Qué incluye exactamente el pack mensual?",
      a: "Un ZIP con: PDFs de todas las facturas emitidas + fotos originales de tickets + un CSV con cálculos IVA y resumen por cliente, listo para abrir en Excel. Generado el día 1 de cada mes y notificado por Telegram.",
    },
    {
      q: "¿La recepcionista IA llama a mis clientes?",
      a: "No, sólo recibe llamadas. Coge el teléfono cuando tú no puedes, identifica al cliente, anota el motivo y te lo resumen en alertas. Si quieres que llame por ti, contáctanos para activar Vapi outbound.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-sand-100 py-20 lg:py-28" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <header className="mb-10">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute">
            Preguntas que nos hacen siempre
          </span>
          <h2
            className="font-display text-ink mt-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            FAQ.
          </h2>
        </header>
        <ul className="divide-y-2 divide-ink/10">
          {faqs.map((f, i) => (
            <li key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="w-full text-left py-5 flex items-start justify-between gap-4 group"
              >
                <span className="font-display text-ink text-lg leading-snug" style={{ fontWeight: 500 }}>
                  {f.q}
                </span>
                {open === i ? (
                  <ChevronUp className="w-5 h-5 text-ink-mute flex-shrink-0 mt-1" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-ink-mute flex-shrink-0 mt-1 group-hover:text-ink" />
                )}
              </button>
              {open === i && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-sans text-ink-soft pb-5 pr-8 leading-relaxed"
                >
                  {f.a}
                </motion.p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ─── Signup ──────────────────────────────────────────────────

function SignupSection({ product }: { product: PacameProduct }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; full_name?: string }>({});
  const [launching, setLaunching] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fe: typeof fieldErrors = {};
    if (!isValidEmail(email)) fe.email = "Introduce un email válido.";
    if (fullName.trim().length < 2) fe.full_name = "Nombre completo.";
    if (password.length < 8) fe.password = "Mínimo 8 caracteres.";
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${product.id}/trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "No se pudo iniciar el trial.");
        return;
      }
      const target = json.redirect ?? `/app/${product.id}`;
      setLaunching(true);
      router.prefetch(target);
      window.setTimeout(() => router.push(target), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="empezar"
      className="bg-paper py-20 lg:py-28 border-t-2 border-ink"
    >
      <div className="max-w-3xl mx-auto px-6">
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-terracotta-500">
          14 días · sin tarjeta · cancelas en 1 click
        </span>
        <h2
          className="font-display text-ink mt-3 mb-6 text-balance"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          Crea tu cuenta y entra al panel{" "}
          <span
            className="italic font-light"
            style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
          >
            en menos de un minuto.
          </span>
        </h2>

        <form
          onSubmit={submit}
          className="bg-paper border-2 border-ink p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-4"
          style={{ boxShadow: "8px 8px 0 #B54E30" }}
        >
          <Field label="Tu nombre" type="text" value={fullName} onChange={setFullName} placeholder="Pablo Calleja" error={fieldErrors.full_name} />
          <Field label="Email profesional" type="email" value={email} onChange={setEmail} placeholder="tu@asesoria.com" error={fieldErrors.email} />
          <div className="md:col-span-2">
            <Field label="Contraseña (mín. 8 caracteres)" type="password" value={password} onChange={setPassword} error={fieldErrors.password} />
          </div>

          {error && (
            <div className="md:col-span-2 flex items-start gap-3 p-3 border border-rose-alert/40 bg-rose-alert/10 text-sm text-rose-alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-2 inline-flex items-center justify-center gap-3 px-7 py-4 bg-ink text-paper font-sans font-medium text-[15px] tracking-wide transition-all disabled:opacity-50 hover:bg-terracotta-500"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando tu panel…
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                Empezar 14 días gratis
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-mute mt-6 text-center">
          Tus datos quedan en Supabase EU · Stripe gestiona los pagos · Sin spam jamás
        </p>
      </div>
      <AppLaunchOverlay
        open={launching}
        name={product.name}
        color={product.marketing.primary_color ?? "#283B70"}
        accentColor="#FAF6EE"
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
  error,
}: {
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`w-full px-4 py-3 bg-paper border ${
          error ? "border-rose-alert" : "border-ink/30"
        } text-ink text-[15px] focus:outline-none focus:border-ink`}
      />
      {error && <span className="block mt-1 font-sans text-[12px] text-rose-alert">{error}</span>}
    </label>
  );
}

// ─── Footer ──────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-ink text-paper py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-paper/50">
          PACAME · AsesorPro · 2026
        </span>
        <div className="flex gap-6 font-mono text-[11px] tracking-[0.15em] uppercase">
          <Link href="/p" className="text-paper/70 hover:text-paper">Productos</Link>
          <Link href="/contacto" className="text-paper/70 hover:text-paper">Soporte</Link>
          <Link href="/privacidad" className="text-paper/70 hover:text-paper">Privacidad</Link>
        </div>
      </div>
    </footer>
  );
}
