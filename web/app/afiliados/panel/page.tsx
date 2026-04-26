"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ReferralLinkCard,
  SparkChart,
  type SparkPoint,
} from "@/lib/modules/referrals/client";

type Stats = {
  clicks: number;
  signups: number;
  conversions: number;
  pending_cents: number;
  approved_cents: number;
  paid_cents: number;
  voided_cents: number;
  earnings_cents: number;
  epc_cents: number;
};

type Me = {
  affiliate: { id: string; referral_code: string; email: string; status: string };
  stats: Stats;
  referrals: Array<{ id: string; status: string; created_at: string }>;
};

const fmt = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function PanelOverviewPage() {
  const sp = useSearchParams();
  const welcome = sp.get("welcome") === "1";
  const [data, setData] = useState<Me | null>(null);
  const [series, setSeries] = useState<SparkPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/referrals/me", { credentials: "include" });
        if (r.status === 401) {
          window.location.href = "/afiliados/login";
          return;
        }
        if (!r.ok) throw new Error((await r.json()).error || "Error");
        const me = (await r.json()) as Me;
        if (cancelled) return;
        setData(me);

        const ts = await fetch("/api/referrals/me/timeseries?days=30", {
          credentials: "include",
        });
        if (ts.ok) {
          const tsJson = (await ts.json()) as { timeseries: SparkPoint[] };
          if (!cancelled) setSeries(tsJson.timeseries);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!data) return <p className="text-sm text-ink/60">Cargando…</p>;
  const { affiliate, stats } = data;

  // Checklist persistente — desaparece sólo cuando completas el paso
  const hasClicks = stats.clicks > 0;
  const hasConversions = stats.conversions > 0;
  const hasEarnings = stats.earnings_cents > 0 || stats.paid_cents > 0;
  const onboardingDone = hasClicks && hasConversions && hasEarnings;

  return (
    <div className="space-y-6">
      {welcome && (
        <div className="rounded-md border border-mustard-500/40 bg-mustard-500/15 p-4 text-sm">
          <p className="font-medium text-ink">🎉 Bienvenido al programa de afiliados PACAME</p>
          <p className="mt-1 text-ink/70">
            Tu enlace está vivo. Cada persona que entre por él queda asociada a ti durante
            30 días — si compra dentro de ese tiempo, la comisión es tuya.
          </p>
        </div>
      )}

      <ReferralLinkCard code={affiliate.referral_code} />

      {!onboardingDone && (
        <section className="rounded-md border border-ink/10 bg-paper p-5">
          <h3 className="font-heading text-lg text-ink">Tus primeros pasos</h3>
          <p className="mt-1 text-sm text-ink/60">
            Completa estos 3 pasos para empezar a generar ingresos. Esta lista
            desaparece sola cuando llegues al paso 3.
          </p>
          <ol className="mt-4 space-y-3">
            <Step
              done={hasClicks}
              title="Comparte tu enlace al menos una vez"
              hint="Súbelo a tus redes, mándalo por WhatsApp a 5 contactos o pégalo en un email a tu lista. Cada click cuenta — lo verás aquí."
              cta={{ href: "/afiliados/panel/contenido", label: "Coger plantilla lista →" }}
            />
            <Step
              done={hasConversions}
              title="Consigue tu primera conversión"
              hint="Cuando alguien que llegó por tu enlace compre cualquier servicio PACAME, te aparece aquí en menos de 1 minuto."
            />
            <Step
              done={hasEarnings}
              title="Recibe tu primera comisión aprobada"
              hint="A los 30 días del pago, la comisión pasa a ‘aprobada’ y entra en el siguiente ciclo de pago."
              cta={{ href: "/afiliados/panel/perfil", label: "Configurar método de cobro →" }}
            />
          </ol>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Clicks" value={String(stats.clicks)} />
        <Kpi label="Conversiones" value={String(stats.conversions)} />
        <Kpi label="Ganado" value={fmt(stats.earnings_cents)} />
        <Kpi label="Pendiente" value={fmt(stats.pending_cents)} />
        <Kpi label="Pagado" value={fmt(stats.paid_cents)} />
        <Kpi label="EPC" value={fmt(stats.epc_cents)} />
      </div>

      {/* Proyección si tienes referidos recurrentes */}
      {stats.conversions > 0 && stats.pending_cents > 0 && (
        <section className="rounded-md border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-sm font-medium text-emerald-900">
            🟢 Proyección a 12 meses si los referidos actuales no se dan de baja
          </h3>
          <p className="mt-1 text-2xl font-heading text-emerald-800">
            ≈ {fmt(stats.pending_cents * 12)}
          </p>
          <p className="mt-1 text-xs text-emerald-900/70">
            Cálculo orientativo: comisión pendiente actual × 12 meses. La cifra real
            varía según churn y nuevos referidos.
          </p>
        </section>
      )}

      <section className="rounded-md border border-ink/10 bg-paper p-4">
        <h3 className="mb-3 text-sm font-medium text-ink">Actividad últimos 30 días</h3>
        {series.length ? (
          <SparkChart data={series} height={240} />
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-ink/60">
              Aún no hay actividad. Comparte tu enlace una vez y aquí verás el primer click.
            </p>
            <a
              href="/afiliados/panel/contenido"
              className="mt-3 inline-block rounded-sm bg-terracotta-500 px-4 py-2 text-sm font-medium text-paper hover:bg-terracotta-600"
            >
              Coger una plantilla y compartir →
            </a>
          </div>
        )}
      </section>
    </div>
  );
}

function Step({
  done, title, hint, cta,
}: {
  done: boolean; title: string; hint: string;
  cta?: { href: string; label: string };
}) {
  return (
    <li className="flex gap-3">
      <span
        className={
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium " +
          (done ? "bg-emerald-500 text-white" : "bg-ink/10 text-ink/60")
        }
        aria-hidden
      >
        {done ? "✓" : ""}
      </span>
      <div className="flex-1">
        <div className={"text-sm font-medium " + (done ? "text-ink/40 line-through" : "text-ink")}>
          {title}
        </div>
        {!done && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
        {!done && cta && (
          <a href={cta.href} className="mt-2 inline-block text-xs text-terracotta-500 hover:underline">
            {cta.label}
          </a>
        )}
      </div>
    </li>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-4">
      <div className="text-xs uppercase tracking-wide text-ink/60">{label}</div>
      <div className="mt-1 font-heading text-xl text-ink">{value}</div>
    </div>
  );
}
