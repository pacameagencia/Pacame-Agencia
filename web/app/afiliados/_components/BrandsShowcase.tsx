"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BrandProduct = {
  product_key: string;
  product_name: string;
  price_cents: number;
  is_recurring: boolean;
  standard_flat_commission_cents: number;
};

type Brand = {
  slug: string;
  name: string;
  description: string | null;
  products: BrandProduct[];
};

const fmt = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    cents / 100,
  );

const BRAND_VISUALS: Record<string, { tagline: string; accent: string }> = {
  pacame: {
    tagline: "Webs, SEO, redes y ads para PYMEs españolas",
    accent: "border-mustard-500/40 bg-mustard-500/10",
  },
  saas: {
    tagline: "Productos SaaS propios: PacameGPT, Asesor Pro, PromptForge",
    accent: "border-emerald-500/40 bg-emerald-500/10",
  },
  darkroom: {
    tagline: "Comunidad Dark Room — premium recurrente",
    accent: "border-rose-400/40 bg-rose-400/10",
  },
};

export function BrandsShowcase() {
  const [brands, setBrands] = useState<Brand[] | null>(null);

  useEffect(() => {
    fetch("/api/referrals/public/brands")
      .then((r) => r.json())
      .then((j: { brands: Brand[] }) => setBrands(j.brands))
      .catch(() => setBrands([]));
  }, []);

  if (brands === null) return <p className="text-sm text-paper/60">Cargando marcas…</p>;
  if (!brands.length) return <p className="text-sm text-paper/60">Aún no hay marcas activas.</p>;

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {brands.map((b) => {
        const top3 = [...b.products]
          .sort((a, b) => b.standard_flat_commission_cents - a.standard_flat_commission_cents)
          .slice(0, 3);
        const visuals = BRAND_VISUALS[b.slug] || { tagline: b.description ?? "", accent: "border-paper/20 bg-paper/5" };
        return (
          <article
            key={b.slug}
            className={`flex flex-col rounded-md border p-5 text-paper backdrop-blur ${visuals.accent}`}
          >
            <div className="text-xs uppercase tracking-wider text-paper/60">Marca</div>
            <h3 className="mt-1 font-heading text-2xl">{b.name}</h3>
            <p className="mt-2 text-sm text-paper/70">{visuals.tagline}</p>

            {top3.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm">
                {top3.map((p) => (
                  <li key={p.product_key} className="flex items-baseline justify-between border-b border-paper/10 pb-1.5 last:border-0">
                    <span className="text-paper/80">{p.product_name}</span>
                    <span className="font-medium text-paper">
                      {fmt(p.standard_flat_commission_cents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={`/afiliados/registro?brand=${b.slug}`}
              className="mt-5 inline-block self-start rounded-sm bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-paper/90"
            >
              Ser afiliado de {b.name} →
            </Link>
          </article>
        );
      })}
    </div>
  );
}
