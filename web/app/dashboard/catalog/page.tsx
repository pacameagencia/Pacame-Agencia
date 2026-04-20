"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Plus, Edit2, Eye, EyeOff, Zap, Star, ArrowRight } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price_cents: number;
  agent_id: string;
  delivery_sla_hours: number;
  category: string | null;
  runner_type: string;
  product_type: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

export default function CatalogAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/catalog")
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function toggleActive(id: string, is_active: boolean) {
    await fetch(`/api/dashboard/catalog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !is_active }),
    });
    setProducts((list) =>
      list.map((p) => (p.id === id ? { ...p, is_active: !is_active } : p))
    );
  }

  async function toggleFeatured(id: string, is_featured: boolean) {
    await fetch(`/api/dashboard/catalog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: !is_featured }),
    });
    setProducts((list) =>
      list.map((p) => (p.id === id ? { ...p, is_featured: !is_featured } : p))
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-7 h-7 text-olympus-gold" />
            Catalogo Marketplace
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Crea, edita y publica productos sin deploy. Los runners declarativos
            entregan automaticamente.
          </p>
        </div>
        <Link
          href="/dashboard/catalog/new"
          className="inline-flex items-center gap-2 bg-olympus-gold text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-olympus-gold/90 transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </Link>
      </div>

      {loading ? (
        <p className="text-white/50">Cargando productos...</p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white/[0.03] border border-white/[0.06] text-center">
          <Package className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 mb-4">Aun no tienes productos.</p>
          <Link
            href="/dashboard/catalog/new"
            className="inline-flex items-center gap-2 bg-olympus-gold text-black font-semibold px-5 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase text-white/50">
              <tr>
                <th className="text-left p-3">Producto</th>
                <th className="text-left p-3">Categoria</th>
                <th className="text-left p-3">Runner</th>
                <th className="text-left p-3">Precio</th>
                <th className="text-left p-3">SLA</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.is_featured && (
                        <Star className="w-3.5 h-3.5 text-olympus-gold fill-olympus-gold" />
                      )}
                      <div>
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-xs text-white/40 font-mono">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-white/70">{p.category || "—"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-1 rounded-full border ${
                        p.runner_type === "custom"
                          ? "border-orange-400/30 text-orange-300 bg-orange-400/10"
                          : "border-olympus-gold/30 text-olympus-gold bg-olympus-gold/10"
                      }`}
                    >
                      {p.runner_type === "custom" ? (
                        <>Custom code</>
                      ) : (
                        <>
                          <Zap className="w-2.5 h-2.5" />
                          {p.runner_type}
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-white">
                    {(p.price_cents / 100).toFixed(0)}€
                  </td>
                  <td className="p-3 text-white/60">{p.delivery_sla_hours}h</td>
                  <td className="p-3">
                    {p.is_active ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                        <Eye className="w-3 h-3" />
                        Publicado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-white/40 text-xs">
                        <EyeOff className="w-3 h-3" />
                        Borrador
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFeatured(p.id, p.is_featured)}
                        className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition"
                        title={p.is_featured ? "Quitar destacado" : "Destacar"}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${p.is_featured ? "text-olympus-gold fill-olympus-gold" : "text-white/50"}`}
                        />
                      </button>
                      <button
                        onClick={() => toggleActive(p.id, p.is_active)}
                        className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition"
                        title={p.is_active ? "Despublicar" : "Publicar"}
                      >
                        {p.is_active ? (
                          <EyeOff className="w-3.5 h-3.5 text-white/60" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-green-400" />
                        )}
                      </button>
                      <Link
                        href={`/dashboard/catalog/${p.id}`}
                        className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition text-white/60 hover:text-olympus-gold"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/servicios/${p.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition text-white/60 hover:text-olympus-gold"
                        title="Ver pagina publica"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
