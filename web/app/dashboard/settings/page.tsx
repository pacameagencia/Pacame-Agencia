"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Settings, Save, Check, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfigRow {
  key: string;
  value: string | number | boolean;
  description: string;
  updated_at: string;
}

const configGroups: { title: string; keys: string[] }[] = [
  {
    title: "Comunicacion",
    keys: ["telegram_chat_id", "telegram_bot_token"],
  },
  {
    title: "APIs externas",
    keys: ["claude_api_key", "meta_graph_token", "meta_ads_token", "meta_ad_account_id", "whatsapp_phone_id", "resend_api_key", "buffer_api_key", "vapi_api_key", "elevenlabs_api_key", "elevenlabs_voice_id", "ga4_property_id"],
  },
  {
    title: "Modelos IA",
    keys: ["default_model", "volume_model", "strategy_model"],
  },
  {
    title: "Limites y precios",
    keys: ["monthly_budget_limit_eur", "monthly_ads_limit_eur", "min_price_landing", "min_price_web", "min_price_social_monthly", "referral_discount_pct", "annual_discount_pct", "pack_discount_pct", "proposal_expiry_days"],
  },
  {
    title: "Operacion",
    keys: ["content_auto_approve", "lead_score_threshold_hot", "quiet_hours_start", "quiet_hours_end"],
  },
];

export default function SettingsPage() {
  const [config, setConfig] = useState<Record<string, ConfigRow>>({});
  const [loading, setLoading] = useState(true);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from("config").select("*");
      const map: Record<string, ConfigRow> = {};
      for (const row of data || []) {
        map[row.key] = row;
      }
      setConfig(map);
      setLoading(false);
    }
    fetchConfig();
  }, []);

  function getDisplayValue(row: ConfigRow): string {
    if (row.value === null || row.value === undefined) return "";
    if (typeof row.value === "string") return row.value;
    return JSON.stringify(row.value);
  }

  async function saveKey(key: string) {
    const rawValue = edited[key];
    if (rawValue === undefined) return;

    // Try to parse as JSON, fallback to string
    let jsonValue: unknown;
    try {
      jsonValue = JSON.parse(rawValue);
    } catch {
      jsonValue = rawValue;
    }

    await supabase.from("config").update({ value: jsonValue, updated_at: new Date().toISOString() }).eq("key", key);

    setConfig((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: jsonValue as string | number | boolean },
    }));
    setEdited((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSavedKeys((prev) => new Set(prev).add(key));
    setTimeout(() => setSavedKeys((prev) => { const n = new Set(prev); n.delete(key); return n; }), 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-pacame-white">Configuracion</h1>
        <p className="text-sm text-pacame-white/40 font-body mt-1">
          {loading ? "Cargando..." : `${Object.keys(config).length} parametros del sistema`}
        </p>
      </div>

      {configGroups.map((group) => {
        const rows = group.keys.filter((k) => config[k]);
        if (rows.length === 0 && !loading) return null;
        return (
          <div key={group.title} className="rounded-2xl bg-dark-card border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.02]">
              <h2 className="font-heading font-semibold text-sm text-pacame-white">{group.title}</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {rows.map((key) => {
                const row = config[key];
                if (!row) return null;
                const currentValue = edited[key] !== undefined ? edited[key] : getDisplayValue(row);
                const isEdited = edited[key] !== undefined;
                const isSaved = savedKeys.has(key);
                const isSensitive = key.includes("key") || key.includes("token") || key.includes("secret");

                return (
                  <div key={key} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-electric-violet/70">{key}</div>
                      {row.description && <div className="text-[11px] text-pacame-white/30 font-body mt-0.5">{row.description}</div>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type={isSensitive ? "password" : "text"}
                        value={currentValue}
                        onChange={(e) => setEdited((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-56 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-pacame-white font-mono placeholder:text-pacame-white/20 focus:border-electric-violet/50 outline-none"
                      />
                      {isEdited && (
                        <Button size="sm" variant="gradient" onClick={() => saveKey(key)} className="h-7 px-2">
                          <Save className="w-3 h-3" />
                        </Button>
                      )}
                      {isSaved && <Check className="w-4 h-4 text-lime-pulse" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Seed demo data */}
      <SeedSection />
    </div>
  );
}

function SeedSection() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  async function seedDemoData() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: prompt("Password de dashboard:") }),
      });
      const data = await res.json();
      if (data.ok) {
        const summary = Object.entries(data.results).map(([k, v]) => `${k}: ${v}`).join(", ");
        setSeedResult(summary);
      } else {
        setSeedResult(`Error: ${data.error}`);
      }
    } catch {
      setSeedResult("Error de conexion");
    }
    setSeeding(false);
  }

  return (
    <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
      <h2 className="font-heading font-semibold text-sm text-pacame-white mb-3">Datos de demo</h2>
      <p className="text-xs text-pacame-white/40 font-body mb-4">
        Poblar el dashboard con datos de ejemplo para demos y pruebas.
      </p>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={seedDemoData} disabled={seeding} className="gap-1.5">
          {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
          {seeding ? "Sembrando datos..." : "Sembrar datos demo"}
        </Button>
        {seedResult && (
          <span className="text-xs text-pacame-white/50 font-body">{seedResult}</span>
        )}
      </div>
    </div>
  );
}
