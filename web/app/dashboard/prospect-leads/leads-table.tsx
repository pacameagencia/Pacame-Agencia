"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Lead {
  id: string;
  slug: string;
  name: string;
  email: string;
  city: string | null;
  type: string | null;
  cuisine: string | null;
  vercel_url: string | null;
  status: string;
  sent_at: string | null;
  first_opened_at: string | null;
  open_count: number;
  first_clicked_at: string | null;
  click_count: number;
  replied_at: string | null;
  bounced_at: string | null;
  deal_value_eur: number | null;
  notes: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-zinc-700/30 text-zinc-300 border-zinc-600",
  sent: "bg-blue-500/15 text-blue-300 border-blue-500/40",
  delivered: "bg-blue-500/25 text-blue-200 border-blue-500/50",
  opened: "bg-amber-500/20 text-amber-300 border-amber-500/50",
  clicked: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
  replied: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50",
  won: "bg-yellow-500/30 text-yellow-200 border-yellow-500/60 font-bold",
  lost: "bg-zinc-700/30 text-zinc-400 border-zinc-600 line-through",
  bounced: "bg-rose-500/20 text-rose-300 border-rose-500/50",
  complained: "bg-rose-700/30 text-rose-200 border-rose-600",
  unsubscribed: "bg-zinc-600/30 text-zinc-400 border-zinc-500",
};

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [selected, setSelected] = useState<Lead | null>(null);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("prospect-leads-table")
      .on("postgres_changes", { event: "*", schema: "public", table: "prospect_leads" }, async () => {
        const { data } = await supabase
          .from("prospect_leads")
          .select(
            "id, slug, name, email, city, type, cuisine, vercel_url, status, sent_at, first_opened_at, open_count, first_clicked_at, click_count, replied_at, bounced_at, deal_value_eur, notes",
          )
          .order("sent_at", { ascending: false, nullsFirst: false })
          .limit(500);
        if (data) setLeads(data as Lead[]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => {
      if (q && !(l.name?.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q))) return false;
      if (statusFilter && l.status !== statusFilter) return false;
      if (typeFilter && l.type !== typeFilter) return false;
      if (cityFilter && l.city !== cityFilter) return false;
      return true;
    });
  }, [leads, search, statusFilter, typeFilter, cityFilter]);

  const cities = useMemo(() => Array.from(new Set(leads.map((l) => l.city).filter(Boolean))).sort() as string[], [leads]);
  const types = useMemo(() => Array.from(new Set(leads.map((l) => l.type).filter(Boolean))).sort() as string[], [leads]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre, email o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[260px] rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {Object.keys(STATUS_STYLES).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm">
          <option value="">Todos los tipos</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm">
          <option value="">Todas las ciudades</option>
          {cities.slice(0, 100).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-zinc-500 ml-auto">
          {filtered.length} / {leads.length} leads
        </span>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 sticky top-0 z-10">
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2.5 text-left font-medium">Lead</th>
                <th className="px-3 py-2.5 text-left font-medium">Estado</th>
                <th className="px-3 py-2.5 text-left font-medium">Enviado</th>
                <th className="px-3 py-2.5 text-left font-medium">Open</th>
                <th className="px-3 py-2.5 text-left font-medium">Click</th>
                <th className="px-3 py-2.5 text-left font-medium">Reply</th>
                <th className="px-3 py-2.5 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors cursor-pointer" onClick={() => setSelected(l)}>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-zinc-100">{l.name}</div>
                    <div className="text-xs text-zinc-500">{l.email}</div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">
                      {l.city || "—"} · {l.type || "—"} {l.cuisine ? `· ${l.cuisine}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${STATUS_STYLES[l.status] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-zinc-400 tabular-nums">{fmtDate(l.sent_at)}</td>
                  <td className="px-3 py-2.5 text-xs">
                    {l.first_opened_at ? (
                      <div>
                        <div className="text-amber-300 tabular-nums">{fmtDate(l.first_opened_at)}</div>
                        {l.open_count > 1 && <div className="text-[10px] text-zinc-500">×{l.open_count}</div>}
                      </div>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {l.first_clicked_at ? (
                      <div>
                        <div className="text-emerald-300 tabular-nums">{fmtDate(l.first_clicked_at)}</div>
                        {l.click_count > 1 && <div className="text-[10px] text-zinc-500">×{l.click_count}</div>}
                      </div>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {l.replied_at ? (
                      <div className="text-fuchsia-300 tabular-nums">{fmtDate(l.replied_at)}</div>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {l.vercel_url && (
                      <a href={l.vercel_url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="text-xs text-blue-400 hover:text-blue-300 underline">
                        ver web
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">No hay leads que coincidan con los filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <LeadDrawer lead={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [events, setEvents] = useState<Array<{ event_type: string; occurred_at: string; link_url?: string | null; user_agent?: string | null; ip?: string | null }>>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("email_events")
        .select("event_type, occurred_at, link_url, user_agent, ip")
        .eq("lead_id", lead.id)
        .order("occurred_at", { ascending: false });
      if (data) setEvents(data);
    })();
  }, [lead.id]);

  const waLink = lead.email ? null : null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative ml-auto w-full max-w-xl bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 p-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black">{lead.name}</h2>
            <p className="text-xs text-zinc-500 mt-1">{lead.email} · {lead.city || "?"}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xl">×</button>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-zinc-900 border border-zinc-800 p-3">
              <div className="text-xs text-zinc-500">Estado</div>
              <div className={`font-bold mt-1 ${STATUS_STYLES[lead.status] ? "" : "text-zinc-300"}`}>{lead.status}</div>
            </div>
            <div className="rounded-md bg-zinc-900 border border-zinc-800 p-3">
              <div className="text-xs text-zinc-500">Tipo</div>
              <div className="font-bold mt-1">{lead.type || "—"}{lead.cuisine ? ` · ${lead.cuisine}` : ""}</div>
            </div>
          </div>

          {lead.vercel_url && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Demo desplegada</h3>
              <a href={lead.vercel_url} target="_blank" rel="noopener" className="block rounded-md bg-zinc-900 border border-blue-500/30 hover:border-blue-500/60 transition-colors p-3 text-blue-400">
                {lead.vercel_url} ↗
              </a>
            </div>
          )}

          <div>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Timeline ({events.length} eventos)</h3>
            <ol className="space-y-2">
              {events.map((e, i) => (
                <li key={i} className="rounded-md bg-zinc-900 border border-zinc-800 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wide ${e.event_type.includes("opened") ? "text-amber-300" : e.event_type.includes("clicked") ? "text-emerald-300" : e.event_type.includes("bounced") ? "text-rose-300" : "text-zinc-300"}`}>
                      {e.event_type.replace("email.", "")}
                    </span>
                    <span className="text-xs text-zinc-500 tabular-nums">{fmtDate(e.occurred_at)}</span>
                  </div>
                  {e.link_url && <div className="text-xs text-blue-400 mt-1 truncate">{e.link_url}</div>}
                  {e.user_agent && <div className="text-[10px] text-zinc-600 mt-1 truncate">{e.user_agent}</div>}
                </li>
              ))}
              {events.length === 0 && (
                <div className="text-zinc-600 text-sm">Sin eventos aún. Cuando Resend recibe open/click se actualiza aquí en tiempo real.</div>
              )}
            </ol>
          </div>

          {lead.notes && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Notas</h3>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
