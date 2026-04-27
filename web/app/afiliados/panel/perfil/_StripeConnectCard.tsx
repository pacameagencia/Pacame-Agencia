"use client";

import { useEffect, useState } from "react";

type ConnectStatus = {
  has_account: boolean;
  payouts_enabled: boolean;
  details_submitted?: boolean;
  status: "pending" | "active" | "rejected" | null;
  requirements?: string[];
};

export function StripeConnectCard() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const r = await fetch("/api/referrals/public/stripe-connect/status", { credentials: "include" });
      const j = (await r.json()) as ConnectStatus;
      setStatus(j);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onboard = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/referrals/public/stripe-connect/onboard", {
        method: "POST",
        credentials: "include",
      });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || "Error");
      window.location.href = j.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setBusy(false);
    }
  };

  if (!status) return <p className="text-sm text-ink/60">Comprobando estado de cobro…</p>;

  const allOk = status.has_account && status.payouts_enabled;

  return (
    <section className="rounded-md border border-ink/10 bg-paper p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-xl">💸 Cobrar tus comisiones</h3>
          <p className="mt-1 text-sm text-ink/60">
            PACAME usa Stripe Connect Express. Tú conectas tu cuenta una vez,
            Stripe te pide DNI/IBAN y compliance fiscal, y desde ese momento
            cuando una comisión se aprueba el admin la transfiere a tu IBAN
            con 1 click.
          </p>
        </div>
        {allOk && (
          <span className="rounded-sm bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
            ✓ activo
          </span>
        )}
        {!allOk && status.has_account && (
          <span className="rounded-sm bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
            ⏳ verificación pendiente
          </span>
        )}
        {!status.has_account && (
          <span className="rounded-sm bg-ink/5 px-2 py-1 text-xs font-medium text-ink/60">
            sin conectar
          </span>
        )}
      </div>

      {!status.has_account && (
        <button
          type="button"
          onClick={onboard}
          disabled={busy}
          className="mt-5 rounded-sm bg-terracotta-500 px-5 py-2.5 text-sm font-medium text-paper hover:bg-terracotta-600 disabled:opacity-50"
        >
          {busy ? "Generando enlace…" : "Conectar mi cuenta para cobrar →"}
        </button>
      )}

      {status.has_account && !status.payouts_enabled && (
        <div className="mt-5 space-y-3">
          <p className="rounded-sm border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Pendiente de completar verificación.</strong> Stripe necesita
            que aportes algunos datos extra (DNI, IBAN o ambos) para activar los
            pagos a tu cuenta.
          </p>
          {(status.requirements?.length ?? 0) > 0 && (
            <details className="text-xs text-ink/60">
              <summary className="cursor-pointer">Datos pendientes</summary>
              <ul className="mt-2 ml-5 list-disc">
                {(status.requirements ?? []).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </details>
          )}
          <button
            type="button"
            onClick={onboard}
            disabled={busy}
            className="rounded-sm bg-terracotta-500 px-5 py-2.5 text-sm font-medium text-paper hover:bg-terracotta-600 disabled:opacity-50"
          >
            {busy ? "Abriendo…" : "Completar verificación →"}
          </button>
        </div>
      )}

      {allOk && (
        <p className="mt-5 rounded-sm border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Tu cuenta está lista. Cuando se aprueben tus comisiones, recibirás el
          dinero automáticamente en tu IBAN/tarjeta. No tienes que hacer nada más.
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-sm border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}
    </section>
  );
}
