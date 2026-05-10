/**
 * Dark Academy · Landing pública de la academia.
 *
 * URL pública: `darkroomcreative.cloud/academia`.
 * Source curriculum: `strategy/darkroom/academy/curriculum.md` v1.
 *
 * Voz Dark Room: tutea, frases cortas, datos concretos, cero superlativos.
 * Cero menciones PACAME ni Pablo Calleja (regla R7 subagente dark-academy).
 *
 * Server component. Inline styles · sin dependencia Tailwind.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ensureDarkRoomHost } from "@/lib/darkroom/host-guard";

export const metadata: Metadata = {
  title: "Dark Academy · Academia visual de IA",
  description:
    "Aprende IA visual con el stack real: Higgsfield, Nano Banana Pro, Seedance, ChatGPT. 6 módulos. Microlecciones de 5-15 min. Cero relleno. Tu primera pieza decente en 90 minutos.",
  alternates: { canonical: "https://darkroomcreative.cloud/academia" },
  openGraph: {
    type: "website",
    title: "Dark Academy · Academia visual de IA",
    description:
      "6 módulos de IA visual. Microlecciones. Stack real, no genérico. De cero a primera pieza en 90 minutos.",
    url: "https://darkroomcreative.cloud/academia",
    siteName: "Dark Academy",
    locale: "es_ES",
  },
  robots: { index: true, follow: true },
};

const C = {
  bg: "#0A0A0A",
  bgSoft: "#141414",
  bgCard: "#161616",
  border: "rgba(255,255,255,0.08)",
  borderGold: "rgba(212,175,55,0.25)",
  text: "#F5F5F0",
  textMid: "#A1A1AA",
  textLow: "#71717A",
  gold: "#D4AF37",
  goldSoft: "rgba(212,175,55,0.12)",
  accent: "#E11D48",
  fontDisplay:
    '"Space Grotesk", Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontBody: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontMono:
    '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

const MODULES = [
  {
    id: "M1",
    title: "Fundamentos IA visual",
    weight: "15%",
    range: "0 → 15%",
    lessons: 5,
    summary: "Mapa del stack. Qué herramienta para qué cosa. Tier system AUTHENTIC / CINEMATIC / HYBRID.",
    leadMagnet: "Mapa del stack IA 2026",
    leadMagnetSlug: "mapa-stack-ia-2026",
  },
  {
    id: "M2",
    title: "Prompting básico",
    weight: "15%",
    range: "15 → 30%",
    lessons: 6,
    summary: "Estructura 5-step cinematográfica. JSON schema. Bot ayudante.",
    leadMagnet: "20 prompts copiables para empezar",
    leadMagnetSlug: "20-prompts-copiables",
  },
  {
    id: "M3",
    title: "Imagen IA",
    weight: "25%",
    range: "30 → 55%",
    lessons: 8,
    summary: "Personajes consistentes con 360 sheet. Outfit swap sin perder cara. Texturas que pasan Three-Pass Review.",
    leadMagnet: "Checklist Three-Pass Review · 26 markers",
    leadMagnetSlug: "three-pass-review-checklist",
  },
  {
    id: "M4",
    title: "Video IA cinemático",
    weight: "20%",
    range: "55 → 75%",
    lessons: 6,
    summary: "Research-first cinemático. Decision Tree formato. Encadenar shots con start/last frame.",
    leadMagnet: "Decision Tree formato · mapa visual",
    leadMagnetSlug: "decision-tree-formato",
  },
  {
    id: "M5",
    title: "Workflows productivos",
    weight: "15%",
    range: "75 → 90%",
    lessons: 5,
    summary: "Avatar persistente. Batch generation. 30 piezas en 3 horas. 6 tipos de ads.",
    leadMagnet: "30 piezas en 3 horas · template batch",
    leadMagnetSlug: "30-piezas-3-horas",
  },
  {
    id: "M6",
    title: "Monetización + portfolio",
    weight: "10%",
    range: "90 → 100%",
    lessons: 4,
    summary: "Anti-promesas. Marco honesto de precios €. Portfolio con 3 piezas. Canales LATAM-ES.",
    leadMagnet: "Marco honesto de precios €",
    leadMagnetSlug: "marco-honesto-precios-euros",
  },
];

export default async function AcademiaLandingPage() {
  await ensureDarkRoomHost();

  return (
    <main
      style={{
        background: C.bg,
        color: C.text,
        fontFamily: C.fontBody,
        minHeight: "100vh",
      }}
    >
      {/* ─── HERO ──────────────────────────────────────────── */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "96px 24px 56px" }}>
        <div
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            border: `1px solid ${C.gold}`,
            color: C.gold,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          Dark Academy
        </div>

        <h1
          style={{
            fontFamily: C.fontDisplay,
            fontSize: "clamp(36px, 6.5vw, 60px)",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            margin: 0,
            color: C.text,
          }}
        >
          Aprende IA visual con el stack <span style={{ color: C.gold }}>real</span>,<br />
          no con cursos genéricos.
        </h1>

        <p
          style={{
            fontSize: 19,
            lineHeight: 1.6,
            color: C.textMid,
            maxWidth: 720,
            margin: "28px 0 12px",
          }}
        >
          6 módulos. 34 microlecciones de 5 a 15 minutos. Higgsfield Soul, Nano Banana Pro, Seedance 2.0, ChatGPT.
          Tu primera pieza decente sale en 90 minutos.
        </p>

        <p style={{ fontSize: 15, color: C.textLow, maxWidth: 720, margin: "0 0 36px" }}>
          Cero relleno motivacional. Cero promesas imposibles. De ahí a venderle a un cliente, depende de ti.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            href="/academia/lead-magnet/mapa-stack-ia-2026"
            style={{
              background: C.gold,
              color: C.bg,
              padding: "14px 28px",
              borderRadius: 4,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "inline-block",
            }}
          >
            Empieza por M1 · Descarga gratis
          </Link>
          <a
            href="#modulos"
            style={{
              border: `1px solid ${C.border}`,
              color: C.text,
              padding: "14px 28px",
              borderRadius: 4,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              display: "inline-block",
            }}
          >
            Ver los 6 módulos
          </a>
        </div>
      </section>

      {/* ─── 3 DIFERENCIALES ──────────────────────────────── */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 80px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              title: "Stack real, no genérico",
              body: "No abstracciones. Higgsfield Soul con reference_id. Nano Banana Pro multi-image. Seedance 2.0 con start/last frame. Lo que se usa cada día.",
            },
            {
              title: "Research-first cinemático",
              body: "Antes de generar, cine real. 5 datos verificables: peli, director, lente, LUT, audio. Sale en cada lección de video.",
            },
            {
              title: "Anti-AI-look",
              body: "Cada pieza pasa Three-Pass Review con 26 markers que detectan el ojo de IA. Lo que el 90% de cursos no enseñan a ver.",
            },
          ].map((d) => (
            <div
              key={d.title}
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                padding: 24,
                borderRadius: 8,
              }}
            >
              <h3
                style={{
                  fontFamily: C.fontDisplay,
                  fontSize: 18,
                  fontWeight: 600,
                  margin: "0 0 12px",
                  color: C.gold,
                }}
              >
                {d.title}
              </h3>
              <p style={{ fontSize: 14, color: C.textMid, margin: 0, lineHeight: 1.6 }}>{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 6 MÓDULOS ────────────────────────────────────── */}
      <section
        id="modulos"
        style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 80px" }}
      >
        <h2
          style={{
            fontFamily: C.fontDisplay,
            fontSize: 32,
            fontWeight: 700,
            margin: "0 0 12px",
            color: C.text,
          }}
        >
          De 0 a 100% en 6 módulos
        </h2>
        <p style={{ fontSize: 16, color: C.textMid, margin: "0 0 36px", maxWidth: 680 }}>
          Cada módulo tiene 4-8 microlecciones, un lead magnet descargable, quiz de validación y un ejercicio
          con resultado entregable. Te registras una vez. Accedes a todo.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MODULES.map((m) => (
            <article
              key={m.id}
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                padding: "20px 24px",
                borderRadius: 8,
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 20,
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: C.fontMono,
                      fontSize: 12,
                      color: C.gold,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {m.id}
                  </span>
                  <h3
                    style={{
                      fontFamily: C.fontDisplay,
                      fontSize: 20,
                      fontWeight: 600,
                      margin: 0,
                      color: C.text,
                    }}
                  >
                    {m.title}
                  </h3>
                  <span
                    style={{
                      fontFamily: C.fontMono,
                      fontSize: 11,
                      color: C.textLow,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {m.range} · {m.lessons} lecciones
                  </span>
                </div>
                <p style={{ fontSize: 14, color: C.textMid, margin: "0 0 8px", lineHeight: 1.55 }}>
                  {m.summary}
                </p>
                <p style={{ fontSize: 12, color: C.textLow, margin: 0, fontFamily: C.fontMono }}>
                  Lead magnet: {m.leadMagnet}
                </p>
              </div>
              <Link
                href={`/academia/lead-magnet/${m.leadMagnetSlug}`}
                style={{
                  border: `1px solid ${C.borderGold}`,
                  color: C.gold,
                  padding: "10px 18px",
                  borderRadius: 4,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Descargar
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ─── ANTI-PROMESAS ────────────────────────────────── */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 80px" }}>
        <div
          style={{
            background: C.bgSoft,
            border: `1px solid ${C.borderGold}`,
            padding: 32,
            borderRadius: 8,
          }}
        >
          <h2
            style={{
              fontFamily: C.fontDisplay,
              fontSize: 22,
              fontWeight: 600,
              margin: "0 0 20px",
              color: C.gold,
            }}
          >
            Qué NO promete Dark Academy
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            <div>
              <h4
                style={{ fontSize: 13, color: C.accent, margin: "0 0 10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                No prometemos
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, color: C.textMid, fontSize: 14, lineHeight: 1.8 }}>
                <li>Ingresos garantizados ni clientes asegurados.</li>
                <li>Plazo rígido para aprender (&quot;en 24h&quot;).</li>
                <li>Que el contenido funcione sin esfuerzo propio.</li>
                <li>Stack de pago incluido. Las herramientas tienen su coste.</li>
              </ul>
            </div>
            <div>
              <h4
                style={{ fontSize: 13, color: C.gold, margin: "0 0 10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                Sí garantizamos
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, color: C.textMid, fontSize: 14, lineHeight: 1.8 }}>
                <li>Acceso permanente al contenido tras registro.</li>
                <li>Lecciones ≤15 min · respetamos tu tiempo.</li>
                <li>Prompts copiables verificados, no inventados.</li>
                <li>Ejercicios con resultado entregable.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────── */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 120px", textAlign: "center" }}>
        <h2
          style={{
            fontFamily: C.fontDisplay,
            fontSize: "clamp(28px, 4vw, 38px)",
            fontWeight: 700,
            margin: "0 0 16px",
            color: C.text,
          }}
        >
          Empieza por el Módulo 1. 8 minutos.
        </h2>
        <p style={{ fontSize: 16, color: C.textMid, margin: "0 0 28px", maxWidth: 560, marginInline: "auto" }}>
          El mapa del stack 2026 te ahorra horas de pruebas. Lo descargas con tu email. Sin tarjeta. Sin compromiso.
        </p>
        <Link
          href="/academia/lead-magnet/mapa-stack-ia-2026"
          style={{
            background: C.gold,
            color: C.bg,
            padding: "16px 36px",
            borderRadius: 4,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            display: "inline-block",
          }}
        >
          Descargar mapa del stack
        </Link>
      </section>
    </main>
  );
}
