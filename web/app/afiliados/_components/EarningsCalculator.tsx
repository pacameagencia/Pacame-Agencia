"use client";

import { useEffect, useMemo, useState } from "react";

type BrandProduct = {
  brand_id: string;
  product_key: string;
  product_name: string;
  price_cents: number;
  is_recurring: boolean;
  standard_flat_commission_cents: number;
  vip_recurring_flat_cents: number;
  vip_recurring_months: number;
};

type Brand = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  products: BrandProduct[];
};

const fmt = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    cents / 100,
  );

export function EarningsCalculator({ defaultBrandSlug }: { defaultBrandSlug?: string }) {
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [brandSlug, setBrandSlug] = useState(defaultBrandSlug || "pacame");
  const [productKey, setProductKey] = useState<string | null>(null);
  const [salesPerMonth, setSalesPerMonth] = useState(5);

  useEffect(() => {
    fetch("/api/referrals/public/brands")
      .then((r) => r.json())
      .then((j: { brands: Brand[] }) => {
        setBrands(j.brands);
        if (defaultBrandSlug && j.brands.some((b) => b.slug === defaultBrandSlug)) {
          setBrandSlug(defaultBrandSlug);
        }
      })
      .catch(() => setBrands([]));
  }, [defaultBrandSlug]);

  const brand = brands?.find((b) => b.slug === brandSlug) ?? brands?.[0];

  // Cuando cambia la brand, escogemos el producto más caro como default
  useEffect(() => {
    if (!brand?.products?.length) {
      setProductKey(null);
      return;
    }
    const top = [...brand.products].sort(
      (a, b) => b.standard_flat_commission_cents - a.standard_flat_commission_cents,
    )[0];
    setProductKey(top.product_key);
  }, [brand]);

  const product = useMemo(
    () => brand?.products?.find((p) => p.product_key === productKey) ?? null,
    [brand, productKey],
  );

  if (brands === null) {
    return <div className="rounded-md border border-ink/10 bg-paper p-6 text-sm text-ink/60">Cargando…</div>;
  }
  if (!brand || !product) {
    return <div className="rounded-md border border-ink/10 bg-paper p-6 text-sm text-ink/60">Configura productos en el panel admin para empezar.</div>;
  }

  const monthly = product.standard_flat_commission_cents * salesPerMonth;
  const annual = monthly * 12;

  return (
    <div className="grid gap-6 rounded-md border border-ink/10 bg-paper p-6 lg:grid-cols-2">
      <div className="space-y-5">
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Marca</span>
          <select
            value={brandSlug}
            onChange={(e) => setBrandSlug(e.target.value)}
            className="w-full rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm"
          >
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">Servicio que recomiendas</span>
          <select
            value={productKey ?? ""}
            onChange={(e) => setProductKey(e.target.value)}
            className="w-full rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm"
          >
            {brand.products.map((p) => (
              <option key={p.product_key} value={p.product_key}>
                {p.product_name} — {fmt(p.standard_flat_commission_cents)} por venta
              </option>
            ))}
          </select>
        </label>

        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink/70">Ventas que cierras al mes</span>
            <span className="font-heading text-2xl text-terracotta-500">{salesPerMonth}</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={salesPerMonth}
            onChange={(e) => setSalesPerMonth(Number(e.target.value))}
            className="mt-2 w-full accent-terracotta-500"
          />
          <div className="mt-1 flex justify-between text-xs text-ink/50">
            <span>1</span>
            <span>15</span>
            <span>30</span>
          </div>
        </div>

        <p className="rounded-sm bg-mustard-500/15 p-3 text-xs text-ink/80">
          <strong>Comisión fija por venta</strong>: cobras{" "}
          <strong>{fmt(product.standard_flat_commission_cents)}</strong>{" "}
          una vez por cada nuevo cliente que cerraste. {product.is_recurring && (
            <>El cliente paga {fmt(product.price_cents)}/mes pero a ti se te paga
              {" "}<strong>solo en el primer pago</strong> (a no ser que seas afiliado VIP).</>
          )}
        </p>
      </div>

      <div className="space-y-3 rounded-sm bg-ink/5 p-5">
        <Row label="Comisión por venta">{fmt(product.standard_flat_commission_cents)}</Row>
        <Row label="× Ventas/mes">× {salesPerMonth}</Row>
        <Row big label="Tu mes">{fmt(monthly)}</Row>
        <Row label="× 12 meses">{fmt(annual)} / año</Row>
        <p className="pt-2 text-xs text-ink/60">
          Si cada mes cierras {salesPerMonth} clientes nuevos, ingresas {fmt(monthly)} cada
          mes. <strong>El mes 2 son {salesPerMonth} ventas nuevas — no se duplica</strong>.
          La gracia es que tienes {fmt(monthly)} de ingresos previsibles cada mes que mantengas
          tu ritmo.
        </p>
        {product.is_recurring && product.vip_recurring_flat_cents > 0 && (
          <p className="rounded-sm bg-terracotta-500/10 p-2 text-xs text-ink/80">
            <strong>Modo VIP</strong>: si llegas a top seller, cada cliente además te paga{" "}
            {fmt(product.vip_recurring_flat_cents)} cada mes durante {product.vip_recurring_months}{" "}
            meses (= {fmt(product.vip_recurring_flat_cents * product.vip_recurring_months)}
            {" "}adicionales por cliente).
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, children, big }: { label: string; children: React.ReactNode; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-ink/10 pb-2 last:border-0">
      <span className="text-sm text-ink/70">{label}</span>
      <span className={big ? "font-heading text-3xl text-terracotta-500" : "font-medium text-ink"}>
        {children}
      </span>
    </div>
  );
}
