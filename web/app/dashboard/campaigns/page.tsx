"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { dbCall } from "@/lib/dashboard-db";
import {
  Megaphone, Plus, X, Play, Pause, TrendingUp,
  Target, DollarSign, BarChart3, Eye, MousePointerClick,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Campaign {
  id: string;
  client_id: string;
  platform: string;
  campaign_name: string;
  objective: string;
  budget_daily: number;
  budget_total: number;
  budget_spent: number;
  target_audience: Record<string, unknown>;
  landing_url: string;
  status: string;
  performance: {
    impressions?: number;
    clicks?: number;
    ctr?: number;
    cpc?: number;
    conversions?: number;
    cpa?: number;
    roas?: number;
  };
  created_at: string;
}

interface Client {
  id: string;
  business_name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Play }> = {
  draft: { label: "Borrador", color: "#6B7280", icon: Pause },
  pending_review: { label: "En revision", color: "#D97706", icon: Eye },
  active: { label: "Activa", color: "#16A34A", icon: Play },
  paused: { label: "Pausada", color: "#EA580C", icon: Pause },
  completed: { label: "Completada", color: "#2563EB", icon: BarChart3 },
  error: { label: "Error", color: "#EF4444", icon: X },
};

const platformConfig: Record<string, { label: string; color: string }> = {
  meta: { label: "Meta Ads", color: "#1877F2" },
  google: { label: "Google Ads", color: "#4285F4" },
  tiktok: { label: "TikTok Ads", color: "#000000" },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "", platform: "meta", campaign_name: "", objective: "conversions",
    budget_daily: "", budget_total: "", landing_url: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [campaignsRes, clientsRes] = await Promise.all([
      supabase.from("ad_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, business_name").order("business_name"),
    ]);
    setCampaigns(campaignsRes.data || []);
    setClients(clientsRes.data || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await dbCall({
      table: "ad_campaigns",
      op: "insert",
      data: {
        client_id: form.client_id || null,
        platform: form.platform,
        campaign_name: form.campaign_name,
        objective: form.objective,
        budget_daily: form.budget_daily ? Number(form.budget_daily) : null,
        budget_total: form.budget_total ? Number(form.budget_total) : null,
        landing_url: form.landing_url || null,
      },
    });
    setForm({ client_id: "", platform: "meta", campaign_name: "", objective: "conversions", budget_daily: "", budget_total: "", landing_url: "" });
    setShowForm(false);
    setSaving(false);
    fetchData();
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === "active" ? "paused" : "active";
    await dbCall({ table: "ad_campaigns", op: "update", data: { status: next }, filter: { column: "id", value: id } });
    fetchData();
  }

  // Stats
  const active = campaigns.filter((c) => c.status === "active");
  const totalSpent = campaigns.reduce((s, c) => s + (Number(c.budget_spent) || 0), 0);
  const totalBudget = campaigns.reduce((s, c) => s + (Number(c.budget_total) || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.performance?.impressions || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.performance?.clicks || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white">Campanas</h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">
            {loading ? "Cargando..." : `${campaigns.length} campanas · ${active.length} activas`}
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="w-4 h-4" />Nueva campana
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <Megaphone className="w-6 h-6 text-electric-violet mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-pacame-white">{active.length}</div>
          <div className="text-xs text-pacame-white/40 font-body">Activas</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <DollarSign className="w-6 h-6 text-lime-pulse mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-lime-pulse">{totalSpent.toLocaleString("es-ES")}€</div>
          <div className="text-xs text-pacame-white/40 font-body">Gastado / {totalBudget.toLocaleString("es-ES")}€</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <Eye className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-neon-cyan">{totalImpressions.toLocaleString("es-ES")}</div>
          <div className="text-xs text-pacame-white/40 font-body">Impresiones</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <MousePointerClick className="w-6 h-6 text-electric-violet mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-pacame-white">{totalClicks.toLocaleString("es-ES")}</div>
          <div className="text-xs text-pacame-white/40 font-body">Clicks</div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl bg-dark-card border border-electric-violet/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-pacame-white">Nueva campana</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-pacame-white/30 hover:text-pacame-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required placeholder="Nombre de campana *"
              value={form.campaign_name} onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
            <select
              value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body focus:border-electric-violet/50 outline-none"
            >
              <option value="">— Cliente —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
            <select
              value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body focus:border-electric-violet/50 outline-none"
            >
              <option value="meta">Meta Ads (Facebook + Instagram)</option>
              <option value="google">Google Ads</option>
              <option value="tiktok">TikTok Ads</option>
            </select>
            <select
              value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body focus:border-electric-violet/50 outline-none"
            >
              <option value="conversions">Conversiones</option>
              <option value="traffic">Trafico</option>
              <option value="awareness">Alcance / Awareness</option>
              <option value="leads">Generacion de leads</option>
              <option value="engagement">Engagement</option>
            </select>
            <input
              type="number" step="0.01" placeholder="Budget diario (€)"
              value={form.budget_daily} onChange={(e) => setForm({ ...form, budget_daily: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
            <input
              type="number" step="0.01" placeholder="Budget total (€)"
              value={form.budget_total} onChange={(e) => setForm({ ...form, budget_total: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
            <input
              placeholder="URL de landing"
              value={form.landing_url} onChange={(e) => setForm({ ...form, landing_url: e.target.value })}
              className="col-span-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
          </div>
          <Button type="submit" variant="gradient" size="sm" disabled={saving}>
            {saving ? "Guardando..." : "Crear campana"}
          </Button>
        </form>
      )}

      {/* Campaign list */}
      <div className="space-y-3">
        {!loading && campaigns.length === 0 && (
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-12 text-center">
            <Megaphone className="w-8 h-8 text-pacame-white/20 mx-auto mb-3" />
            <p className="text-sm text-pacame-white/40 font-body">Sin campanas</p>
            <p className="text-xs text-pacame-white/50 font-body mt-1">Crea tu primera campana de ads</p>
          </div>
        )}
        {campaigns.map((c) => {
          const st = statusConfig[c.status] || statusConfig.draft;
          const pl = platformConfig[c.platform] || { label: c.platform, color: "#6B7280" };
          const clientName = clients.find((cl) => cl.id === c.client_id)?.business_name;
          const perf = c.performance || {};
          return (
            <div key={c.id} className="rounded-2xl bg-dark-card border border-white/[0.06] hover:border-white/10 p-5 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-heading font-semibold text-pacame-white">{c.campaign_name}</h3>
                    <span
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-body font-medium"
                      style={{ backgroundColor: `${st.color}20`, color: st.color }}
                    >
                      {st.label}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-body font-medium"
                      style={{ backgroundColor: `${pl.color}20`, color: pl.color }}
                    >
                      {pl.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap text-xs text-pacame-white/40 font-body">
                    {clientName && <span className="flex items-center gap-1"><Target className="w-3 h-3" />{clientName}</span>}
                    <span className="capitalize">{c.objective}</span>
                    {c.budget_daily && <span>{Number(c.budget_daily).toLocaleString("es-ES")}€/dia</span>}
                    {c.budget_total && <span>Total: {Number(c.budget_total).toLocaleString("es-ES")}€</span>}
                    {c.budget_spent > 0 && (
                      <span className="text-electric-violet">Gastado: {Number(c.budget_spent).toLocaleString("es-ES")}€</span>
                    )}
                  </div>
                  {/* Performance metrics */}
                  {(perf.impressions || perf.clicks || perf.conversions) && (
                    <div className="flex items-center gap-4 mt-3 text-xs font-body">
                      {perf.impressions && (
                        <span className="text-pacame-white/50">
                          <Eye className="w-3 h-3 inline mr-1" />{perf.impressions.toLocaleString("es-ES")} imp
                        </span>
                      )}
                      {perf.clicks && (
                        <span className="text-pacame-white/50">
                          <MousePointerClick className="w-3 h-3 inline mr-1" />{perf.clicks.toLocaleString("es-ES")} clicks
                        </span>
                      )}
                      {perf.ctr && <span className="text-neon-cyan">CTR: {perf.ctr.toFixed(2)}%</span>}
                      {perf.cpc && <span className="text-pacame-white/50">CPC: {perf.cpc.toFixed(2)}€</span>}
                      {perf.conversions && (
                        <span className="text-lime-pulse">
                          <TrendingUp className="w-3 h-3 inline mr-1" />{perf.conversions} conv
                        </span>
                      )}
                      {perf.roas && <span className="text-lime-pulse font-medium">ROAS: {perf.roas.toFixed(1)}x</span>}
                    </div>
                  )}
                </div>
                {(c.status === "active" || c.status === "paused") && (
                  <button
                    onClick={() => toggleStatus(c.id, c.status)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${st.color}15` }}
                  >
                    {c.status === "active" ? (
                      <Pause className="w-4 h-4" style={{ color: st.color }} />
                    ) : (
                      <Play className="w-4 h-4" style={{ color: "#16A34A" }} />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
