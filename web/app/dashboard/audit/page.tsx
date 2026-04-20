"use client";

import { useEffect, useState } from "react";
import { Shield, Search, X } from "lucide-react";

interface AuditEntry {
  id: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  request_id: string | null;
  created_at: string;
}

// Clasificador de colores para acciones — visible de un vistazo.
function actionBadge(action: string): string {
  if (action.endsWith(".login")) return "text-green-400 bg-green-400/10";
  if (action.endsWith(".login_failed") || action.endsWith(".failed"))
    return "text-red-400 bg-red-400/10";
  if (action.endsWith(".delete")) return "text-red-400 bg-red-400/10";
  if (action.endsWith(".update")) return "text-blue-400 bg-blue-400/10";
  if (action.endsWith(".create")) return "text-blue-400 bg-blue-400/10";
  if (action.endsWith(".logout"))
    return "text-pacame-white/60 bg-white/5";
  return "text-yellow-400 bg-yellow-400/10";
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalEntry, setModalEntry] = useState<AuditEntry | null>(null);

  // Filtros
  const [filterActorId, setFilterActorId] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterResourceType, setFilterResourceType] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filterActorId) params.set("actor_id", filterActorId);
    if (filterAction) params.set("action", filterAction);
    if (filterResourceType) params.set("resource_type", filterResourceType);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    params.set("limit", "100");

    try {
      const res = await fetch(`/api/dashboard/audit?${params.toString()}`);
      if (res.status === 401) {
        setError("No autenticado. Inicia sesion en el dashboard.");
        setEntries([]);
        return;
      }
      if (res.status === 403) {
        setError("Sin permiso audit_log.read.");
        setEntries([]);
        return;
      }
      const body = await res.json();
      setEntries(body.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar audit log");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetFilters() {
    setFilterActorId("");
    setFilterAction("");
    setFilterResourceType("");
    setFilterFrom("");
    setFilterTo("");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-pacame-white">
            <Shield className="w-7 h-7 text-olympus-gold" />
            Audit log
          </h1>
          <p className="text-sm text-pacame-white/50 mt-1">
            Ultimas 100 acciones sensibles registradas.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-dark-elevated border border-white/[0.06] rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="actor_id"
            value={filterActorId}
            onChange={(e) => setFilterActorId(e.target.value)}
            className="px-3 py-2 bg-pacame-black border border-white/[0.08] rounded-lg text-sm text-pacame-white placeholder:text-pacame-white/30 focus:outline-none focus:border-electric-violet/50"
          />
          <input
            type="text"
            placeholder="action (substring)"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 bg-pacame-black border border-white/[0.08] rounded-lg text-sm text-pacame-white placeholder:text-pacame-white/30 focus:outline-none focus:border-electric-violet/50"
          />
          <input
            type="text"
            placeholder="resource_type"
            value={filterResourceType}
            onChange={(e) => setFilterResourceType(e.target.value)}
            className="px-3 py-2 bg-pacame-black border border-white/[0.08] rounded-lg text-sm text-pacame-white placeholder:text-pacame-white/30 focus:outline-none focus:border-electric-violet/50"
          />
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="px-3 py-2 bg-pacame-black border border-white/[0.08] rounded-lg text-sm text-pacame-white focus:outline-none focus:border-electric-violet/50"
          />
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="px-3 py-2 bg-pacame-black border border-white/[0.08] rounded-lg text-sm text-pacame-white focus:outline-none focus:border-electric-violet/50"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-electric-violet/20 hover:bg-electric-violet/30 border border-electric-violet/30 rounded-lg text-sm text-electric-violet font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            Filtrar
          </button>
          <button
            onClick={() => {
              resetFilters();
              void load();
            }}
            className="px-4 py-2 text-sm text-pacame-white/60 hover:text-pacame-white transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4 mb-6 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-dark-elevated border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] border-b border-white/[0.06]">
            <tr className="text-left text-pacame-white/60">
              <th className="px-4 py-3 font-medium">Cuando</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Accion</th>
              <th className="px-4 py-3 font-medium">Recurso</th>
              <th className="px-4 py-3 font-medium">IP</th>
              <th className="px-4 py-3 font-medium text-right">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-pacame-white/40">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && entries.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-pacame-white/40">
                  Sin entradas.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-pacame-white/60 whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString("es-ES")}
                </td>
                <td className="px-4 py-3 text-pacame-white">
                  <div className="font-medium">{e.actor_id || "—"}</div>
                  <div className="text-xs text-pacame-white/40">{e.actor_type}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium ${actionBadge(
                      e.action
                    )}`}
                  >
                    {e.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-pacame-white/60">
                  {e.resource_type ? (
                    <>
                      <div>{e.resource_type}</div>
                      <div className="text-xs text-pacame-white/40 truncate max-w-[200px]">
                        {e.resource_id || "—"}
                      </div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-pacame-white/50 font-mono text-xs">
                  {e.ip || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setModalEntry(e)}
                    className="text-xs text-electric-violet hover:underline"
                  >
                    ver metadata
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal metadata JSON */}
      {modalEntry && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalEntry(null)}
        >
          <div
            className="bg-dark-elevated border border-white/[0.08] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <div className="text-sm text-pacame-white/50">
                  {modalEntry.action}
                </div>
                <div className="text-xs text-pacame-white/30 mt-0.5">
                  {new Date(modalEntry.created_at).toLocaleString("es-ES")}
                </div>
              </div>
              <button
                onClick={() => setModalEntry(null)}
                className="text-pacame-white/40 hover:text-pacame-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-auto">
              <pre className="text-xs text-pacame-white/80 font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(
                  {
                    id: modalEntry.id,
                    actor_type: modalEntry.actor_type,
                    actor_id: modalEntry.actor_id,
                    resource_type: modalEntry.resource_type,
                    resource_id: modalEntry.resource_id,
                    ip: modalEntry.ip,
                    user_agent: modalEntry.user_agent,
                    request_id: modalEntry.request_id,
                    metadata: modalEntry.metadata,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
