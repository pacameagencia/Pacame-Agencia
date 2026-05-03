/**
 * DarkRoom · Landing pública.
 *
 * Servida en `darkroomcreative.cloud/` (rewrite middleware).
 * Copy alineado con `strategy/darkroom/landing-copy-v1.md` v3.
 *
 * Server component (cero JS shipped salvo el cookie banner del layout).
 * Inline styles — no depende de Tailwind config DarkRoom para ser plug-and-play
 * cuando se migre al repo dedicado en el futuro.
 *
 * Voz: directa, cómplice, honesta sobre membresía colectiva.
 * Cero emojis fuego, cero superlativos vacíos, cero menciones a PACAME ni
 * nombres propios (regla `proteccion-identidad.md`).
 */

import { ensureDarkRoomHost } from "@/lib/darkroom/host-guard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DarkRoom · Stack creativo premium por 29€/mes",
  description:
    "Acceso colectivo al stack creativo premium (Adobe, Figma, ChatGPT, Midjourney…) por 29€/mes en lugar de 240€. 14 días gratis sin tarjeta.",
};

const C = {
  bg: "#0A0A0A",
  bgSoft: "#141414",
  bgCard: "#161616",
  border: "rgba(255,255,255,0.08)",
  borderSoft: "rgba(255,255,255,0.04)",
  text: "#F5F5F0",
  textMid: "#A1A1AA",
  textLow: "#71717A",
  accent: "#E11D48",
  accentSoft: "rgba(225,29,72,0.15)",
  ok: "#4ADE80",
  fontDisplay:
    '"Space Grotesk", Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontBody: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontMono:
    '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

const TRIAL_HREF =
  "mailto:support@darkroomcreative.cloud?subject=Quiero%20empezar%20trial%20DarkRoom%2014%20d%C3%ADas&body=Hola%2C%20quiero%20probar%20DarkRoom%20Pro%2014%20d%C3%ADas%20gratis%20sin%20tarjeta.%20Mi%20stack%20actual%20es%3A%20...";

export default async function DarkRoomHomePage() {
  await ensureDarkRoomHost();

  return (
    <main>
      {/* HERO */}
      <section
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "96px 24px 64px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 999,
            background: C.accentSoft,
            border: `1px solid ${C.accent}`,
            color: C.accent,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: C.accent,
              boxShadow: `0 0 8px ${C.accent}`,
            }}
          />
          Membresía colectiva
        </div>
        <h1
          style={{
            fontFamily: C.fontDisplay,
            fontSize: "clamp(38px, 7vw, 68px)",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            margin: 0,
            color: C.text,
          }}
        >
          Tu stack creativo premium
          <br />
          <span style={{ color: C.accent }}>pesa más que tu alquiler.</span>
        </h1>
        <p
          style={{
            fontSize: 18,
            color: C.textMid,
            margin: "28px 0 36px",
            maxWidth: 640,
            lineHeight: 1.55,
          }}
        >
          240€ al mes en Adobe, Figma, ChatGPT, Midjourney y compañía no es
          sostenible cuando estás empezando. DarkRoom te da acceso al stack
          completo por <strong style={{ color: C.text }}>29€/mes</strong>{" "}
          mediante membresía colectiva.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <a
            href={TRIAL_HREF}
            style={{
              display: "inline-block",
              background: C.accent,
              color: C.text,
              fontWeight: 600,
              padding: "14px 28px",
              borderRadius: 999,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            Empezar 14 días gratis →
          </a>
          <a
            href="#como-funciona"
            style={{
              color: C.textMid,
              textDecoration: "none",
              padding: "14px 16px",
              fontSize: 14,
            }}
          >
            Cómo funciona
          </a>
        </div>
        <p style={{ fontSize: 13, color: C.textLow, marginTop: 16 }}>
          Sin tarjeta. Sin renovación automática silenciosa. Cancelas cuando quieras.
        </p>
      </section>

      {/* PARA QUIÉN */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "48px 24px" }}>
        <h2 style={sectionH2()}>
          Construido para creators que no tienen presupuesto de agencia.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 32,
          }}
        >
          {[
            {
              title: "Diseñador freelance",
              body:
                "Llevas 2 años facturando en serio. Cobras 35€/h y tu stack se come 1 hora cada día solo en pagar las suscripciones.",
            },
            {
              title: "Estudiante avanzado",
              body:
                "Necesitas el stack premium para tu portfolio pero pagar 240€/mes no es opción cuando vives con tus padres.",
            },
            {
              title: "Marketer o creator visual",
              body:
                "Pagas Adobe solo para editar 3 imágenes al mes. Es absurdo.",
            },
          ].map((p) => (
            <div
              key={p.title}
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: "20px 22px",
              }}
            >
              <h3
                style={{
                  fontFamily: C.fontDisplay,
                  fontSize: 16,
                  fontWeight: 600,
                  margin: "0 0 8px",
                  color: C.text,
                }}
              >
                {p.title}
              </h3>
              <p style={{ margin: 0, color: C.textMid, fontSize: 14 }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* LO QUE INCLUYE */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "48px 24px" }}>
        <h2 style={sectionH2()}>El stack que el mercado realmente usa. Sin recortes.</h2>
        <p
          style={{
            color: C.textMid,
            margin: "12px 0 28px",
            maxWidth: 620,
            fontSize: 15,
          }}
        >
          No te damos alternativas open-source ni tools de segunda. Acceso al
          mismo stack que pagaría una agencia bien establecida.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {[
            { cat: "Edición de imagen pro", plan: "Incluido" },
            { cat: "Diseño UI/UX pro", plan: "Incluido" },
            { cat: "Diseño vectorial pro", plan: "Incluido" },
            { cat: "Edición video pro", plan: "Incluido" },
            { cat: "Motion graphics 2D", plan: "Pro+" },
            { cat: "3D y modelado", plan: "Studio" },
            { cat: "IA conversacional pro", plan: "Incluido" },
            { cat: "IA imagen (Midjourney y otros)", plan: "Incluido" },
            { cat: "IA video y voz", plan: "Pro / Studio" },
            { cat: "Stock visual y plantillas", plan: "Incluido" },
            { cat: "Tipografía profesional", plan: "Incluido" },
            { cat: "Cloud storage", plan: "Incluido" },
          ].map((it) => (
            <div
              key={it.cat}
              style={{
                background: C.bgSoft,
                border: `1px solid ${C.borderSoft}`,
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 13,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: C.text }}>{it.cat}</span>
              <span style={{ color: it.plan === "Incluido" ? C.ok : C.textLow, fontSize: 11 }}>
                {it.plan}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: C.textLow, marginTop: 24 }}>
          La oferta concreta de recursos puede variar para garantizar la
          sostenibilidad de la membresía colectiva. Te informamos de cualquier
          cambio con 15 días de antelación.
        </p>
      </section>

      {/* COMPARATIVA PRECIO */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <h2 style={sectionH2()}>Las matemáticas son las matemáticas.</h2>
        <div
          style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            overflow: "hidden",
            marginTop: 24,
          }}
        >
          {[
            ["Edición imagen pro", "23 €/mes"],
            ["Diseño UI/UX pro", "15 €/mes"],
            ["Diseño vectorial pro", "23 €/mes"],
            ["Stock visual pro", "12 €/mes"],
            ["Edición video pro", "23 €/mes"],
            ["IA conversacional pro", "22 €/mes"],
            ["IA imagen — Midjourney", "28 €/mes"],
            ["Tipografía profesional", "16 €/mes"],
            ["Motion 2D pro", "20 €/mes"],
            ["Vídeo IA y voz IA", "60 €/mes"],
          ].map(([label, price], i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                padding: "10px 18px",
                borderBottom: `1px solid ${C.borderSoft}`,
                fontSize: 14,
                color: C.textMid,
              }}
            >
              <span>{label}</span>
              <span style={{ fontFamily: C.fontMono, fontSize: 13 }}>{price}</span>
            </div>
          ))}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              padding: "16px 18px",
              fontSize: 16,
              borderTop: `2px solid ${C.border}`,
              color: C.text,
              fontWeight: 600,
            }}
          >
            <span>Total retail mensual</span>
            <span style={{ fontFamily: C.fontMono }}>240 €/mes</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              padding: "16px 18px",
              background: C.accentSoft,
              fontSize: 18,
              color: C.text,
              fontWeight: 700,
            }}
          >
            <span>DarkRoom Pro</span>
            <span style={{ fontFamily: C.fontMono }}>29 €/mes</span>
          </div>
        </div>
        <p style={{ fontSize: 14, color: C.textMid, marginTop: 16, textAlign: "center" }}>
          Ahorro: <strong style={{ color: C.text }}>211 €/mes</strong> ·{" "}
          <strong style={{ color: C.text }}>2.532 €/año</strong>
        </p>
      </section>

      {/* CÓMO FUNCIONA */}
      <section
        id="como-funciona"
        style={{ maxWidth: 980, margin: "0 auto", padding: "64px 24px" }}
      >
        <h2 style={sectionH2()}>3 pasos. 12 minutos. Sin instalaciones raras.</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 32,
          }}
        >
          {[
            {
              n: "01",
              t: "Eliges tu plan",
              b: "Starter, Pro o Studio. Pagas mensual o anual. 14 días gratis sin tarjeta para que pruebes antes.",
            },
            {
              n: "02",
              t: "Recibes tus accesos",
              b: "Te llegan las credenciales gestionadas en menos de 24h. Cada herramienta tiene su flujo de acceso, te lo explicamos paso a paso.",
            },
            {
              n: "03",
              t: "Trabajas como siempre",
              b: "Usas las apps en tu equipo o navegador. Una sesión activa por persona — el sistema avisa si entras desde otro sitio.",
            },
          ].map((s) => (
            <div
              key={s.n}
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: "22px 22px 26px",
              }}
            >
              <span
                style={{
                  fontFamily: C.fontMono,
                  fontSize: 12,
                  color: C.accent,
                  letterSpacing: "0.05em",
                }}
              >
                {s.n}
              </span>
              <h3
                style={{
                  fontFamily: C.fontDisplay,
                  fontSize: 17,
                  fontWeight: 600,
                  margin: "8px 0 8px",
                  color: C.text,
                }}
              >
                {s.t}
              </h3>
              <p style={{ margin: 0, color: C.textMid, fontSize: 14 }}>{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HONESTIDAD LEGAL */}
      <section
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "64px 24px",
        }}
      >
        <div
          style={{
            background: C.bgSoft,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "32px 28px",
          }}
        >
          <h2 style={{ ...sectionH2(), margin: "0 0 16px" }}>
            Te explicamos el modelo. Sin letra pequeña.
          </h2>
          <p style={{ color: C.textMid, fontSize: 15, margin: "0 0 14px" }}>
            DarkRoom no revende licencias. No te entrega tu propia cuenta de
            Adobe ni de Figma.
          </p>
          <p style={{ color: C.textMid, fontSize: 15, margin: "0 0 14px" }}>
            Operamos como <strong style={{ color: C.text }}>membresía colectiva</strong>:
            un grupo de creators comparte el coste de un stack profesional
            gestionado. Tú pagas tu cuota mensual; nosotros gestionamos las
            cuentas, la rotación, la disponibilidad y el soporte.
          </p>
          <p style={{ color: C.textMid, fontSize: 15, margin: "0 0 14px" }}>
            Tu obligación: usarlo tú mismo, no compartirlo, no automatizar ni
            revender. Tu derecho: trabajar con un stack premium real por una
            fracción del coste.
          </p>
          <p style={{ color: C.textMid, fontSize: 15, margin: "0 0 18px" }}>
            Es un modelo en zona gris dentro de los términos de algunos
            proveedores. <strong style={{ color: C.text }}>Lo asumimos nosotros</strong>,
            no tú. Si un proveedor cambia las reglas y deja de funcionar una
            herramienta, te avisamos con 15 días, te ofrecemos alternativa o te
            prorrateamos el reembolso.
          </p>
          <p
            style={{
              color: C.textLow,
              fontSize: 13,
              margin: 0,
              borderTop: `1px solid ${C.border}`,
              paddingTop: 14,
            }}
          >
            Si necesitas licencias 100% limpias para una empresa con auditorías
            o contratos enterprise, DarkRoom <strong>no es para ti</strong>. Te
            recomendamos pagar retail directamente.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "48px 24px" }}>
        <h2 style={sectionH2()}>Eliges según tu uso real. Subes o bajas cuando quieras.</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 32,
          }}
        >
          {[
            {
              name: "Starter",
              price: "15 €",
              year: "144 €/año",
              tag: "Para empezar",
              feats: [
                "Edición imagen pro",
                "Diseño UI/UX pro",
                "Stock visual pro",
                "IA conversacional básica",
                "Soporte 48h",
              ],
              highlight: false,
            },
            {
              name: "Pro",
              price: "29 €",
              year: "279 €/año",
              tag: "El stack completo (recomendado)",
              feats: [
                "Todo lo de Starter",
                "Diseño vectorial pro",
                "Edición video pro",
                "IA conversacional pro",
                "IA imagen (Midjourney)",
                "Tipografía profesional",
                "Motion 2D pro",
                "Soporte 24h",
              ],
              highlight: true,
            },
            {
              name: "Studio",
              price: "49 €",
              year: "469 €/año",
              tag: "Power user / micro-equipo",
              feats: [
                "Todo lo de Pro",
                "3D y modelado",
                "IA video y voz",
                "2 sesiones simultáneas",
                "Soporte prioritario 12h",
                "Onboarding personalizado",
              ],
              highlight: false,
            },
          ].map((p) => (
            <div
              key={p.name}
              style={{
                background: p.highlight ? C.bgCard : C.bgSoft,
                border: `1px solid ${p.highlight ? C.accent : C.border}`,
                borderRadius: 14,
                padding: "24px 22px 28px",
                position: "relative",
                ...(p.highlight ? { boxShadow: `0 0 0 1px ${C.accent}, 0 12px 32px rgba(225,29,72,0.10)` } : {}),
              }}
            >
              {p.highlight && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    left: 22,
                    background: C.accent,
                    color: C.text,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  Recomendado
                </span>
              )}
              <h3
                style={{
                  fontFamily: C.fontDisplay,
                  fontSize: 22,
                  fontWeight: 700,
                  margin: "0 0 4px",
                  color: C.text,
                }}
              >
                {p.name}
              </h3>
              <p style={{ color: C.textLow, fontSize: 13, margin: "0 0 16px" }}>{p.tag}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span
                  style={{
                    fontFamily: C.fontDisplay,
                    fontSize: 36,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  {p.price}
                </span>
                <span style={{ color: C.textMid, fontSize: 14 }}>/mes</span>
              </div>
              <p style={{ color: C.textLow, fontSize: 12, margin: "0 0 18px" }}>o {p.year} <span style={{ color: C.ok }}>(−20%)</span></p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px" }}>
                {p.feats.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontSize: 13,
                      color: C.textMid,
                      padding: "6px 0",
                      borderBottom: `1px solid ${C.borderSoft}`,
                    }}
                  >
                    · {f}
                  </li>
                ))}
              </ul>
              <a
                href={TRIAL_HREF}
                style={{
                  display: "block",
                  textAlign: "center",
                  background: p.highlight ? C.accent : "transparent",
                  border: `1px solid ${p.highlight ? C.accent : C.border}`,
                  color: C.text,
                  fontWeight: 600,
                  padding: "12px 18px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                Empezar gratis 14 días
              </a>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: C.textLow, marginTop: 20, textAlign: "center" }}>
          Cancelas con un clic desde tu panel. Reembolso pro-rata si decides
          bajarte. Cero llamadas a comerciales.
        </p>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px" }}>
        <h2 style={sectionH2()}>Lo que la gente pregunta antes de pagar.</h2>
        <div style={{ marginTop: 24 }}>
          {[
            {
              q: "¿Es legal?",
              a: "Estamos en zona gris dentro de los términos de servicio de algunos proveedores, pero no infringimos legislación civil ni penal en España. Operamos como membresía colectiva, no como reventa de licencias. El riesgo principal es operativo (que un proveedor decida bloquear cuentas compartidas), no legal para ti como Miembro.",
            },
            {
              q: "¿Las cuentas son mías?",
              a: "No. Son cuentas colectivas gestionadas. Tú accedes con credenciales que rotamos según las reglas de la membresía. Si guardas archivos en la nube de la herramienta, te recomendamos exportarlos también a tu propio almacenamiento.",
            },
            {
              q: "¿Funciona si la cuenta cae?",
              a: "Si una herramienta concreta cae temporalmente, en menos de 2 horas te asignamos acceso alternativo. Si una herramienta cae permanentemente, te avisamos con 15 días y te damos alternativa o reembolso prorrateado.",
            },
            {
              q: "¿Y si comparto con mi pareja / amigo / hermano?",
              a: "El sistema lo detecta y suspendemos la membresía sin reembolso. Es la regla que protege al resto de Miembros: cuanta más gente comparta, más rápido se cae el modelo para todos.",
            },
            {
              q: "¿Cómo cancelo?",
              a: "Desde tu panel. Un click. Sin llamadas, sin formularios. La cancelación es efectiva al final de tu ciclo pagado.",
            },
            {
              q: "¿De dónde sois?",
              a: "España. Soporte en español nativo. Servidores en Frankfurt (UE, GDPR). El equipo es pequeño, transparente y operativo.",
            },
          ].map((f) => (
            <details
              key={f.q}
              style={{
                borderTop: `1px solid ${C.border}`,
                padding: "16px 0",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  color: C.text,
                  fontFamily: C.fontDisplay,
                  fontWeight: 500,
                  fontSize: 15,
                  listStyle: "none",
                }}
              >
                {f.q}
              </summary>
              <p
                style={{
                  marginTop: 12,
                  color: C.textMid,
                  fontSize: 14,
                  lineHeight: 1.65,
                }}
              >
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "64px 24px",
          textAlign: "center",
        }}
      >
        <h2 style={{ ...sectionH2(), maxWidth: "none" }}>
          Si llevas 200€/mes de stack y dudas si saltar — la respuesta suele ser sí.
        </h2>
        <p style={{ color: C.textMid, fontSize: 16, margin: "16px auto 28px", maxWidth: 560 }}>
          14 días gratis. Sin tarjeta. Si no es para ti, no haces nada y
          desaparece. Si te ahorra 2.500€/año, te sumas.
        </p>
        <a
          href={TRIAL_HREF}
          style={{
            display: "inline-block",
            background: C.accent,
            color: C.text,
            fontWeight: 600,
            padding: "16px 36px",
            borderRadius: 999,
            textDecoration: "none",
            fontSize: 16,
            boxShadow: `0 0 0 0 ${C.accent}`,
          }}
        >
          Empezar mi prueba gratuita →
        </a>
        <p style={{ fontSize: 13, color: C.textLow, marginTop: 16 }}>
          Te llegan los accesos en menos de 24h. Soporte humano en español.
        </p>
      </section>

      {/* FOOTER v3 — minimalista, sin link legal visible */}
      <footer
        style={{
          borderTop: `1px solid ${C.border}`,
          padding: "32px 24px",
          textAlign: "center",
          color: C.textLow,
          fontSize: 13,
          marginTop: 64,
        }}
      >
        <p style={{ margin: "4px 0" }}>
          <a
            href="/"
            style={{ color: C.textMid, textDecoration: "none" }}
          >
            darkroomcreative.cloud
          </a>
        </p>
        <p style={{ margin: "4px 0" }}>
          soporte:{" "}
          <a
            href="mailto:support@darkroomcreative.cloud"
            style={{ color: C.textMid, textDecoration: "none" }}
          >
            support@darkroomcreative.cloud
          </a>
        </p>
      </footer>
    </main>
  );
}

function sectionH2(): React.CSSProperties {
  return {
    fontFamily: C.fontDisplay,
    fontSize: "clamp(24px, 3.5vw, 34px)",
    fontWeight: 700,
    letterSpacing: "-0.015em",
    lineHeight: 1.2,
    margin: 0,
    color: C.text,
    maxWidth: 720,
  };
}
