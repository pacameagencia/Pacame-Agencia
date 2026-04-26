/**
 * /lucia — Landing pública de PACAME GPT (asistente Lucía).
 *
 * Misión: SEO #1 español para "ChatGPT en español", "alternativa española a
 * ChatGPT", "IA que habla castellano". Conversión a /pacame-gpt/login (trial).
 *
 * Estructura Hormozi-style:
 *   1. Hero brutal con foto Lucía + headline + CTA + sub-CTA
 *   2. Pain section ("ChatGPT en inglés, sin factura, te lía")
 *   3. Solución (5 fricciones eliminadas)
 *   4. Demo embebida (mensajes pre-grabados)
 *   5. Comparativa visual ChatGPT vs PACAME GPT
 *   6. Pricing (free vs premium)
 *   7. FAQs (con schema FAQPage)
 *   8. CTA final
 *
 * Schemas JSON-LD: SoftwareApplication + FAQPage + Organization.
 */

import Link from "next/link";
import type { Metadata } from "next";
import ReferralCapture from "./ReferralCapture";

export const metadata: Metadata = {
  title: "PACAME GPT · El ChatGPT español que habla como tú",
  description:
    "Lucía es la IA española que te redacta emails, traduce, resume y planifica en castellano de calle. Factura ES, voz nativa, hecho en España. 14 días gratis.",
  alternates: { canonical: "https://pacameagencia.com/lucia" },
  keywords: [
    "chatgpt en español",
    "chatgpt español",
    "alternativa española a chatgpt",
    "IA en castellano",
    "asistente IA España",
    "inteligencia artificial española",
    "IA que habla español",
    "chatbot español",
    "lucía IA",
    "PACAME GPT",
  ],
  openGraph: {
    title: "PACAME GPT · El ChatGPT que habla como tú",
    description:
      "Lucía, la IA española hecha en España. Te ayuda a redactar emails, traducir, resumir y mucho más en castellano de calle. 14 días gratis.",
    url: "https://pacameagencia.com/lucia",
    type: "website",
    locale: "es_ES",
    siteName: "PACAME GPT",
  },
  twitter: {
    card: "summary_large_image",
    title: "PACAME GPT · La IA española que habla como tú",
    description:
      "El ChatGPT que habla castellano de calle. 14 días gratis, factura española, 9,90€/mes.",
  },
  robots: { index: true, follow: true },
};

/* ─────────────────────────────────────────────────────────── */
/*                  Schema JSON-LD                             */
/* ─────────────────────────────────────────────────────────── */

const SOFTWARE_APP_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PACAME GPT",
  alternateName: "Lucía",
  description:
    "Asistente IA en español de España hecho por PACAME. Redacta emails, traduce, resume, planifica y mucho más en castellano de calle.",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web Browser",
  url: "https://pacameagencia.com/lucia",
  inLanguage: "es-ES",
  offers: [
    {
      "@type": "Offer",
      name: "Gratis",
      price: "0",
      priceCurrency: "EUR",
      description: "20 mensajes al día sin tarjeta",
    },
    {
      "@type": "Offer",
      name: "Premium",
      price: "9.90",
      priceCurrency: "EUR",
      description: "Mensajes ilimitados, voz castellana, factura española",
      priceValidUntil: "2026-12-31",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "47",
    bestRating: "5",
  },
  publisher: {
    "@type": "Organization",
    name: "PACAME",
    url: "https://pacameagencia.com",
  },
};

const FAQS = [
  {
    q: "¿En qué se diferencia PACAME GPT de ChatGPT?",
    a: "Lucía habla español de España puro (no traducción del inglés), tiene voz castellana nativa, factura en euros con tu NIF y la hicimos en España. ChatGPT es brutal pero te cobra en dólares, mezcla idiomas y a veces suena a manual yanqui. Para el español de a pie, Lucía es más cercana.",
  },
  {
    q: "¿Tengo que pagar para empezar?",
    a: "No. Tienes 14 días gratis sin tarjeta. Después puedes seguir gratis con 20 mensajes al día o pasarte a Premium por 9,90€/mes con factura española. Te das de baja cuando quieras.",
  },
  {
    q: "¿Mis conversaciones son privadas?",
    a: "Sí. Tus conversaciones se guardan solo en tu cuenta y nadie de PACAME las lee salvo que tú las compartas. No las usamos para entrenar modelos.",
  },
  {
    q: "¿Para qué sirve Lucía?",
    a: "Te redacta emails y WhatsApps, traduce texto manteniendo el tono, resume artículos en 3 puntos, te ayuda con la lista de la compra, te prepara entrevistas, te explica una factura, te escribe una reclamación a tu eléctrica. Lo que necesites en el día a día, en español de calle.",
  },
  {
    q: "¿Funciona en el móvil?",
    a: "Sí, está diseñado primero para móvil. Burbujas grandes, voz, todo a un toque. Y es instalable como app desde el navegador (Añadir a pantalla de inicio).",
  },
  {
    q: "¿Hay factura y se puede deducir si soy autónomo?",
    a: "Sí. Cada mes recibes tu factura española con tu NIF y la cuota se desgrava como gasto profesional si la usas para tu negocio.",
  },
  {
    q: "¿Quién está detrás?",
    a: "PACAME, una agencia digital española liderada por Pablo Calleja. Lucía la supervisamos para que no diga tonterías y la afinamos cada semana con el feedback de los usuarios.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "PACAME",
      item: "https://pacameagencia.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "PACAME GPT",
      item: "https://pacameagencia.com/lucia",
    },
  ],
};

/* ─────────────────────────────────────────────────────────── */
/*                       Page                                  */
/* ─────────────────────────────────────────────────────────── */

const DEMO = [
  {
    user: "tengo que mandar un wasap a mi jefe diciendole que mañana no voy porque tengo médico",
    bot: 'Vale. Algo así te sirve:\n"Hola Javi, mañana tengo médico y no podré ir. Le digo a Marta que cubra lo urgente. Cualquier cosa, en el móvil estoy. Gracias 🙌"\n¿Lo quieres más cortito, o le añado algo?',
  },
  {
    user: "cómo se dice 'estoy hasta arriba de trabajo' en inglés",
    bot: 'Lo más natural: "I\'m swamped with work" o "I\'m up to my neck in work".\nMás coloquial: "I\'m drowning in work".\n¿Lo necesitas para email o para hablar?',
  },
  {
    user: "regalo para mi madre, cumple 65, no le gusta lo cursi",
    bot: "Tres ideas que suelen acertar:\n• Una experiencia: spa, comida en sitio bueno, escapada de un día.\n• Algo práctico-bonito: una buena planta de interior con maceta de cerámica.\n• Algo personal: álbum de fotos hecho a mano con momentos del año.\nSi me cuentas qué le gusta hacer, te afino mejor.",
  },
];

const FRICTIONS = [
  {
    bad: "ChatGPT en inglés a medias, traduce raro",
    good: "Lucía habla español de España puro: tuteo, frases cortas, expresiones reales.",
  },
  {
    bad: "Prompting: hay que aprender un arte para que te conteste bien",
    good: "Pantalla de inicio con 4 botones grandes y plantillas pre-rellenadas.",
  },
  {
    bad: "Pricing en USD, suscripción opaca, sin factura española",
    good: "9,90€/mes con IVA y NIF en factura española.",
  },
  {
    bad: "Voz robótica o con acento inglés",
    good: "Voz Lucía castellana nativa, suena humana.",
  },
  {
    bad: "Miedo a meter datos en una app yanqui",
    good: "Servidor en EU, soporte humano vía WhatsApp en España.",
  },
];

const PRICE_FREE = [
  "20 mensajes al día",
  "Acceso a Lucía y atajos de tarea",
  "Conversaciones guardadas 7 días",
  "Sin tarjeta",
];
const PRICE_PREMIUM = [
  "Mensajes ilimitados",
  "Voz Lucía castellana",
  "Historial siempre disponible",
  "PDF, email y recordatorios",
  "Factura española con tu NIF",
  "Soporte prioritario",
];

export default function LuciaLandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4efe3",
        color: "#1a1813",
        fontFamily: "var(--font-instrument-sans), system-ui, sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_APP_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_SCHEMA) }}
      />

      <ReferralCapture />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px 56px",
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 48,
          alignItems: "center",
        }}
        className="lucia-hero"
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 12px",
              background: "rgba(232,183,48,0.18)",
              color: "#9b7714",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            <span style={{ width: 6, height: 6, background: "#9b7714", borderRadius: "50%" }} />
            Hecho en España
          </span>
          <h1
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              margin: "0 0 18px",
              lineHeight: 1.02,
            }}
          >
            El ChatGPT que habla como tú.
          </h1>
          <p
            style={{
              fontSize: "clamp(17px, 1.6vw, 20px)",
              color: "#3a362c",
              lineHeight: 1.55,
              maxWidth: 540,
              margin: "0 0 28px",
            }}
          >
            Lucía es nuestra IA española. Te redacta emails, traduce, resume y
            te echa una mano con cualquier movida del día a día. En castellano de
            calle, sin liarte, con factura en euros.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <Link
              href="/pacame-gpt/login"
              style={{
                background: "#1a1813",
                color: "#f4efe3",
                padding: "16px 26px",
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Empezar 14 días gratis →
            </Link>
            <Link
              href="/pacame-gpt"
              style={{
                background: "transparent",
                color: "#1a1813",
                padding: "16px 22px",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 500,
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              Probar sin cuenta
            </Link>
          </div>
          <p style={{ fontSize: 13, color: "#6e6858", margin: 0 }}>
            Sin tarjeta. Después 9,90€/mes ilimitado o sigues gratis con 20
            mensajes al día.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              position: "relative",
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #b54e30 0%, #e8b730 100%)",
              boxShadow: "0 30px 70px rgba(181,78,48,0.25)",
              overflow: "hidden",
            }}
          >
            <img
              src="/asistente/lucia.png"
              alt="Lucía, asistente IA española de PACAME"
              loading="eager"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 180,
                fontWeight: 600,
                color: "rgba(244,239,227,0.9)",
                pointerEvents: "none",
              }}
              aria-hidden="true"
            >
              L
            </div>
          </div>
        </div>
      </section>

      {/* ── Pain → Solución ───────────────────────────────────── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>5 fricciones de ChatGPT, resueltas</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
            marginTop: 32,
          }}
        >
          {FRICTIONS.map((f, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(26,24,19,0.08)",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <div style={{ color: "#9c3e24", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                ✗ {f.bad}
              </div>
              <div style={{ color: "#555f28", fontSize: 14, lineHeight: 1.5 }}>
                ✓ {f.good}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo embebida ─────────────────────────────────────── */}
      <section style={{ ...sectionStyle, background: "#f9f5ea" }}>
        <h2 style={h2Style}>Esto te dice Lucía</h2>
        <p style={{ color: "#3a362c", textAlign: "center", marginTop: 6, fontSize: 15 }}>
          Tres ejemplos reales. Sin maquillaje.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 30,
          }}
        >
          {DEMO.map((d, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                borderRadius: 18,
                padding: 18,
                boxShadow: "0 4px 18px rgba(26,24,19,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "85%",
                  background: "#b54e30",
                  color: "#f9f5ea",
                  padding: "8px 14px",
                  borderRadius: 16,
                  borderTopRightRadius: 6,
                  fontSize: 14,
                  lineHeight: 1.45,
                }}
              >
                {d.user}
              </div>
              <div
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "92%",
                  background: "#f4efe3",
                  padding: "10px 14px",
                  borderRadius: 16,
                  borderTopLeftRadius: 6,
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {d.bot}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <Link
            href="/pacame-gpt"
            style={{
              background: "#1a1813",
              color: "#f4efe3",
              padding: "14px 22px",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Probar Lucía gratis →
          </Link>
        </div>
      </section>

      {/* ── Comparativa ───────────────────────────────────────── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>PACAME GPT vs ChatGPT</h2>
        <div
          style={{
            marginTop: 28,
            background: "#ffffff",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(26,24,19,0.08)",
          }}
        >
          <ComparativaRow header label="" left="ChatGPT" right="PACAME GPT" />
          <ComparativaRow label="Idioma nativo" left="Inglés (traduce)" right="Español de España" />
          <ComparativaRow label="Voz" left="Genérica" right="Castellana (Elvira)" />
          <ComparativaRow label="Factura" left="USD, EE.UU." right="EUR, factura española con NIF" />
          <ComparativaRow label="Pricing Plus" left="23€/mes" right="9,90€/mes" />
          <ComparativaRow label="Trial" left="—" right="14 días gratis sin tarjeta" />
          <ComparativaRow label="Acciones reales" left="Solo texto" right="PDF, email, recordatorios" />
          <ComparativaRow label="Soporte" left="Tickets en inglés" right="WhatsApp humano en España" />
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section style={{ ...sectionStyle, background: "#f9f5ea" }} id="pricing">
        <h2 style={h2Style}>Pruébalo. Si te sirve, te quedas.</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
            maxWidth: 720,
            margin: "32px auto 0",
          }}
        >
          <PricingCard
            title="Gratis"
            price="0€"
            period="para siempre"
            features={PRICE_FREE}
            ctaLabel="Empezar gratis"
            ctaHref="/pacame-gpt/login"
          />
          <PricingCard
            highlighted
            title="Premium"
            price="9,90€"
            period="al mes · IVA incluido"
            features={PRICE_PREMIUM}
            ctaLabel="Probar 14 días gratis"
            ctaHref="/pacame-gpt/login"
            badge="Recomendado"
          />
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Preguntas que nos hacéis</h2>
        <div style={{ maxWidth: 720, margin: "32px auto 0", display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQS.map((f, i) => (
            <details
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(26,24,19,0.08)",
                borderRadius: 14,
                padding: "14px 18px",
              }}
            >
              <summary
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                  listStyle: "none",
                }}
              >
                {f.q}
              </summary>
              <p style={{ fontSize: 14, color: "#3a362c", lineHeight: 1.55, marginTop: 10 }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────── */}
      <section
        style={{
          ...sectionStyle,
          background: "linear-gradient(135deg, #b54e30 0%, #9c3e24 100%)",
          color: "#f9f5ea",
          textAlign: "center",
        }}
      >
        <h2 style={{ ...h2Style, color: "#f9f5ea" }}>
          Tu IA en español, en 30 segundos.
        </h2>
        <p style={{ fontSize: 16, opacity: 0.92, maxWidth: 520, margin: "12px auto 24px" }}>
          14 días gratis sin tarjeta. Después 9,90€/mes o sigues gratis con 20
          mensajes al día. Te das de baja cuando quieras.
        </p>
        <Link
          href="/pacame-gpt/login"
          style={{
            background: "#f9f5ea",
            color: "#7a2e18",
            padding: "16px 28px",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
          }}
        >
          Empezar gratis ahora →
        </Link>
      </section>

      <footer
        style={{
          padding: "32px 24px",
          textAlign: "center",
          color: "#6e6858",
          fontSize: 13,
          borderTop: "1px solid rgba(26,24,19,0.06)",
        }}
      >
        <p style={{ margin: "0 0 8px" }}>
          PACAME GPT, hecho en España por{" "}
          <Link href="/" style={{ color: "#9c3e24" }}>
            PACAME
          </Link>
          .
        </p>
        <p style={{ margin: 0, fontSize: 12 }}>
          <Link href="/lucia/que-es" style={{ color: "#6e6858", marginRight: 14 }}>
            ¿Qué es?
          </Link>
          <Link href="/lucia/vs-chatgpt" style={{ color: "#6e6858", marginRight: 14 }}>
            vs ChatGPT
          </Link>
          <Link href="/lucia/para-autonomos" style={{ color: "#6e6858", marginRight: 14 }}>
            Para autónomos
          </Link>
          <Link href="/privacidad" style={{ color: "#6e6858" }}>
            Privacidad
          </Link>
        </p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .lucia-hero { grid-template-columns: 1fr !important; padding: 48px 20px 32px !important; gap: 32px !important; }
          .lucia-hero > div:last-child > div { width: 240px !important; height: 240px !important; }
          .lucia-hero h1 { font-size: 38px !important; }
        }
      `}</style>
    </main>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: "60px 24px",
  maxWidth: 1100,
  margin: "0 auto",
};

const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-fraunces), Georgia, serif",
  fontSize: "clamp(28px, 4vw, 40px)",
  fontWeight: 500,
  letterSpacing: "-0.02em",
  textAlign: "center",
  margin: 0,
};

function ComparativaRow({
  label,
  left,
  right,
  header,
}: {
  label: string;
  left: string;
  right: string;
  header?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr 1fr",
        padding: "14px 20px",
        borderTop: header ? "none" : "1px solid rgba(26,24,19,0.06)",
        background: header ? "#ebe3d0" : "transparent",
        fontWeight: header ? 700 : 400,
        fontSize: 14,
      }}
    >
      <div style={{ color: header ? "#1a1813" : "#6e6858" }}>{label}</div>
      <div style={{ color: header ? "#1a1813" : "#9c3e24" }}>{left}</div>
      <div
        style={{
          color: header ? "#1a1813" : "#555f28",
          fontWeight: header ? 700 : 600,
        }}
      >
        {right}
      </div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  period,
  features,
  ctaLabel,
  ctaHref,
  highlighted,
  badge,
}: {
  title: string;
  price: string;
  period: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <div
      style={{
        background: highlighted ? "#1a1813" : "#ffffff",
        color: highlighted ? "#f4efe3" : "#1a1813",
        borderRadius: 16,
        padding: "26px 24px 24px",
        border: highlighted ? "none" : "1px solid rgba(26,24,19,0.08)",
        position: "relative",
      }}
    >
      {badge && (
        <span
          style={{
            position: "absolute",
            top: -10,
            right: 18,
            background: "#e8b730",
            color: "#1a1813",
            padding: "4px 12px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {badge}
        </span>
      )}
      <div
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: 22,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: 38,
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        {price}
      </div>
      <div
        style={{
          fontSize: 13,
          color: highlighted ? "rgba(244,239,227,0.7)" : "#6e6858",
          marginBottom: 18,
        }}
      >
        {period}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
        {features.map((f) => (
          <li
            key={f}
            style={{
              fontSize: 14,
              padding: "6px 0",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <span aria-hidden style={{ color: highlighted ? "#e8b730" : "#9c3e24", fontWeight: 700 }}>
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        style={{
          display: "block",
          textAlign: "center",
          background: highlighted ? "#e8b730" : "#1a1813",
          color: highlighted ? "#1a1813" : "#f4efe3",
          padding: "13px 18px",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
