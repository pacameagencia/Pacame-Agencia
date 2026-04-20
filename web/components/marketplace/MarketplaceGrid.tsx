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
  RefreshCw,
} from "lucide-react";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";

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

interface BadgeData {
  label: string;
  color: string;
  priority: number;
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

// Badge color palette mapping
const badgeColorClass: Record<string, string> = {
  gold: "bg-accent-gold/15 text-accent-gold border-accent-gold/25",
  red: "bg-rose-500/10 text-rose-300 border-rose-500/25",
  purple: "bg-purple-500/10 text-purple-300 border-purple-500/25",
  green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  blue: "bg-blue-500/10 text-blue-300 border-blue-500/25",
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
  const [sortBy, setSortBy] = useState<
    "featured" | "price_asc" | "price_desc" | "fastest"
  >("featured");
  const [badgesMap, setBadgesMap] = useState<Record<string, BadgeData[]>>({});

  // Fetch badges — non-blocking, cache en API
  useEffect(() => {
    fetch("/api/public/badges")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.badges && setBadgesMap(d.badges))
      .catch(() => null);
  }, []);

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
    const used = new Set(
      products.map((p) => p.category).filter(Boolean) as string[]
    );
    return categories.filter((c) => used.has(c.slug));
  }, [products, categories]);

  return (
    <section className="py-16 bg-paper">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-body font-semibold text-accent-gold uppercase tracking-wider bg-accent-gold/10 rounded-full px-3 py-1 mb-4 border border-accent-gold/20">
            <Zap className="w-3 h-3" />
            Marketplace Express
          </span>
          <h2 className="font-accent font-bold text-4xl sm:text-5xl text-ink mb-3">
            Compra. Paga. Recibe en horas.
          </h2>
          <p className="text-lg text-ink/60 font-body max-w-2xl mx-auto">
            Servicios digitales entregados por agentes IA supervisados. Precio fijo.
            Garantia 100%. Sin llamadas comerciales.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca un servicio (ej. logo, landing, copy, SEO...)"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-paper-deep border border-ink/[0.08] text-ink placeholder:text-ink/30 focus:border-accent-gold/50 focus:outline-none font-body"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-body transition border ${
                selectedCategory === "all"
                  ? "bg-accent-gold text-paper border-accent-gold"
                  : "bg-white/[0.04] text-ink/70 border-ink/[0.08] hover:border-accent-gold/40"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Todos ({products.length})
            </button>
            {activeCategories.map((cat) => {
              const Icon =
                cat.icon && iconMap[cat.icon] ? iconMap[cat.icon] : Sparkles;
              const count = products.filter((p) => p.category === cat.slug).length;
              const active = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-body transition border ${
                    active
                      ? "bg-accent-gold text-paper border-accent-gold"
                      : "bg-white/[0.04] text-ink/70 border-ink/[0.08] hover:border-accent-gold/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm font-body text-ink/60">
            <Filter className="w-4 h-4" />
            <span>Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-white/[0.04] border border-ink/[0.08] rounded-lg px-3 py-1.5 text-ink text-sm focus:border-accent-gold/40 focus:outline-none"
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
          <div className="text-center py-16 text-ink/50 font-body">
            No encontramos servicios con esos filtros. Prueba con otras palabras.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => {
              const extraBadges = badgesMap[p.slug] || [];
              const topFeatures = p.features.slice(0, 3);

              return (
                <CardTilt key={p.id} tiltMaxAngle={6} scale={1.015}>
                  <CardTiltContent>
                    <Link
                      href={`/servicios/${p.slug}`}
                      className="group relative rounded-2xl p-6 bg-paper-deep border border-ink/[0.06] hover:border-accent-gold/40 transition-all duration-500 card-golden-shine block h-full flex flex-col"
                    >
                      {/* Top row: category + badges */}
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-ink/40 bg-white/[0.04] rounded-md px-2 py-1 border border-white/[0.05]">
                          {p.category}
                        </span>

                        <div className="flex flex-wrap items-center gap-1 justify-end">
                          {/* DB badges primero */}
                          {extraBadges.slice(0, 2).map((b) => (
                            <span
                              key={b.label}
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 border ${
                                badgeColorClass[b.color] ||
                                badgeColorClass.gold
                              }`}
                            >
                              {b.label}
                            </span>
                          ))}
                          {/* Featured si no hay badges */}
                          {extraBadges.length === 0 && p.is_featured && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent-gold bg-accent-gold/10 border border-accent-gold/20 rounded-full px-2 py-0.5">
                              <Star className="w-2.5 h-2.5" />
                              Top
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <h3 className="font-heading font-bold text-xl text-ink mb-2 group-hover:text-accent-gold transition-colors leading-tight">
                        {p.name}
                      </h3>

                      {/* Tagline 2 lines truncate */}
                      <p className="text-sm text-ink/55 font-body mb-5 line-clamp-2 min-h-[40px] leading-relaxed">
                        {p.tagline}
                      </p>

                      {/* Mini grid 3 benefits icons */}
                      <div className="grid grid-cols-3 gap-2 mb-5 text-center">
                        <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] py-2">
                          <Clock className="w-3.5 h-3.5 text-accent-gold mx-auto mb-0.5" />
                          <div className="text-[11px] text-ink/70 font-body font-medium">
                            {formatSla(p.delivery_sla_hours)}
                          </div>
                          <div className="text-[9px] text-ink/35 font-body uppercase tracking-wider">
                            entrega
                          </div>
                        </div>
                        <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] py-2">
                          <RefreshCw className="w-3.5 h-3.5 text-accent-gold mx-auto mb-0.5" />
                          <div className="text-[11px] text-ink/70 font-body font-medium">
                            {p.revisions_included}
                          </div>
                          <div className="text-[9px] text-ink/35 font-body uppercase tracking-wider">
                            revisiones
                          </div>
                        </div>
                        <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] py-2">
                          <Sparkles className="w-3.5 h-3.5 text-accent-gold mx-auto mb-0.5" />
                          <div className="text-[11px] text-ink/70 font-body font-medium capitalize">
                            {p.agent_id}
                          </div>
                          <div className="text-[9px] text-ink/35 font-body uppercase tracking-wider">
                            agente
                          </div>
                        </div>
                      </div>

                      {/* Features preview — max 3 */}
                      {topFeatures.length > 0 && (
                        <ul className="space-y-1.5 mb-5 flex-1">
                          {topFeatures.map((f) => (
                            <li
                              key={f}
                              className="text-xs text-ink/70 font-body flex items-start gap-1.5"
                            >
                              <Check className="w-3 h-3 text-accent-gold flex-shrink-0 mt-0.5" />
                              <span className="truncate">{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Price + CTA slide */}
                      <div className="flex items-end justify-between pt-4 border-t border-ink/[0.06] mt-auto">
                        <div>
                          <div className="font-heading font-bold text-2xl text-ink">
                            {formatPrice(p.price_cents)}
                          </div>
                          <div className="text-[10px] text-ink/40 font-body inline-flex items-center gap-1 uppercase tracking-wider">
                            <span className="w-1 h-1 rounded-full bg-accent-gold/50 inline-block" />
                            Pago unico
                          </div>
                        </div>
                        <div className="relative h-8 overflow-hidden w-[110px]">
                          {/* Default CTA */}
                          <div className="absolute inset-0 inline-flex items-center justify-end gap-1 text-sm font-heading font-semibold text-accent-gold transform group-hover:-translate-y-full transition-transform duration-400 ease-apple">
                            Ver
                            <ArrowRight className="w-4 h-4" />
                          </div>
                          {/* Hover CTA */}
                          <div className="absolute inset-0 inline-flex items-center justify-end gap-1 text-sm font-heading font-semibold text-accent-gold-soft transform translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-apple">
                            Comprar
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CardTiltContent>
                </CardTilt>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
