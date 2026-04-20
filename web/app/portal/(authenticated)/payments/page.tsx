"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Receipt, TrendingUp, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

interface Payment {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  type: string;
}

interface PaymentsData {
  payments: Payment[];
  totalSpent: number;
  paymentsCount: number;
}

const statusConfig: Record<string, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  completed: { label: "Pagado", color: "#16A34A", Icon: CheckCircle2 },
  paid: { label: "Pagado", color: "#16A34A", Icon: CheckCircle2 },
  pending: { label: "Pendiente", color: "#D97706", Icon: Clock },
  overdue: { label: "Vencido", color: "#FB7185", Icon: AlertCircle },
  refunded: { label: "Reembolsado", color: "#6B7280", Icon: AlertCircle },
};

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch("/api/portal?action=get_payments");
      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error ?? "Error al cargar pagos");
      }
      const result = (await res.json()) as PaymentsData;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-ink/60 font-body mb-4">{error ?? "Sin datos"}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchPayments(); }}
          className="text-sm text-brand-primary font-body hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { payments, totalSpent, paymentsCount } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-1">
          <Receipt className="w-6 h-6 text-accent-gold" />
          <h1 className="font-heading font-bold text-2xl text-ink">Pagos</h1>
        </div>
        <p className="text-sm text-ink/50 font-body">
          Historial de facturacion y pagos
        </p>
      </ScrollReveal>

      {/* Summary cards */}
      <StaggerContainer className="grid sm:grid-cols-2 gap-4" staggerDelay={0.06}>
        <StaggerItem>
          <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent-gold" />
              </div>
              <div>
                <p className="text-[11px] text-ink/40 font-body">Total invertido</p>
                <p className="font-heading font-bold text-2xl text-ink">
                  {totalSpent.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€
                </p>
              </div>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-[11px] text-ink/40 font-body">Pagos realizados</p>
                <p className="font-heading font-bold text-2xl text-ink">{paymentsCount}</p>
              </div>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Payments list */}
      <ScrollReveal delay={0.1}>
        {payments.length === 0 ? (
          <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-12 text-center">
            <Receipt className="w-12 h-12 text-ink/10 mx-auto mb-3" />
            <p className="text-sm text-ink/30 font-body">Aun no hay pagos registrados</p>
          </div>
        ) : (
          <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl overflow-hidden">
            {/* Table header - desktop */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.04] text-[10px] text-ink/30 font-body uppercase tracking-wider">
              <span className="col-span-5">Concepto</span>
              <span className="col-span-2 text-center">Fecha</span>
              <span className="col-span-2 text-center">Estado</span>
              <span className="col-span-3 text-right">Importe</span>
            </div>

            {/* Payments */}
            <div className="divide-y divide-white/[0.04]">
              {payments.map((payment) => {
                const cfg = statusConfig[payment.status] ?? statusConfig.completed;
                const StatusIcon = cfg.Icon;
                return (
                  <div
                    key={payment.id}
                    className="px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-ink font-body">{payment.description}</p>
                        <span className="font-heading font-bold text-ink">
                          {Number(payment.amount).toLocaleString("es-ES", { minimumFractionDigits: 2 })}€
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-ink/30 font-body">
                          {new Date(payment.date).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-body font-medium inline-flex items-center gap-1"
                          style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:grid sm:grid-cols-12 gap-4 items-center">
                      <p className="col-span-5 text-sm text-ink font-body">
                        {payment.description}
                      </p>
                      <span className="col-span-2 text-center text-xs text-ink/40 font-body">
                        {new Date(payment.date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <div className="col-span-2 flex justify-center">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-body font-medium inline-flex items-center gap-1"
                          style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <span className="col-span-3 text-right font-heading font-bold text-ink">
                        {Number(payment.amount).toLocaleString("es-ES", { minimumFractionDigits: 2 })}€
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ScrollReveal>
    </div>
  );
}
