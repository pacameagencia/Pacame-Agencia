"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, ArrowRight, Zap, Users, Filter, X, ChevronDown,
  Sparkles, Globe, TrendingUp, Layout, Terminal, Heart, Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { agents as pacameAgents } from "@/lib/data/agents";
import {
  agencyAgents,
  divisions,
  TOTAL_AGENTS,
  getAgentsByDivision,
  searchAgents,
  type AgencyAgent,
} from "@/lib/data/agency-agents";

const pacameParentMap: Record<string, { name: string; color: string; icon: string }> = {
  pixel: { name: "Pixel", color: "#06B6D4", icon: "Layout" },
  core: { name: "Core", color: "#16A34A", icon: "Terminal" },
  atlas: { name: "Atlas", color: "#2563EB", icon: "Globe" },
  nexus: { name: "Nexus", color: "#EA580C", icon: "TrendingUp" },
  nova: { name: "Nova", color: "#7C3AED", icon: "Sparkles" },
  pulse: { name: "Pulse", color: "#EC4899", icon: "Heart" },
  sage: { name: "Sage", color: "#D97706", icon: "Compass" },
};

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress >= 1) clearInterval(interval);
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

export default function AgentesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDivision, setActiveDivision] = useState<string | null>(null);
  const [activeParent, setActiveParent] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const counter = useAnimatedCounter(TOTAL_AGENTS);

  const filteredAgents = useMemo(() => {
    let result = agencyAgents;
    
    if (searchQuery.trim()) {
      result = searchAgents(searchQuery);
    }
    if (activeDivision) {
      result = result.filter(a => a.division === activeDivision);
    }
    if (activeParent) {
      result = result.filter(a => a.pacameParent === activeParent);
    }
    
    return result;
  }, [searchQuery, activeDivision, activeParent]);

  const clearFilters = () => {
    setSearchQuery("");
    setActiveDivision(null);
    setActiveParent(null);
  };

  const hasFilters = searchQuery || activeDivision || activeParent;

  return (
    <div className="min-h-screen bg-paper">
      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-hero-glow opacity-50 pointer-events-none" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-olive-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-brand-primary/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mustard-500/10 border border-mustard-500/30 mb-8">
              <Zap className="w-4 h-4 text-mustard-600" />
              <span className="text-sm font-mono text-mustard-600">Catalogo de Agentes IA</span>
            </div>

            {/* Counter */}
            <div ref={counter.ref} className="mb-6">
              <span className="text-8xl md:text-9xl font-heading font-bold gradient-text-gold">
                {counter.count}+
              </span>
            </div>

            <h1 className="font-accent font-bold text-hero text-ink mb-6">
              Especialistas IA a tu servicio
            </h1>
            <p className="text-lg md:text-xl text-ink/60 max-w-3xl mx-auto font-body mb-6">
              7 agentes PACAME principales + {agencyAgents.length} sub-especialistas organizados en {divisions.length} divisiones.
              Cada uno domina su campo. Todos trabajan para ti.
            </p>

            {/* ── Disclaimer IA editorial ── */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-10 border border-mustard-500/40 bg-mustard-500/5 rounded-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-mustard-500 opacity-50 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-mustard-500" />
              </span>
              <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-mustard-700">
                Personajes editoriales · Agentes IA generados
              </span>
            </div>

            {/* Search bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/50" />
              <input
                type="text"
                placeholder="Buscar agentes... (ej: SEO, React, TikTok, Security)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-sand-50 border border-ink/[0.08] rounded-2xl text-ink placeholder-ink/30 font-body focus:outline-none focus:border-mustard-500/50 focus:ring-1 focus:ring-mustard-500/30 transition-all"
                id="agent-search"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-ink/50" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PACAME CORE AGENTS ===== */}
      <section className="py-12 border-t border-b border-ink/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-5 h-5 text-mustard-600" />
            <h2 className="font-heading font-bold text-xl text-ink">
              El Panteon PACAME
            </h2>
            <span className="text-sm font-mono text-ink/60">7 agentes core</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {pacameAgents.map((agent) => {
              const isActive = activeParent === agent.id;
              const subCount = agencyAgents.filter(a => a.pacameParent === agent.id).length;
              return (
                <button
                  key={agent.id}
                  onClick={() => setActiveParent(isActive ? null : agent.id)}
                  className={`group relative rounded-xl p-4 border transition-all duration-300 text-left ${
                    isActive
                      ? "border-opacity-60 -translate-y-1 shadow-lg"
                      : "border-ink/[0.06] hover:border-opacity-30 hover:-translate-y-0.5"
                  }`}
                  style={{
                    borderColor: isActive ? agent.color : undefined,
                    backgroundColor: isActive ? `${agent.color}15` : "rgba(26,26,46,0.6)",
                    boxShadow: isActive ? `0 8px 30px ${agent.color}25` : undefined,
                  }}
                >
                  <div
                    className="relative w-14 h-14 rounded-full overflow-hidden border-2 mb-3 bg-sand-50"
                    style={{ borderColor: agent.color }}
                  >
                    <Image
                      src={`/generated/agents/${agent.id}.png`}
                      alt={`Retrato editorial de ${agent.name} (personaje IA)`}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <p className="font-heading font-bold text-sm mb-0.5" style={{ color: agent.color }}>
                    {agent.name}
                  </p>
                  <p className="text-[10px] text-ink/60 font-body">
                    +{subCount} especialistas
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== DIVISION FILTERS ===== */}
      <section className="py-8 sticky top-16 z-40 bg-paper/95 backdrop-blur-xl border-b border-ink/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-ink/60" />
              <span className="text-sm font-body text-ink/60">Filtrar por división</span>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-mono text-mustard-600 hover:text-mustard-600/80 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveDivision(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all ${
                !activeDivision
                  ? "bg-accent-gold text-ink"
                  : "bg-sand-50 text-ink/50 hover:text-ink/80 border border-ink/[0.06]"
              }`}
            >
              Todas ({agencyAgents.length})
            </button>
            {divisions.map((div) => {
              const isActive = activeDivision === div.id;
              const count = getAgentsByDivision(div.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={div.id}
                  onClick={() => setActiveDivision(isActive ? null : div.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "text-white"
                      : "bg-sand-50 text-ink/50 hover:text-ink/80 border border-ink/[0.06]"
                  }`}
                  style={{
                    backgroundColor: isActive ? div.color : undefined,
                  }}
                >
                  <span>{div.emoji}</span>
                  <span>{div.label}</span>
                  <span className={`${isActive ? "text-white/70" : "text-ink/50"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== AGENTS GRID ===== */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results count */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm font-body text-ink/60">
              {filteredAgents.length} agente{filteredAgents.length !== 1 ? "s" : ""} encontrado{filteredAgents.length !== 1 ? "s" : ""}
              {hasFilters && " con los filtros aplicados"}
            </p>
          </div>

          {filteredAgents.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-sand-50 border border-ink/[0.06] flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-ink/50" />
              </div>
              <p className="text-ink/60 font-body mb-4">
                No se encontraron agentes con esos filtros
              </p>
              <button
                onClick={clearFilters}
                className="text-sm text-mustard-600 hover:text-mustard-600/80 font-body transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAgents.map((agent, index) => {
                const parent = pacameParentMap[agent.pacameParent];
                const div = divisions.find(d => d.id === agent.division);
                return (
                  <div
                    key={agent.id}
                    className="group relative rounded-2xl p-5 bg-sand-50 border border-ink/[0.06] hover:border-ink/[0.12] transition-all duration-300 hover:-translate-y-1"
                    style={{
                      animationDelay: `${(index % 20) * 0.03}s`,
                    }}
                  >
                    {/* Top row: emoji + division badge */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{agent.emoji}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                        style={{
                          backgroundColor: div ? `${div.color}15` : undefined,
                          color: div?.color,
                          border: `1px solid ${div?.color}30`,
                        }}
                      >
                        {div?.emoji} {agent.divisionLabel}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="font-heading font-bold text-base text-ink mb-1 group-hover:text-white transition-colors">
                      {agent.name}
                    </h3>

                    {/* Specialty */}
                    <p className="text-sm text-ink/60 font-body mb-3 line-clamp-2 leading-relaxed">
                      {agent.specialty}
                    </p>

                    {/* When to use */}
                    <p className="text-xs text-ink/60 font-body mb-4 line-clamp-2">
                      <span className="text-olive-500 font-mono">Cuándo usar →</span> {agent.whenToUse}
                    </p>

                    {/* Parent agent badge */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-heading font-bold"
                        style={{
                          backgroundColor: `${parent.color}25`,
                          color: parent.color,
                        }}
                      >
                        {parent.name.charAt(0)}
                      </div>
                      <span className="text-[11px] font-body" style={{ color: `${parent.color}AA` }}>
                        Sub-especialista de {parent.name}
                      </span>
                    </div>

                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        boxShadow: `inset 0 1px 0 0 ${div?.color}20, 0 0 40px ${div?.color}08`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="py-16 bg-paper-soft border-t border-ink/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: `${TOTAL_AGENTS}+`, label: "Agentes especializados", icon: "🤖" },
              { value: `${divisions.length}`, label: "Divisiones", icon: "🏢" },
              { value: "7", label: "Agentes PACAME core", icon: "⚡" },
              { value: "24/7", label: "Disponibilidad", icon: "🕐" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <span className="text-2xl mb-2 block">{stat.icon}</span>
                <p className="text-3xl md:text-4xl font-heading font-bold gradient-text-gold mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-ink/60 font-body">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient opacity-5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-hero-glow opacity-30 pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="font-accent font-bold text-section text-ink mb-6">
            Necesitas un equipo{" "}
            <span className="gradient-text-aurora">de elite</span>?
          </h2>
          <p className="text-lg text-ink/60 font-body mb-10">
            No contratas freelancers. No esperas meses. Activas un equipo de {TOTAL_AGENTS}+ especialistas IA
            coordinados por un humano que garantiza calidad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gradient" size="lg" asChild className="group">
              <Link href="/contacto">
                Hablar con el equipo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/servicios">
                Ver servicios
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
