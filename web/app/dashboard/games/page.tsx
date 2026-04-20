"use client";

import { useCallback, useEffect, useState } from "react";
import { Gamepad2, Plus, Eye, EyeOff, Sparkles, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

interface GameRow {
  id: string;
  slug: string;
  title: string;
  engine: string;
  is_active: boolean;
  is_featured: boolean;
  play_count: number;
  created_at: string;
  has_build: boolean;
}

export default function GamesAdminPage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/games", { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      setGames(json.games || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/games/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_active: active }),
    });
    fetchGames();
  }

  async function remove(id: string) {
    if (!confirm("Seguro que quieres borrar este game?")) return;
    await fetch(`/api/admin/games/${id}`, { method: "DELETE" });
    fetchGames();
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-2xl text-ink flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-creative" /> Games
          </h1>
          <p className="text-sm text-ink/40 font-body mt-1">
            Sube builds Unity WebGL + gestiona catalogo publico
          </p>
        </div>
        <Link
          href="/dashboard/games/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold text-ink font-semibold text-sm hover:brightness-110 transition"
        >
          <Plus className="w-4 h-4" /> Subir nuevo build
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-ink/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando...
        </div>
      ) : games.length === 0 ? (
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-10 text-center">
          <Gamepad2 className="w-10 h-10 text-ink/30 mx-auto mb-3" />
          <div className="font-heading font-semibold text-ink">Sin games todavia</div>
          <p className="text-sm text-ink/40 mt-2">
            Exporta tu proyecto Unity como WebGL build y subelo aqui.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02]">
              <tr className="text-left text-[10px] uppercase tracking-wider text-ink/40 font-mono">
                <th className="p-3 pl-5">Status</th>
                <th className="p-3">Titulo</th>
                <th className="p-3">Engine</th>
                <th className="p-3 text-right">Plays</th>
                <th className="p-3 text-right pr-5">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr
                  key={g.id}
                  className="border-t border-ink/[0.04] hover:bg-white/[0.02] transition"
                >
                  <td className="p-3 pl-5">
                    <div className="flex items-center gap-2">
                      {g.is_active ? (
                        <Eye className="w-4 h-4 text-mint" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-ink/30" />
                      )}
                      {g.is_featured && (
                        <Sparkles className="w-4 h-4 text-accent-gold" />
                      )}
                      {!g.has_build && (
                        <span className="text-[10px] text-accent-burgundy font-mono uppercase">
                          no-build
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/games/${g.slug}`}
                      target="_blank"
                      className="font-heading font-semibold text-ink hover:text-brand-primary transition"
                    >
                      {g.title}
                    </Link>
                    <div className="text-[11px] text-ink/40 font-mono">{g.slug}</div>
                  </td>
                  <td className="p-3 text-ink/60 font-mono text-xs uppercase">
                    {g.engine}
                  </td>
                  <td className="p-3 text-right text-ink font-heading">
                    {g.play_count}
                  </td>
                  <td className="p-3 text-right pr-5">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(g.id, !g.is_active)}
                        className="px-2 py-1 rounded-md bg-ink/5 hover:bg-ink/10 text-xs text-ink/70 transition"
                      >
                        {g.is_active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => remove(g.id)}
                        className="p-1 rounded-md hover:bg-red-500/10 text-red-400 transition"
                        aria-label="Borrar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
