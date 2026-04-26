"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Receipt, CheckCircle2, Package, MessageCircle,
  Play, Pause, ArrowRight, Sparkles, Clock, FileText, Phone,
  Bookmark, Bell,
} from "lucide-react";

type FrameId = "ocr" | "pipeline" | "review" | "pack" | "chat";

const FRAMES: { id: FrameId; tag: string; title: string; minute: string }[] = [
  { id: "ocr",      tag: "01 · El cliente sube una foto", title: "OCR automático en 3 segundos",        minute: "0:00" },
  { id: "pipeline", tag: "02 · Aparece en tu Trello",     title: "Pipeline tipo Kanban con prioridades", minute: "0:12" },
  { id: "review",   tag: "03 · Apruebas en 1 click",      title: "30 segundos por gasto, no 3 minutos",  minute: "0:24" },
  { id: "pack",     tag: "04 · Pack mensual ZIP",         title: "Todo empaquetado al cierre",           minute: "0:36" },
  { id: "chat",     tag: "05 · Chat + Telegram + IA",     title: "Tus clientes preguntan, no te llaman", minute: "0:48" },
];

export function PanelTour() {
  const [active, setActive] = useState<FrameId>("ocr");
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      const idx = FRAMES.findIndex((f) => f.id === active);
      const next = FRAMES[(idx + 1) % FRAMES.length];
      setActive(next.id);
    }, 4500);
    return () => clearTimeout(t);
  }, [active, playing]);

  return (
    <section className="bg-paper py-20 lg:py-28 border-t-2 border-ink/10">
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-10 max-w-2xl">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute">
            Tour del panel · 60 segundos
          </span>
          <h2
            className="font-display text-ink mt-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            Mira cómo funciona{" "}
            <span
              className="italic font-light"
              style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
            >
              antes de entrar.
            </span>
          </h2>
          <p className="font-sans text-ink-soft mt-3">
            Sin descargas, sin demos comerciales, sin llamadas.
            Pulsa cualquier frame del lateral para verlo.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Frame principal */}
          <div className="relative">
            <div
              className="relative bg-ink overflow-hidden"
              style={{
                aspectRatio: "16/10",
                borderRadius: 4,
                boxShadow: "8px 8px 0 #B54E30",
              }}
            >
              {/* Barra superior estilo browser */}
              <div className="h-9 bg-paper border-b-2 border-ink flex items-center px-3 gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-alert/80" />
                  <span className="w-3 h-3 rounded-full bg-mustard-500" />
                  <span className="w-3 h-3 rounded-full bg-olive-500" />
                </div>
                <div className="flex-1 mx-3 bg-sand-100 px-3 py-0.5 font-mono text-[10px] text-ink-mute truncate">
                  pacameagencia.com/app/asesor-pro
                </div>
                <span className="font-mono text-[10px] text-ink-mute hidden md:inline">
                  {FRAMES.find((f) => f.id === active)?.minute}
                </span>
              </div>

              {/* Body del frame */}
              <div className="absolute inset-0 top-9 bg-paper">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0 overflow-hidden"
                  >
                    {active === "ocr" && <FrameOCR />}
                    {active === "pipeline" && <FramePipeline />}
                    {active === "review" && <FrameReview />}
                    {active === "pack" && <FramePack />}
                    {active === "chat" && <FrameChat />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Controles play/pausa + dots */}
            <div className="mt-5 flex items-center justify-between gap-4">
              <button
                onClick={() => setPlaying((v) => !v)}
                aria-label={playing ? "Pausar tour" : "Reanudar tour"}
                className="inline-flex items-center gap-2 px-3 py-2 bg-ink text-paper font-mono text-[11px] tracking-[0.15em] uppercase hover:bg-terracotta-500 transition-colors"
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {playing ? "Pausar" : "Reproducir"}
              </button>
              <div className="flex gap-1.5">
                {FRAMES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setActive(f.id); setPlaying(false); }}
                    aria-label={`Ir al frame ${f.tag}`}
                    className={`h-1.5 transition-all ${
                      active === f.id ? "bg-ink w-8" : "bg-ink/20 w-4 hover:bg-ink/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Lista de capítulos (tipo timeline) */}
          <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-2 px-2">
            {FRAMES.map((f) => {
              const isActive = active === f.id;
              return (
                <li key={f.id} className="flex-shrink-0 lg:flex-shrink">
                  <button
                    onClick={() => { setActive(f.id); setPlaying(false); }}
                    className={`text-left p-4 border-2 transition-all w-full lg:w-auto min-w-[260px] ${
                      isActive
                        ? "bg-paper border-ink"
                        : "bg-paper border-ink/15 hover:border-ink/40"
                    }`}
                    style={isActive ? { boxShadow: "4px 4px 0 #283B70" } : undefined}
                  >
                    <span
                      className="font-mono text-[10px] tracking-[0.2em] uppercase block mb-1"
                      style={{ color: isActive ? "#B54E30" : "#6E6858" }}
                    >
                      {f.tag}
                    </span>
                    <span className="font-display text-[15px] text-ink block leading-tight" style={{ fontWeight: 500 }}>
                      {f.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Frames ────────────────────────────────────────────────

function FrameOCR() {
  return (
    <div className="flex h-full">
      {/* Móvil del cliente subiendo foto */}
      <div className="w-1/2 bg-sand-100 p-6 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative w-44 h-72 bg-ink rounded-[20px] p-1.5 shadow-2xl"
        >
          <div className="w-full h-full bg-paper rounded-[16px] overflow-hidden flex flex-col">
            <div className="h-6 bg-paper flex items-center justify-center">
              <span className="w-12 h-1 bg-ink/20 rounded-full" />
            </div>
            <div className="flex-1 p-3 flex flex-col">
              <div className="flex items-center gap-2 pb-2 border-b border-ink/10 mb-2">
                <Camera className="w-3 h-3 text-ink" />
                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-ink">
                  Subir ticket
                </span>
              </div>
              <div className="flex-1 bg-gradient-to-br from-mustard-500/30 to-terracotta-500/30 flex items-center justify-center relative overflow-hidden">
                <Receipt className="w-12 h-12 text-ink/60" />
                <motion.div
                  initial={{ y: -160 }}
                  animate={{ y: 160 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-x-0 h-0.5 bg-terracotta-500 shadow-[0_0_15px_#B54E30]"
                />
              </div>
              <div className="mt-2 px-2 py-1.5 bg-ink text-paper text-center text-[8px] font-mono uppercase tracking-[0.15em]">
                Procesando…
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Resultado OCR */}
      <div className="w-1/2 p-6 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="bg-paper border-2 border-ink p-4"
          style={{ boxShadow: "5px 5px 0 #283B70" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-mustard-700" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">
              OCR Gemini · 94% confianza
            </span>
          </div>
          <div className="space-y-1.5">
            <Row k="Proveedor" v="Restaurante La Boca SL" />
            <Row k="NIF" v="B-87412563" />
            <Row k="Fecha" v="14 abr 2026" />
            <Row k="Base" v="39,26 €" />
            <Row k="IVA (21%)" v="8,24 €" />
            <Row k="Total" v="47,50 €" highlight />
            <Row k="Categoría" v="Restauración" />
          </div>
          <div className="mt-3 pt-3 border-t border-ink/10 text-[9px] font-mono text-ink-mute">
            ✓ Foto en Storage · pendiente de tu revisión
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FramePipeline() {
  const cols = [
    { label: "Pendiente", color: "#E8B730", count: 4, sub: "Por revisar" },
    { label: "Revisado", color: "#283B70", count: 12, sub: "Listo para empaquetar" },
    { label: "Empaquetado", color: "#6B7535", count: 8, sub: "Pack mensual" },
    { label: "Cerrado", color: "#1A1813", count: 23, sub: "Trimestre cerrado" },
  ];
  return (
    <div className="h-full flex flex-col p-5 bg-paper overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <span className="font-display text-ink text-base" style={{ fontWeight: 500 }}>
          Pipeline · Marzo 2026
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">
          47 tareas
        </span>
      </div>
      <div className="flex gap-2 flex-1">
        {cols.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="flex-1 bg-sand-100 border-2 border-ink/10 p-2 flex flex-col gap-1.5 min-w-0"
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="font-mono text-[9px] tracking-[0.15em] uppercase font-semibold"
                style={{ color: c.color }}
              >
                {c.label}
              </span>
              <span className="font-mono text-[9px] text-ink-mute">{c.count}</span>
            </div>
            {[...Array(Math.min(c.count, 3))].map((_, j) => (
              <motion.div
                key={j}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + j * 0.08 + 0.3 }}
                className="bg-paper border border-ink/15 p-1.5"
              >
                <div className="flex items-start gap-1">
                  <span className="w-1 h-3 mt-0.5" style={{ background: c.color }} />
                  <div className="flex-1 min-w-0">
                    <span className="font-sans text-[9px] text-ink truncate block">
                      {sampleCard(i, j)}
                    </span>
                    <span className="font-mono text-[8px] text-ink-mute">{c.sub}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function sampleCard(col: number, idx: number) {
  const samples = [
    ["Casa Marisol · 3 facturas", "Bar Andaluz · Q1 IVA", "Despacho Calleja · cierre", "Tienda Lola · contrato"],
    ["Asesoría Pérez · revisado", "TallerJoma · OK", "Casa Lucia · OK", "Bodega Joven · OK"],
    ["Pack marzo · Casa Marisol", "Pack marzo · TallerJoma", "Pack feb · Bar Andaluz"],
    ["Q4 2025 · Casa Marisol", "Q4 2025 · Bar Andaluz", "Q4 2025 · TallerJoma"],
  ];
  return samples[col]?.[idx] ?? "Tarea";
}

function FrameReview() {
  return (
    <div className="h-full p-5 bg-paper">
      <div className="flex items-center justify-between mb-4">
        <span className="font-display text-ink text-base" style={{ fontWeight: 500 }}>
          Gastos pendientes · Casa Marisol Cádiz
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-mustard-700">
          4 esperando
        </span>
      </div>
      <div className="bg-paper border-2 border-ink/15">
        {[
          { vendor: "Restaurante La Boca SL", date: "14 abr", total: "47,50 €", iva: "8,24 €", cat: "Restauración" },
          { vendor: "Mayorista Pesca Azul", date: "13 abr", total: "312,40 €", iva: "30,11 €", cat: "Materia prima", review: true },
          { vendor: "Endesa Energía", date: "11 abr", total: "189,30 €", iva: "32,87 €", cat: "Suministros" },
          { vendor: "Combustibles Lucía", date: "10 abr", total: "62,00 €", iva: "10,76 €", cat: "Combustible" },
        ].map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.12 }}
            className={`grid grid-cols-[1.5fr_60px_70px_70px_90px_auto] items-center gap-2 px-3 py-2 ${
              i < 3 ? "border-b border-ink/10" : ""
            } ${r.review ? "bg-mustard-500/10" : ""}`}
          >
            <div>
              <span className="font-sans text-[12px] text-ink block">{r.vendor}</span>
              <span className="font-mono text-[9px] text-ink-mute">{r.cat}</span>
            </div>
            <span className="font-mono text-[10px] text-ink-mute">{r.date}</span>
            <span className="font-mono text-[11px] text-ink-soft text-right">{r.iva}</span>
            <span className="font-mono text-[11px] text-ink font-semibold text-right">{r.total}</span>
            <span className="font-mono text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5 bg-mustard-500/15 text-mustard-700 text-center">
              Pendiente
            </span>
            {i === 1 ? (
              <motion.button
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="px-2 py-1 bg-ink text-paper text-[9px] font-mono uppercase tracking-[0.1em]"
              >
                Aprobar
              </motion.button>
            ) : (
              <span className="px-2 py-1 bg-ink/5 text-ink-mute text-[9px] font-mono uppercase tracking-[0.1em]">
                Revisar
              </span>
            )}
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-olive-500/15 border border-olive-500/40"
      >
        <CheckCircle2 className="w-3 h-3 text-olive-600" />
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-olive-600">
          1 gasto aprobado · 3 restantes
        </span>
      </motion.div>
    </div>
  );
}

function FramePack() {
  return (
    <div className="h-full p-6 bg-paper flex">
      <div className="flex-1 pr-6">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">
          Pack mensual · Marzo 2026
        </span>
        <h3 className="font-display text-ink text-xl mt-2 mb-4" style={{ fontWeight: 500 }}>
          Casa Marisol Cádiz
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Stat label="Facturas" value="14" sub="2.430,80 €" />
          <Stat label="Gastos" value="22" sub="1.190,40 €" />
          <Stat label="IVA repercutido" value="421,53 €" sub="" />
          <Stat label="IVA soportado" value="183,72 €" sub="" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-3 p-3 bg-ink text-paper"
          style={{ boxShadow: "4px 4px 0 #B54E30" }}
        >
          <Package className="w-4 h-4" />
          <div className="flex-1">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase block">
              CasaMarisol_Marzo2026.zip
            </span>
            <span className="font-mono text-[9px] text-paper/60">
              14 PDF + 22 fotos + resumen.csv · 4.2 MB
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase">↓ ZIP</span>
        </motion.div>
      </div>
      <div className="w-44 flex-shrink-0 border-l-2 border-ink/10 pl-5 flex flex-col">
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-mute mb-3">
          Próximos packs
        </span>
        {["Casa Marisol", "Bar Andaluz", "TallerJoma", "Lola Tienda"].map((c, i) => (
          <motion.div
            key={c}
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 + 0.4 }}
            className="flex items-center gap-2 py-1.5 border-b border-ink/5"
          >
            <Clock className="w-3 h-3 text-ink-mute" />
            <span className="font-sans text-[11px] text-ink truncate">{c}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FrameChat() {
  return (
    <div className="h-full flex">
      <div className="w-32 bg-ink p-3 flex flex-col gap-1.5">
        {["Casa Marisol", "Bar Andaluz", "TallerJoma", "Lola"].map((c, i) => (
          <motion.div
            key={c}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            className={`px-2 py-2 border-l-2 ${
              i === 0 ? "border-mustard-500 bg-paper/10" : "border-transparent"
            }`}
          >
            <span className="font-sans text-paper text-[10px] block truncate">{c}</span>
            {i === 0 && (
              <span className="font-mono text-[8px] text-mustard-500">2 nuevos</span>
            )}
          </motion.div>
        ))}
      </div>
      <div className="flex-1 p-4 bg-paper flex flex-col">
        <div className="pb-2 border-b border-ink/10 mb-3">
          <span className="font-display text-ink text-sm" style={{ fontWeight: 500 }}>
            Casa Marisol Cádiz
          </span>
          <span className="block font-mono text-[9px] text-ink-mute">
            Marisol Pérez · activo hace 2 min
          </span>
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          <Bubble who="cliente" delay={0.3}>
            ¿Tengo que mandarte ya las facturas de marzo?
          </Bubble>
          <Bubble who="asesor" delay={0.9}>
            No hace falta — ya están todas en el panel. Te paso el ZIP el día 5 de cada mes.
          </Bubble>
          <Bubble who="cliente" delay={1.6}>
            ¡Ah! Genial. Una pregunta tonta, ¿la cena con clientes la puedo deducir?
          </Bubble>
          <Bubble who="ai" delay={2.2}>
            Hasta el 1% de tu facturación anual y con tarjeta a tu nombre. Sube la foto y la
            etiqueto como restauración deducible 👇
          </Bubble>
        </div>
        <div className="mt-2 pt-2 border-t border-ink/10 flex items-center gap-2">
          <Phone className="w-3 h-3 text-terracotta-500" />
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-mute">
            Recepcionista IA atendiendo llamadas · 24/7
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers visuales ────────────────────────────────────────

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute">{k}</span>
      <span
        className={`font-mono text-[12px] ${
          highlight ? "text-ink font-semibold" : "text-ink-soft"
        }`}
      >
        {v}
      </span>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-sand-100 border border-ink/10 p-2">
      <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-ink-mute block">
        {label}
      </span>
      <span className="font-display text-ink text-lg block leading-none mt-1" style={{ fontWeight: 500 }}>
        {value}
      </span>
      {sub && <span className="font-mono text-[9px] text-ink-mute">{sub}</span>}
    </div>
  );
}

function Bubble({
  who,
  children,
  delay,
}: {
  who: "asesor" | "cliente" | "ai";
  children: React.ReactNode;
  delay: number;
}) {
  const align = who === "cliente" ? "items-start" : "items-end";
  const bg =
    who === "cliente"
      ? "bg-sand-200 text-ink"
      : who === "ai"
      ? "bg-terracotta-500 text-paper"
      : "bg-ink text-paper";
  const tag = who === "ai" ? "IA · LUCÍA" : who === "asesor" ? "Tú" : "Marisol";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`flex flex-col ${align}`}
    >
      <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-ink-mute mb-0.5">
        {tag}
      </span>
      <div className={`px-2.5 py-1.5 max-w-[80%] text-[10px] font-sans leading-snug ${bg}`}>
        {children}
      </div>
    </motion.div>
  );
}

// Re-exportar iconos extra usados en otros componentes
export { ArrowRight, Bookmark, Bell, FileText };
