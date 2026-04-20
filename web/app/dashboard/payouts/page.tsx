"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  ExternalLink,
  Calendar,
} from "lucide-react";

interface ReferralItem {
  id: string;
  amount_cents: number;
  commission_cents: number;
  referred_email: string | null;
  created_at: string;
  referral_code: string;
  order_id: string | null;
}

interface PayoutRow {
  referrer_client_id: string;
  name: string | null;
  email: string | null;
  total_commission_cents: number;
  total_revenue_cents: number;
  count: number;
  eligible: boolean;
  shortfall_cents: number;
  referrals: ReferralItem[];
}

interface Report {
  ok: boolean;
  month: string;
  min_payout_cents: number;
  grand_total_commission_cents: number;
  eligible_count: number;
  total_count: number;
  payouts: PayoutRow[];
}

function eur(c: number): string {
  return `${(c / 100).toLocaleString("es-ES")}€`;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  date.setUTCMonth(date.getUTCMonth() + 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function PayoutsPage() {
  const [month, setMonth] = useState(prevMonth(currentMonth()));
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboard/referrals/payout-report?month=${month}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as Report;
      setReport(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  async function markPaid(row: PayoutRow) {
    if (!row.eligible) return;
    if (
      !confirm(
        `Marcar ${eur(row.total_commission_cents)} como pagados a ${
          row.name || row.email || row.referrer_client_id
        }? Esto no se puede deshacer.`
      )
    ) {
      return;
    }
    setPaying(row.referrer_client_id);
    try {
      const res = await fetch("/api/dashboard/referrals/payout-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          month,
          referrer_client_id: row.referrer_client_id,
          payment_ref: paymentRef.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `status ${res.status}`);
      }
      await fetchReport();
    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setPaying(null);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-ink flex items-center gap-2">
            <Wallet className="w-6 h-6 text-accent-gold" /> Commission Payouts
          </h1>
          <p className="text-sm text-ink/40 font-body mt-1">
            Transferencias mensuales a referrers. Minimo {report?.min_payout_cents
              ? eur(report.min_payout_cents)
              : "20€"}{" "}
            por referrer.
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2 bg-paper-deep rounded-xl border border-ink/[0.08] p-1">
          <button
            onClick={() => setMonth(prevMonth(month))}
            className="px-3 py-1.5 rounded-lg hover:bg-white/[0.06] text-ink/60 hover:text-ink text-sm transition"
          >
            ←
          </button>
          <div className="flex items-center gap-2 px-3 py-1 text-sm font-mono text-ink">
            <Calendar className="w-3.5 h-3.5 text-accent-gold" /> {month}
          </div>
          <button
            onClick={() => setMonth(nextMonth(month))}
            className="px-3 py-1.5 rounded-lg hover:bg-white/[0.06] text-ink/60 hover:text-ink text-sm transition"
          >
            →
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5">
            <div className="text-[11px] uppercase tracking-wider text-ink/40 font-mono mb-1">
              Total a pagar
            </div>
            <div className="font-heading font-bold text-3xl text-accent-gold">
              {eur(report.grand_total_commission_cents)}
            </div>
            <div className="text-xs text-ink/40 font-body mt-1">
              {report.eligible_count} referrers elegibles
            </div>
          </div>
          <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5">
            <div className="text-[11px] uppercase tracking-wider text-ink/40 font-mono mb-1">
              Pendientes
            </div>
            <div className="font-heading font-bold text-3xl text-ink">
              {report.total_count}
            </div>
            <div className="text-xs text-ink/40 font-body mt-1">
              Referrers con balance
            </div>
          </div>
          <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5">
            <div className="text-[11px] uppercase tracking-wider text-ink/40 font-mono mb-1">
              Referencia pago
            </div>
            <input
              type="text"
              placeholder="ej. txfr-2026-04-a1b2"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full bg-white/[0.02] border border-ink/[0.08] rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-accent-gold/40 transition"
            />
            <div className="text-[11px] text-ink/40 mt-1">
              Se guarda en audit_log al marcar pagado
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-10 text-ink/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando...
        </div>
      )}

      {!loading && report && report.payouts.length === 0 && (
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-mint mx-auto mb-3" />
          <div className="font-heading font-semibold text-ink">
            Sin pagos pendientes este mes
          </div>
          <p className="text-sm text-ink/40 mt-2">
            No hay referrals con status=pending en {month}.
          </p>
        </div>
      )}

      {/* Payouts list */}
      {!loading && report && report.payouts.length > 0 && (
        <div className="space-y-3">
          {report.payouts.map((row) => {
            const isOpen = expanded === row.referrer_client_id;
            return (
              <div
                key={row.referrer_client_id}
                className={`rounded-2xl border ${
                  row.eligible
                    ? "bg-paper-deep border-ink/[0.06]"
                    : "bg-white/[0.01] border-white/[0.04] opacity-70"
                }`}
              >
                <div className="p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="font-heading font-semibold text-ink">
                        {row.name || row.email || row.referrer_client_id.slice(0, 8)}
                      </div>
                      {row.eligible ? (
                        <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-mint/15 text-mint">
                          elegible
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                          carryover
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink/50 mt-1 flex items-center gap-3 flex-wrap">
                      <span>{row.email}</span>
                      <span>·</span>
                      <span>{row.count} referrals</span>
                      <span>·</span>
                      <span>{eur(row.total_revenue_cents)} generados</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(row.email || "");
                          setCopied(row.referrer_client_id);
                          setTimeout(() => setCopied(null), 1500);
                        }}
                        className="p-1 hover:bg-white/[0.04] rounded text-ink/40 hover:text-ink transition"
                        title="Copiar email"
                      >
                        {copied === row.referrer_client_id ? (
                          <CheckCircle2 className="w-3 h-3 text-mint" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    {!row.eligible && (
                      <div className="text-[11px] text-amber-400 mt-1">
                        Faltan {eur(row.shortfall_cents)} para minimo — se acumula al proximo mes
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-heading font-bold text-xl text-accent-gold">
                        {eur(row.total_commission_cents)}
                      </div>
                      <div className="text-[10px] text-ink/30">a transferir</div>
                    </div>
                    <button
                      onClick={() =>
                        setExpanded(isOpen ? null : row.referrer_client_id)
                      }
                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-ink/70 transition"
                    >
                      {isOpen ? "Ocultar" : "Ver detalle"}
                    </button>
                    {row.eligible && (
                      <button
                        onClick={() => markPaid(row)}
                        disabled={paying === row.referrer_client_id}
                        className="px-3 py-1.5 rounded-lg bg-accent-gold text-paper text-xs font-semibold hover:brightness-110 disabled:opacity-50 transition"
                      >
                        {paying === row.referrer_client_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Marcar pagado"
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-ink/[0.06] p-5">
                    <div className="space-y-2">
                      {row.referrals.map((ref) => (
                        <div
                          key={ref.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] text-sm"
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono text-[11px] text-ink/40">
                              {ref.referral_code}
                            </span>
                            <span className="text-ink/70">
                              {ref.referred_email || "—"}
                            </span>
                            {ref.order_id && (
                              <a
                                href={`/dashboard/orders?id=${ref.order_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent-gold hover:underline flex items-center gap-1 text-[11px]"
                              >
                                Order <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-ink/40 text-[11px]">
                              {new Date(ref.created_at).toLocaleDateString("es-ES")}
                            </span>
                            <span className="text-ink/60">
                              {eur(ref.amount_cents)} →{" "}
                              <strong className="text-accent-gold">
                                {eur(ref.commission_cents)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {report && report.payouts.some((p) => !p.eligible) && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-amber-400/90 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Referrers con balance menor que el minimo ({eur(report.min_payout_cents)}) siguen
            en status &apos;pending&apos; — se acumulan automaticamente al siguiente mes al
            consultar este reporte con otro filtro.
          </p>
        </div>
      )}
    </div>
  );
}
