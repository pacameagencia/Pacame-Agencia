"use client";

import { useEffect, useState } from "react";

type BrandProduct = {
  id: string;
  brand_id: string;
  product_key: string;
  product_name: string;
  price_cents: number;
  is_recurring: boolean;
  standard_flat_commission_cents: number;
  vip_first_flat_commission_cents: number;
  vip_recurring_flat_cents: number;
  vip_recurring_months: number;
  active: boolean;
  display_order: number;
};

type Brand = {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  description: string | null;
  active: boolean;
  display_order: number;
  products: BrandProduct[];
};

const fmt = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(cents / 100);

export default function MarcasAdminPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<BrandProduct>>({});

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/referrals/admin/brands", { credentials: "include" });
      if (!r.ok) throw new Error((await r.json()).error || "Error");
      const j = (await r.json()) as { brands: Brand[] };
      setBrands(j.brands);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (p: BrandProduct) => {
    setEditing(p.id);
    setDraft({
      price_cents: p.price_cents,
      standard_flat_commission_cents: p.standard_flat_commission_cents,
      vip_first_flat_commission_cents: p.vip_first_flat_commission_cents,
      vip_recurring_flat_cents: p.vip_recurring_flat_cents,
      vip_recurring_months: p.vip_recurring_months,
      product_name: p.product_name,
      active: p.active,
    });
  };

  const save = async (id: string) => {
    const r = await fetch("/api/referrals/admin/brand-products", {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...draft }),
    });
    if (!r.ok) {
      alert((await r.json()).error || "Error");
      return;
    }
    setEditing(null);
    setDraft({});
    await load();
  };

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (loading) return <p className="text-sm text-ink/60">Cargando marcas…</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink/70">
        Gestiona las <strong>3 marcas del programa</strong> y los importes
        fijos que cobran tus afiliados por cada producto. Los cambios se
        aplican a las <strong>nuevas comisiones</strong>; las ya generadas son inmutables.
      </p>

      {brands.map((b) => (
        <section key={b.id} className="rounded-md border border-ink/10 bg-paper">
          <header className="flex items-baseline justify-between border-b border-ink/10 px-5 py-3">
            <div>
              <h2 className="font-heading text-xl text-ink">{b.name}</h2>
              <p className="font-mono text-xs text-ink/55">/{b.slug} · {b.domain ?? "—"}</p>
            </div>
            <span className="text-xs text-ink/60">{b.products.length} productos</span>
          </header>

          {b.products.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink/60">Sin productos. Crea uno con la API o desde Supabase.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 text-xs uppercase text-ink/60">
                <tr className="text-left">
                  <th className="px-4 py-2">Key</th>
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2 text-right">Precio</th>
                  <th className="px-4 py-2 text-right">Comisión standard</th>
                  <th className="px-4 py-2 text-right">VIP 1ª</th>
                  <th className="px-4 py-2 text-right">VIP rec.</th>
                  <th className="px-4 py-2 text-right">Meses VIP</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {b.products.map((p) => {
                  const isEditing = editing === p.id;
                  return (
                    <tr key={p.id} className="border-b border-ink/5 last:border-0">
                      <td className="px-4 py-2 font-mono text-xs text-ink/60">{p.product_key}</td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            value={String(draft.product_name ?? "")}
                            onChange={(e) => setDraft({ ...draft, product_name: e.target.value })}
                            className="w-full rounded-sm border border-ink/15 bg-paper px-2 py-1 text-xs"
                          />
                        ) : (
                          <span>{p.product_name} {p.is_recurring && <span className="text-xs text-ink/50">/mes</span>}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isEditing ? (
                          <CentsInput value={draft.price_cents} onChange={(v) => setDraft({ ...draft, price_cents: v })} />
                        ) : fmt(p.price_cents)}
                      </td>
                      <td className="px-4 py-2 text-right text-terracotta-500">
                        {isEditing ? (
                          <CentsInput value={draft.standard_flat_commission_cents} onChange={(v) => setDraft({ ...draft, standard_flat_commission_cents: v })} />
                        ) : fmt(p.standard_flat_commission_cents)}
                      </td>
                      <td className="px-4 py-2 text-right text-ink/70">
                        {isEditing ? (
                          <CentsInput value={draft.vip_first_flat_commission_cents} onChange={(v) => setDraft({ ...draft, vip_first_flat_commission_cents: v })} />
                        ) : fmt(p.vip_first_flat_commission_cents)}
                      </td>
                      <td className="px-4 py-2 text-right text-ink/70">
                        {isEditing ? (
                          <CentsInput value={draft.vip_recurring_flat_cents} onChange={(v) => setDraft({ ...draft, vip_recurring_flat_cents: v })} />
                        ) : fmt(p.vip_recurring_flat_cents)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isEditing ? (
                          <input
                            type="number" min={0} max={36}
                            value={Number(draft.vip_recurring_months ?? 0)}
                            onChange={(e) => setDraft({ ...draft, vip_recurring_months: Number(e.target.value) })}
                            className="w-16 rounded-sm border border-ink/15 bg-paper px-2 py-1 text-xs"
                          />
                        ) : `${p.vip_recurring_months}m`}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => save(p.id)} className="rounded-sm bg-terracotta-500 px-2 py-1 text-xs text-paper">Guardar</button>
                            <button onClick={() => { setEditing(null); setDraft({}); }} className="rounded-sm border border-ink/15 px-2 py-1 text-xs">Cancelar</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(p)} className="rounded-sm border border-ink/15 px-2 py-1 text-xs">Editar</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </div>
  );
}

function CentsInput({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  const eur = (value ?? 0) / 100;
  return (
    <div className="inline-flex items-center gap-1">
      <input
        type="number" step={0.01} min={0}
        value={eur}
        onChange={(e) => onChange(Math.round(Number(e.target.value || 0) * 100))}
        className="w-20 rounded-sm border border-ink/15 bg-paper px-2 py-1 text-right text-xs"
      />
      <span className="text-xs text-ink/50">€</span>
    </div>
  );
}
