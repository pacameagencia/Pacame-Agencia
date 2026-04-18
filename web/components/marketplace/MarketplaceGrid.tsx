"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  Zap,
  Check,
  Filter,
  ArrowRight,
  Sparkles,
  Globe,
  PenTool,
  TrendingUp,
  Instagram,
  Target,
  BarChart3,
  Bot,
  Download,
  LayoutGrid,
  Star,
} from "lucide-react";

interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price_cents: number;
  currency: string;
  agent_id: string;
  delivery_sla_hours: number;
  revisions_included: number;
  features: string[];
  category: string | null;
  tags: string[];
  is_featured: boolean;
  cover_image_url: string | null;
}

interface Category {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

interface Props {
  products: Product[];
  categories: Category[];
}

const iconMap: Record<string, typeof Sparkles> = {
  Sparkles,
  Globe,
  PenTool,
  TrendingUp,
  Instagram,
  Target,
  BarChart3,
  Bot,
  Download,
};

function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(0)}€`;
}

function formatSla(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  const d = Math.round(hours / 24);
  return `${d}d`;
}

export default function MarketplaceGrid({ products, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "fastest">(
    "featured"
  );

  const filtered = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.tagline || "").toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.price_cents - b.price_cents;
        case "price_desc":
          return b.price_cents - a.price_cents;
        case "fastest":
          return a.delivery_sla_hours - b.delivery_sla_hours;
        case "featured":
        default:
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
          return a.price_cents - b.price_cents;
      }
    });

    return list;
  }, [products, selectedCategory, search, sortBy]);

  const activeCategories = useMemo(() => {
    const used = new Set(products.map((p) => p.category).filter(Boolean) as string[]);
    return categories.filter((c) => used.has(c.slug));
  }, [products, categories]);

  return (
    <section className="py-16 bg-pacame-black">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-body font-semibold text-olympus-gold uppercase tracking-wider bg-olympus-gold/10 rounded-full px-3 py-1 mb-4 border border-olympus-gold/20">
            <Zap className="w-3 h-3" />
            Marketplace Express
          </span>
          <h2 className="font-accent font-bold text-4xl sm:text-5xl text-pacame-white mb-3">
            Compra. Paga. Recibe en horas.
          </h2>
          <p className="text-lg text-pacame-white/60 font-body max-w-2xl mx-auto">
            Servicios digitales entregados por agentes IA supervisados. Precio fijo.
            Garantia 100%. Sin llamadas comerciales.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-8 space-y-4">
          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pacame-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca un servicio (ej. logo, landing, copy, SEO...)"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white placeholder:text-pacame-white/30 focus:border-olympus-gold/50 focus:outline-none font-body"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-body transition border ${
                selectedCategory === "all"
                  ? "bg-olympus-gold text-pacame-black border-olympus-gold"
                  : "bg-white/[0.04] text-pacame-white/70 border-white/[0.08] hover:border-olympus-gold/40"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Todos ({products.length})
            </button>
            {activeCategories.map((cat) => {
              const Icon = cat.icon && iconMap[cat.icon] ? iconMap[cat.icon] : Sparkles;
              const count = products.filter((p) => p.category === cat.slug).length;
              const active = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-body transition border ${
                    active
                      ? "bg-olympus-gold text-pacame-black border-olympus-gold"
                      : "bg-white/[0.04] text-pacame-white/70 border-white/[0.08] hover:border-olympus-gold/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center justify-center gap-2 text-sm font-body text-pacame-white/60">
            <Filter className="w-4 h-4" />
            <span>Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-pacame-white text-sm focus:border-olympus-gold/40 focus:outline-none"
            >
              <option value="featured">Destacados</option>
              <option value="price_asc">Precio: mas barato</option>
              <option value="price_desc">Precio: mas caro</option>
              <option value="fastest">Entrega mas rapida</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-pacame-white/50 font-body">
            No encontramos servicios con esos filtros. Prueba con otras palabras.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/servicios/${p.slug}`}
                className="group relative rounded-2xl p-6 bg-dark-card border border-white/[0.06] hover:border-olympus-gold/40 transition card-golden-shine"
              >
                {p.is_featured && (
                  <div className="absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-olympus-gold bg-olympus-gold/10 border border-olympus-gold/20 rounded-full px-2 py-0.5">
                    <Star className="w-2.5 h-2.5" />
                    Top
                  </div>
                )}

                <div className="text-[10px] font-mono uppercase tracking-wider text-pacame-white/40 mb-2">
                  {p.category}
                </div>

                <h3 className="font-heading font-bold text-xl text-pacame-white mb-2 group-hover:text-olympus-gold transition">
                  {p.name}
                </h3>
                <p className="text-sm text-pacame-white/60 font-body mb-4 line-clamp-2 min-h-[40px]">
                  {p.tagline}
                </p>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center gap-2 mb-5 text-xs font-body text-pacame-white/60">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-olympus-gold" />
                    {formatSla(p.delivery_sla_hours)}
                  </span>
                  <span className="text-pacame-white/20">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Check className="w-3 h-3 text-olympus-gold" />
                    {p.revisions_included} rev
                  </span>
                  <span className="text-pacame-white/20">·</span>
                  <span className="inline-flex items-center gap-1 capitalize">
                    <Sparkles className="w-3 h-3 text-olympus-gold" />
                    {p.agent_id}
                  </span>
                </div>

                {/* Features preview */}
                {p.features.length > 0 && (
                  <ul className="space-y-1.5 mb-5">
                    {p.features.slice(0, 3).map((f) => (
                      <li
                        key={f}
                        className="text-xs text-pacame-white/70 font-body flex items-start gap-1.5"
                      >
                        <Check className="w-3 h-3 text-olympus-gold flex-shrink-0 mt-0.5" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Price + CTA */}
                <div className="flex items-end justify-between pt-4 border-t border-white/[0.06]">
                  <div>
                    <div className="font-heading font-bold text-2xl text-pacame-white">
                      {formatPrice(p.price_cents)}
                    </div>
                    <div className="text-[11px] text-pacame-white/40 font-body">Pago unico</div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-sm font-heading font-semibold text-olympus-gold group-hover:translate-x-0.5 transition-transform">
                    Ver
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
