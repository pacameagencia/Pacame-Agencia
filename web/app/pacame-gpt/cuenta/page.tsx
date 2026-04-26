/**
 * /pacame-gpt/cuenta — Estado de la cuenta + upgrade a Premium.
 *
 * Server component que requiere sesión (redirige a /pacame-gpt/login si no).
 * Muestra:
 *   - Email + nombre
 *   - Plan actual (Gratis / Trial X días / Premium)
 *   - Mensajes consumidos hoy / límite
 *   - Botón "Pasar a Premium" → POST /api/products/pacame-gpt/checkout
 *   - Logout
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProductUser } from "@/lib/products/session";
import {
  daysLeftInTrial,
  getActiveSubscription,
  isSubscriptionActive,
} from "@/lib/products/subscriptions";
import { createServerSupabase } from "@/lib/supabase/server";
import CuentaActions from "./CuentaActions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PRODUCT_ID = "pacame-gpt";
const FREE_DAILY_LIMIT = 20;

export default async function CuentaPage() {
  const user = await getCurrentProductUser();
  if (!user) redirect("/pacame-gpt/login");

  const sub = await getActiveSubscription(user.id, PRODUCT_ID);
  const supabase = createServerSupabase();
  const today = todayMadrid();
  const { data: usage } = await supabase
    .from("pacame_gpt_daily_usage")
    .select("messages_count")
    .eq("user_id", user.id)
    .eq("day", today)
    .maybeSingle();

  const dailyUsed = usage?.messages_count ?? 0;
  const active = sub ? isSubscriptionActive(sub) : false;
  const daysLeft = sub ? daysLeftInTrial(sub) : null;

  // Etiqueta humana del plan actual.
  const planLabel = active
    ? sub?.status === "trialing"
      ? `Trial Premium · ${daysLeft} días restantes`
      : "Premium · ilimitado"
    : "Gratis · 20 mensajes al día";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4efe3",
        color: "#1a1813",
        padding: "32px 18px 64px",
        fontFamily: "var(--font-instrument-sans), system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <Link
            href="/pacame-gpt"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#1a1813", textDecoration: "none", fontSize: 14 }}
          >
            <span aria-hidden>←</span> Volver al chat
          </Link>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#b54e30,#e8b730)",
              color: "#f4efe3",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontWeight: 600,
            }}
          >
            L
          </span>
        </header>

        <h1
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "clamp(28px, 5vw, 38px)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            margin: "0 0 4px",
          }}
        >
          Tu cuenta
        </h1>
        <p style={{ color: "#6e6858", fontSize: 15, marginTop: 0 }}>
          Hola, {user.full_name || user.email.split("@")[0]} 👋
        </p>

        <section
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "20px 22px",
            marginTop: 24,
            border: "1px solid rgba(26,24,19,0.06)",
          }}
        >
          <Field label="Email" value={user.email} />
          <Field label="Plan" value={planLabel} accent={active} />
          <Field
            label="Hoy"
            value={
              active
                ? `${dailyUsed} mensajes (sin límite)`
                : `${dailyUsed} de ${FREE_DAILY_LIMIT} mensajes`
            }
          />
          {sub?.status === "trialing" && daysLeft !== null && (
            <p style={{ fontSize: 13, color: "#6e6858", marginTop: 12 }}>
              Cuando acabe el trial, podrás seguir gratis con 20 mensajes al día o
              pasarte a Premium.
            </p>
          )}
        </section>

        {!active && (
          <section
            style={{
              marginTop: 18,
              background: "linear-gradient(135deg, #b54e30 0%, #9c3e24 100%)",
              color: "#f9f5ea",
              borderRadius: 16,
              padding: "22px 22px 18px",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 22,
                margin: "0 0 6px",
                fontWeight: 600,
              }}
            >
              Hazte Premium
            </h2>
            <p style={{ fontSize: 14, opacity: 0.92, margin: "0 0 14px" }}>
              Mensajes ilimitados, voz de Lucía y prioridad. 9,90€/mes con factura
              española. Te das de baja cuando quieras.
            </p>
            <ul style={{ margin: "0 0 16px", paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
              <li>Sin límite de mensajes diarios</li>
              <li>Voz Lucía para escuchar respuestas</li>
              <li>Historial completo siempre disponible</li>
              <li>Factura ES con tu NIF</li>
            </ul>
            <CuentaActions
              productId={PRODUCT_ID}
              tier="premium"
              priceLabel="9,90€/mes"
            />
          </section>
        )}

        <section style={{ marginTop: 24, textAlign: "center" }}>
          <CuentaLogout />
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid rgba(26,24,19,0.06)",
      }}
    >
      <span style={{ fontSize: 13, color: "#6e6858" }}>{label}</span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: accent ? "#9c3e24" : "#1a1813",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Cliente para el botón de logout (necesita fetch + redirect).
function CuentaLogout() {
  return (
    <form action="/api/products/auth/logout" method="POST">
      <button
        type="submit"
        style={{
          background: "transparent",
          border: "none",
          color: "#6e6858",
          fontSize: 13,
          cursor: "pointer",
          textDecoration: "underline",
          fontFamily: "inherit",
        }}
      >
        Cerrar sesión
      </button>
    </form>
  );
}

function todayMadrid(): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" })
  );
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
