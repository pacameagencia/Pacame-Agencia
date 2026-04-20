"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Sparkles, Layers, Package, Crown } from "lucide-react";

interface SearchResult {
  kind: "service" | "app" | "plan" | "category";
  slug: string;
  url: string;
  title: string;
  subtitle?: string | null;
  price?: string;
  category?: string | null;
}

const KIND_ICON: Record<string, React.ElementType> = {
  service: Package,
  app: Sparkles,
  plan: Crown,
  category: Layers,
};

const KIND_LABEL: Record<string, string> = {
  service: "Producto",
  app: "App",
  plan: "Plan",
  category: "Categoria",
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Keyboard shortcut: Cmd/Ctrl+K abre
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  // Debounced fetch
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(`/api/public/search?q=${encodeURIComponent(q)}`, {
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("bad");
      const data = (await res.json()) as { results: SearchResult[] };
      setResults(data.results || []);
      setActiveIdx(0);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 180);
    return () => clearTimeout(t);
  }, [query, search]);

  function navigate(idx: number) {
    const r = results[idx];
    if (!r) return;
    setOpen(false);
    router.push(r.url);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      navigate(activeIdx);
    }
  }

  return (
    <>
      {/* Trigger button — desktop (muestra shortcut) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-pacame-white/50 hover:text-pacame-white hover:border-white/[0.15] transition text-sm"
        aria-label="Buscar"
      >
        <Search className="w-4 h-4" />
        <span>Buscar...</span>
        <span className="hidden lg:inline-block px-1.5 py-0.5 rounded-md border border-white/[0.1] font-mono text-[10px] text-pacame-white/40">
          ⌘K
        </span>
      </button>

      {/* Trigger mobile — icon only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-pacame-white/60 hover:text-pacame-white"
        aria-label="Buscar"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-2xl bg-dark-card border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
            {/* Input */}
            <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
              <Search className="w-5 h-5 text-olympus-gold flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Busca productos, apps, planes..."
                className="flex-1 bg-transparent border-0 outline-none text-pacame-white placeholder:text-pacame-white/30 text-lg"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded-md hover:bg-white/[0.04] text-pacame-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-md border border-white/[0.1] font-mono text-[10px] text-pacame-white/40">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loading && query.length >= 2 && (
                <div className="p-6 text-center text-pacame-white/50 text-sm">
                  Buscando...
                </div>
              )}
              {!loading && query.length < 2 && (
                <div className="p-6 text-center text-pacame-white/40 text-sm">
                  Escribe al menos 2 caracteres
                </div>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <div className="p-6 text-center text-pacame-white/50 text-sm">
                  Sin resultados para &quot;{query}&quot;
                </div>
              )}
              {!loading && results.length > 0 && (
                <ul className="space-y-1">
                  {results.map((r, i) => {
                    const Icon = KIND_ICON[r.kind] || Package;
                    const active = i === activeIdx;
                    return (
                      <li key={`${r.kind}-${r.slug}`}>
                        <button
                          onClick={() => navigate(i)}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                            active
                              ? "bg-olympus-gold/10 border border-olympus-gold/30"
                              : "hover:bg-white/[0.04] border border-transparent"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              active
                                ? "bg-olympus-gold/20 text-olympus-gold"
                                : "bg-white/[0.04] text-pacame-white/60"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-pacame-white truncate">
                                {r.title}
                              </span>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-pacame-white/40">
                                {KIND_LABEL[r.kind]}
                              </span>
                            </div>
                            {r.subtitle && (
                              <div className="text-xs text-pacame-white/60 truncate mt-0.5">
                                {r.subtitle}
                              </div>
                            )}
                          </div>
                          {r.price && (
                            <span className="text-sm font-semibold text-olympus-gold flex-shrink-0">
                              {r.price}
                            </span>
                          )}
                          <ArrowRight className="w-4 h-4 text-pacame-white/30 flex-shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between p-3 border-t border-white/[0.06] text-[11px] text-pacame-white/40 font-body">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded border border-white/[0.1] font-mono">↑↓</kbd>{" "}
                  navegar
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded border border-white/[0.1] font-mono">↵</kbd>{" "}
                  ir
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded border border-white/[0.1] font-mono">esc</kbd>{" "}
                  cerrar
                </span>
              </div>
              <span className="text-olympus-gold/60">PACAME</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
