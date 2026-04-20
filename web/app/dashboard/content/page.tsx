"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { dbCall } from "@/lib/dashboard-db";
import {
  FileText, Check, X, Instagram, Linkedin, Facebook,
  Twitter, Clock, Bot, ChevronDown, Image, Send, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const platformIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  instagram: Instagram, linkedin: Linkedin, facebook: Facebook, twitter: Twitter,
};

const platformColors: Record<string, string> = {
  instagram: "#EC4899", linkedin: "#2563EB", facebook: "#3B82F6", twitter: "#06B6D4", blog: "#16A34A",
};

interface ContentItem {
  id: string;
  platform: string;
  content_type: string;
  title: string;
  body: string;
  hashtags: string;
  image_prompt: string;
  status: string;
  quality_score: number;
  subagents_used: string[];
  scheduled_for: string;
  created_at: string;
  client: { name: string; business_name: string } | null;
}

export default function ContentReviewPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase
        .from("content")
        .select("*, client:clients(name, business_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      setItems(data || []);
      setLoading(false);
    }
    fetchContent();
  }, []);

  const [publishing, setPublishing] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    await dbCall({ table: "content", op: "update", data: { status }, filter: { column: "id", value: id } });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  async function publishNow(id: string) {
    setPublishing(id);
    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", content_id: id }),
      });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "published" } : i)));
      }
    } catch {
      // Non-blocking
    }
    setPublishing(null);
  }

  async function approveAndPublish(id: string) {
    await updateStatus(id, "approved");
    await publishNow(id);
  }

  const pending = items.filter((i) => i.status === "pending_review");
  const reviewed = items.filter((i) => i.status !== "pending_review" && i.status !== "draft");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-pacame-white">Revision de contenido</h1>
        <p className="text-sm text-pacame-white/40 font-body mt-1">
          {loading ? "Cargando..." : `${pending.length} pendiente${pending.length !== 1 ? "s" : ""} de aprobacion`}
        </p>
      </div>

      {pending.length === 0 && !loading ? (
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-12 text-center">
          <Check className="w-10 h-10 text-lime-pulse mx-auto mb-3" />
          <p className="font-heading font-semibold text-pacame-white">Todo revisado</p>
          <p className="text-sm text-pacame-white/40 font-body mt-1">No hay contenido pendiente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((item) => {
            const PlatformIcon = platformIcons[item.platform] || FileText;
            const pColor = platformColors[item.platform] || "#7C3AED";
            const isExpanded = expandedId === item.id;
            const clientName = item.client?.business_name || item.client?.name || "Sin cliente";

            return (
              <div key={item.id} className="rounded-2xl bg-dark-card border border-white/[0.06] overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${pColor}20` }}>
                          <PlatformIcon className="w-4 h-4" style={{ color: pColor }} />
                        </div>
                        <div>
                          <span className="text-xs text-pacame-white/40 font-body">{clientName}</span>
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading font-semibold text-pacame-white text-sm">{item.title || "Sin titulo"}</h3>
                            {item.content_type && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-body" style={{ backgroundColor: `${pColor}15`, color: pColor }}>
                                {item.content_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <p className="text-sm text-pacame-white/70 font-body whitespace-pre-line leading-relaxed">
                          {isExpanded ? item.body : (item.body || "").slice(0, 200) + ((item.body || "").length > 200 ? "..." : "")}
                        </p>
                        {(item.body || "").length > 200 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="text-xs text-electric-violet hover:underline font-body mt-2 flex items-center gap-1"
                          >
                            {isExpanded ? "Ver menos" : "Ver todo"}
                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        )}
                      </div>

                      {item.hashtags && <p className="text-xs text-electric-violet/50 font-body mt-2">{item.hashtags}</p>}

                      {item.image_prompt && (
                        <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-white/[0.02]">
                          <Image className="w-3.5 h-3.5 text-pacame-white/30 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-pacame-white/30 font-body">{item.image_prompt}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        {item.scheduled_for && (
                          <span className="flex items-center gap-1 text-[11px] text-pacame-white/30 font-body">
                            <Clock className="w-3 h-3" />
                            {new Date(item.scheduled_for).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {item.subagents_used && item.subagents_used.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-pacame-white/30 font-body">
                            <Bot className="w-3 h-3" />{item.subagents_used.join(" → ")}
                          </span>
                        )}
                        {item.quality_score > 0 && (
                          <span className="text-[11px] font-body" style={{ color: item.quality_score >= 4 ? "#16A34A" : item.quality_score >= 3 ? "#D97706" : "#EF4444" }}>
                            QA: {item.quality_score}/5
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-5 py-3 border-t border-white/[0.04] bg-white/[0.02]">
                  <Button size="sm" variant="gradient" onClick={() => updateStatus(item.id, "approved")} className="gap-1.5">
                    <Check className="w-3.5 h-3.5" />Aprobar
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => approveAndPublish(item.id)}
                    disabled={publishing === item.id}
                    className="gap-1.5 text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10"
                  >
                    {publishing === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Aprobar y publicar
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => updateStatus(item.id, "rejected")}
                    className="gap-1.5 text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    <X className="w-3.5 h-3.5" />Rechazar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-lg text-pacame-white mb-3">Ya revisado</h2>
          <div className="space-y-2">
            {reviewed.map((item) => {
              const clientName = item.client?.business_name || item.client?.name || "";
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-card border border-white/[0.06] opacity-60">
                  {item.status === "approved" ? <Check className="w-4 h-4 text-lime-pulse" /> : item.status === "published" ? <Send className="w-4 h-4 text-cyan-400" /> : <X className="w-4 h-4 text-red-400" />}
                  <span className="text-sm text-pacame-white/60 font-body">{clientName}{clientName ? " — " : ""}{item.title}</span>
                  <span className="text-xs text-pacame-white/30 font-body ml-auto">
                    {item.status === "published" ? "Publicado" : item.status === "approved" ? "Aprobado" : "Rechazado"}
                  </span>
                  {item.status === "approved" && (
                    <Button
                      size="sm" variant="outline"
                      onClick={() => publishNow(item.id)}
                      disabled={publishing === item.id}
                      className="gap-1 text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10 ml-2"
                    >
                      {publishing === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Publicar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
