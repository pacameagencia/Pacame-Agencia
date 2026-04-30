/**
 * Panel afiliado DarkRoom Crew · /crew/dashboard?code=<CODE>
 *
 * Server component · llama internamente al endpoint dashboard.
 * Sin auth: el code mismo es el secreto compartido (last-touch attribution).
 */

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  computeTier,
  computeMonthlyRecurring,
  refsToNextTier,
  TIERS,
  type TierKey,
} from "@/lib/darkroom/crew-tiers";
import CopyRefLink from "./CopyRefLink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AffRow {
  code: string;
  name: string;
  status: string;
  tier_current: TierKey;
  refs_active_count: number;
  pending_balance_cents: number;
  total_one_time_paid_cents: number;
  total_recurring_paid_cents: number;
  last_tier_change_at: string | null;
}

interface RefRow {
  referred_email: string;
  plan: string;
  started_at: string;
  status: string;
  one_time_paid: boolean;
}

interface PayoutRow {
  period: string;
  total_cents: number;
  status: string;
  paid_at: string | null;
}

const CODE_RE = /^[a-z0-9-]{4,48}$/;

function anonymizeEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const localMasked = local.length <= 1 ? "***" : `${local[0]}***`;
  return `${localMasked}@***`;
}

export default async function CrewDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = (params.code ?? "").trim().toLowerCase();
  if (!code || !CODE_RE.test(code)) {
    redirect("/crew");
  }

  const supabase = createServerSupabase();
  const { data: aff } = await supabase
    .from("darkroom_affiliates")
    .select(
      "code, name, status, tier_current, refs_active_count, pending_balance_cents, total_one_time_paid_cents, total_recurring_paid_cents, last_tier_change_at"
    )
    .eq("code", code)
    .maybeSingle();

  if (!aff) {
    return (
      <div style={pageWrap}>
        <div style={{ ...card, textAlign: "center" }}>
          <h1 style={h1Style}>Code no encontrado</h1>
          <p style={{ color: "#888" }}>
            ¿Querías registrarte? <a href="/crew" style={{ color: "#CFFF00" }}>Únete al Crew</a>.
          </p>
        </div>
      </div>
    );
  }

  const a = aff as AffRow;

  const { data: refsRaw } = await supabase
    .from("darkroom_referrals")
    .select("referred_email, plan, started_at, status, one_time_paid")
    .eq("affiliate_code", code)
    .order("started_at", { ascending: false })
    .limit(10);

  const { data: payoutsRaw } = await supabase
    .from("darkroom_payouts")
    .select("period, total_cents, status, paid_at")
    .eq("affiliate_code", code)
    .order("period", { ascending: false })
    .limit(6);

  const refs = (refsRaw ?? []) as RefRow[];
  const payouts = (payoutsRaw ?? []) as PayoutRow[];
  const tier = computeTier(a.refs_active_count);
  const refsToNext = refsToNextTier(a.refs_active_count);
  const monthlyEstimate = computeMonthlyRecurring(a.refs_active_count);
  const lifetimePaid = a.total_one_time_paid_cents + a.total_recurring_paid_cents;

  return (
    <div style={pageWrap}>
      <header style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#CFFF00",
            marginBottom: 4,
          }}
        >
          DarkRoom Crew
        </div>
        <h1 style={h1Style}>Hey {a.name}</h1>
        <div style={{ color: "#888", fontSize: 13 }}>
          Code: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#CFFF00" }}>{a.code}</span>
        </div>
      </header>

      <CopyRefLink code={a.code} />

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <Stat
          label="Tier actual"
          value={`${tier.emoji} ${tier.label}`}
          sub={`${(tier.recurringCents / 100).toFixed(0)}€/ref/mes · ${(tier.oneTimeCents / 100).toFixed(0)}€ next one-time`}
          accent
        />
        <Stat
          label="Refs activos"
          value={String(a.refs_active_count)}
          sub={refsToNext > 0 ? `${refsToNext} más para subir` : "rango máximo · TOP"}
        />
        <Stat
          label="Pendiente cobro"
          value={`${(a.pending_balance_cents / 100).toFixed(2)}€`}
          sub={a.pending_balance_cents >= 5000 ? "elegible payout día 5" : `mín 50€ acumulado`}
        />
        <Stat
          label="Total cobrado"
          value={`${(lifetimePaid / 100).toFixed(2)}€`}
          sub={`${(a.total_one_time_paid_cents / 100).toFixed(2)}€ one-time + ${(a.total_recurring_paid_cents / 100).toFixed(2)}€ recurrente`}
        />
      </section>

      <section style={card}>
        <h2 style={h2Style}>Estimación mensual</h2>
        <p style={{ color: "#B5B5B5" }}>
          Con tus <strong>{a.refs_active_count}</strong> refs activos al rate del tier{" "}
          <strong style={{ color: "#CFFF00" }}>{tier.label}</strong>, este mes generas{" "}
          <strong style={{ color: "#CFFF00", fontFamily: "'JetBrains Mono', monospace" }}>
            {(monthlyEstimate / 100).toFixed(2)}€
          </strong>{" "}
          en recurrente.
        </p>
      </section>

      <section style={card}>
        <h2 style={h2Style}>Tabla de rangos</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ color: "#CFFF00", borderBottom: "1px solid rgba(207,255,0,0.2)" }}>
              <th style={thStyle}>Rango</th>
              <th style={thStyle}>Refs</th>
              <th style={thStyle}>Único</th>
              <th style={thStyle}>Recurrente</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t) => {
              const isCurrent = t.key === a.tier_current;
              return (
                <tr
                  key={t.key}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    background: isCurrent ? "rgba(207,255,0,0.08)" : "transparent",
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  <td style={tdStyle}>
                    {t.emoji} {t.label} {isCurrent ? "← AHORA" : ""}
                  </td>
                  <td style={tdStyle}>
                    {t.refsMax === null ? `${t.refsMin}+` : `${t.refsMin}-${t.refsMax}`}
                  </td>
                  <td style={tdStyle}>{(t.oneTimeCents / 100).toFixed(0)}€</td>
                  <td style={tdStyle}>{(t.recurringCents / 100).toFixed(0)}€/ref</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section style={card}>
        <h2 style={h2Style}>Últimos referrals</h2>
        {refs.length === 0 ? (
          <p style={{ color: "#888" }}>Aún sin referrals · comparte tu link.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#888", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>One-time</th>
                <th style={thStyle}>Empezó</th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace" }}>
                    {anonymizeEmail(r.referred_email)}
                  </td>
                  <td style={tdStyle}>{r.plan}</td>
                  <td style={tdStyle}>
                    {r.status === "pending_30d" && <span style={{ color: "#FFAA00" }}>pending 30d</span>}
                    {r.status === "active" && <span style={{ color: "#CFFF00" }}>active</span>}
                    {r.status === "churned" && <span style={{ color: "#888" }}>churned</span>}
                    {r.status === "refunded" && <span style={{ color: "#FF3B3B" }}>refunded</span>}
                  </td>
                  <td style={tdStyle}>{r.one_time_paid ? "✓" : "—"}</td>
                  <td style={tdStyle}>{new Date(r.started_at).toLocaleDateString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={card}>
        <h2 style={h2Style}>Histórico de pagos</h2>
        {payouts.length === 0 ? (
          <p style={{ color: "#888" }}>Aún sin pagos.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#888", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={thStyle}>Período</th>
                <th style={thStyle}>Total</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Pagado</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p, i) => (
                <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={tdStyle}>{p.period}</td>
                  <td style={tdStyle}>{(p.total_cents / 100).toFixed(2)}€</td>
                  <td style={tdStyle}>
                    {p.status === "paid" && <span style={{ color: "#CFFF00" }}>paid</span>}
                    {p.status === "pending" && <span style={{ color: "#FFAA00" }}>pending</span>}
                    {p.status === "skipped_under_min" && <span style={{ color: "#888" }}>&lt; 50€</span>}
                  </td>
                  <td style={tdStyle}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString("es-ES") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

const pageWrap: React.CSSProperties = {
  background: "#0A0A0A",
  color: "#E6E6E6",
  minHeight: "100vh",
  padding: "60px 20px",
  fontFamily: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif",
  maxWidth: 960,
  margin: "0 auto",
};

const card: React.CSSProperties = {
  background: "#141414",
  border: "1px solid rgba(207,255,0,0.12)",
  borderRadius: 8,
  padding: 24,
  marginBottom: 24,
};

const h1Style: React.CSSProperties = {
  fontFamily: "'Anton', 'Impact', sans-serif",
  fontSize: 48,
  color: "#FFF",
  margin: "0 0 4px",
  letterSpacing: 1,
  textTransform: "uppercase",
};

const h2Style: React.CSSProperties = {
  fontFamily: "'Anton', 'Impact', sans-serif",
  fontSize: 22,
  color: "#CFFF00",
  margin: "0 0 16px",
  letterSpacing: 1,
  textTransform: "uppercase",
};

const thStyle: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 600,
  textTransform: "uppercase",
  fontSize: 11,
  letterSpacing: 1,
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
};

interface StatProps {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}

function Stat({ label, value, sub, accent }: StatProps) {
  return (
    <div
      style={{
        background: accent ? "rgba(207,255,0,0.06)" : "#141414",
        border: accent ? "1px solid #CFFF00" : "1px solid rgba(207,255,0,0.12)",
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "#888",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Anton', 'Impact', sans-serif",
          fontSize: 28,
          color: accent ? "#CFFF00" : "#FFF",
          letterSpacing: 0.5,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "#888" }}>{sub}</div>
    </div>
  );
}
