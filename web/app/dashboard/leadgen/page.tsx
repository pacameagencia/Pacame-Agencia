"use client";

import { useState } from "react";
import {
  Rocket, Globe, MapPin, Search, CheckCircle2, AlertCircle,
  Mail, ArrowRight, Loader2, Download, Eye, Send, Building2,
  Star, ExternalLink, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { niches, cities } from "@/lib/data/lead-gen-config";

interface ScrapedLead {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviews: number;
  category: string;
  city: string;
  maps_url: string;
  auditScore?: number;
  auditIssues?: string[];
  auditLoading?: boolean;
  emails?: Record<string, { subject: string; body: string }>;
  emailsLoading?: boolean;
}

type PipelineStep = "config" | "scraping" | "results" | "auditing" | "outreach" | "done";

export default function LeadGenPage() {
  const [step, setStep] = useState<PipelineStep>("config");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [maxPerSearch, setMaxPerSearch] = useState(30);
  const [leads, setLeads] = useState<ScrapedLead[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [auditProgress, setAuditProgress] = useState({ done: 0, total: 0 });
  const [outreachProgress, setOutreachProgress] = useState({ done: 0, total: 0 });

  function toggleNiche(id: string) {
    setSelectedNiches((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  }

  function toggleCity(id: string) {
    setSelectedCities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  // Step 1: Launch scraping
  async function launchScrape() {
    if (!selectedNiches.length || !selectedCities.length) return;
    setStep("scraping");

    const nicheObj = niches.find((n) => n.id === selectedNiches[0]);
    const cityObj = cities.find((c) => c.id === selectedCities[0]);
    if (!nicheObj || !cityObj) return;

    try {
      const res = await fetch("/api/leadgen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scrape",
          niche: nicheObj.query,
          city: cityObj.name,
          maxResults: maxPerSearch,
        }),
      });
      const data = await res.json();
      if (data.runId) {
        setRunId(data.runId);
        pollResults(data.runId);
      }
    } catch {
      setStep("config");
    }
  }

  // Poll for scraping results
  async function pollResults(id: string) {
    setPolling(true);
    const poll = async () => {
      try {
        const res = await fetch("/api/leadgen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "results", runId: id }),
        });
        const data = await res.json();
        if (data.status === "SUCCEEDED" && data.leads) {
          setLeads(data.leads);
          setStep("results");
          setPolling(false);
        } else if (data.status === "FAILED" || data.status === "ABORTED") {
          setStep("config");
          setPolling(false);
        } else {
          setTimeout(() => poll(), 5000);
        }
      } catch {
        setTimeout(() => poll(), 5000);
      }
    };
    poll();
  }

  // Step 2: Audit websites
  async function auditAll() {
    setStep("auditing");
    const withWebsite = leads.filter((l) => l.website);
    setAuditProgress({ done: 0, total: withWebsite.length });

    for (let i = 0; i < withWebsite.length; i++) {
      const lead = withWebsite[i];
      try {
        const res = await fetch("/api/leadgen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "audit", url: lead.website }),
        });
        const data = await res.json();
        setLeads((prev) =>
          prev.map((l) =>
            l.name === lead.name
              ? { ...l, auditScore: data.score, auditIssues: data.issues }
              : l
          )
        );
      } catch {
        setLeads((prev) =>
          prev.map((l) =>
            l.name === lead.name
              ? { ...l, auditScore: 0, auditIssues: ["Error auditing"] }
              : l
          )
        );
      }
      setAuditProgress({ done: i + 1, total: withWebsite.length });
    }
    setStep("results");
  }

  // Step 3: Generate outreach for high-opportunity leads
  async function generateOutreach() {
    const targets = leads.filter(
      (l) => l.website && (l.auditScore !== undefined ? l.auditScore < 80 : true)
    );
    setStep("outreach");
    setOutreachProgress({ done: 0, total: targets.length });

    for (let i = 0; i < targets.length; i++) {
      const lead = targets[i];
      try {
        const res = await fetch("/api/leadgen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "outreach",
            lead: { name: lead.name, category: lead.category, city: lead.city, website: lead.website, rating: lead.rating, reviews: lead.reviews },
            audit: { score: lead.auditScore || 0, issues: lead.auditIssues || [] },
          }),
        });
        const data = await res.json();
        if (data.emails) {
          setLeads((prev) =>
            prev.map((l) =>
              l.name === lead.name ? { ...l, emails: data.emails } : l
            )
          );
        }
      } catch { /* continue */ }
      setOutreachProgress({ done: i + 1, total: targets.length });
    }
    setStep("done");
  }

  // Save qualified leads to Supabase
  async function saveToSupabase() {
    setSaving(true);
    const qualified = leads.filter((l) => l.auditScore !== undefined || l.emails);
    const nicheNames = selectedNiches.map((id) => niches.find((n) => n.id === id)?.name).join(", ");
    const cityNames = selectedCities.map((id) => cities.find((c) => c.id === id)?.name).join(", ");

    try {
      const res = await fetch("/api/leadgen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          campaignName: `${nicheNames} — ${cityNames}`,
          leads: qualified.map((l) => ({
            ...l,
            auditScore: l.auditScore,
            auditIssues: l.auditIssues,
          })),
        }),
      });
      const data = await res.json();
      setSavedCount(data.saved || 0);
    } catch { /* */ }
    setSaving(false);
  }

  const qualifiedLeads = leads.filter(
    (l) => l.auditScore !== undefined && l.auditScore < 80
  );

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-ink flex items-center gap-2">
            <Rocket className="w-6 h-6 text-brand-primary" />
            Lead Gen Outbound
          </h1>
          <p className="text-sm text-ink/40 font-body mt-1">
            Scrape, audita, cualifica y contacta negocios en toda Espana
          </p>
        </div>
        {leads.length > 0 && (
          <div className="flex gap-2">
            {step === "results" && !leads.some((l) => l.auditScore !== undefined) && (
              <Button variant="outline" size="sm" onClick={auditAll}>
                <Search className="w-4 h-4" /> Auditar webs
              </Button>
            )}
            {leads.some((l) => l.auditScore !== undefined) && !leads.some((l) => l.emails) && (
              <Button variant="outline" size="sm" onClick={generateOutreach}>
                <Mail className="w-4 h-4" /> Generar emails
              </Button>
            )}
            {(step === "results" || step === "done") && (
              <Button variant="gradient" size="sm" onClick={saveToSupabase} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {savedCount > 0 ? `${savedCount} guardados` : "Guardar en CRM"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pipeline steps */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "config", label: "1. Configurar", icon: Settings2Icon },
          { key: "scraping", label: "2. Scraping", icon: Globe },
          { key: "results", label: "3. Resultados", icon: Building2 },
          { key: "auditing", label: "4. Auditoria", icon: Search },
          { key: "outreach", label: "5. Emails", icon: Mail },
          { key: "done", label: "6. Listo", icon: CheckCircle2 },
        ].map((s) => (
          <div
            key={s.key}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-body whitespace-nowrap ${
              step === s.key
                ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30"
                : leads.length > 0 && ["config"].indexOf(s.key) >= 0
                ? "bg-mint/10 text-mint/60 border border-mint/20"
                : "text-ink/30 border border-ink/[0.06]"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </div>
        ))}
      </div>

      {/* CONFIG STEP */}
      {step === "config" && (
        <div className="space-y-6">
          {/* Niche selection */}
          <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-6">
            <h2 className="font-heading font-semibold text-ink mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-mint" />
              Tipo de negocio
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {niches.map((n) => (
                <button
                  key={n.id}
                  onClick={() => toggleNiche(n.id)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-body border transition-all text-left ${
                    selectedNiches.includes(n.id)
                      ? "bg-brand-primary/15 border-brand-primary/40 text-brand-primary"
                      : "bg-transparent border-ink/[0.06] text-ink/50 hover:border-white/15 hover:text-ink/70"
                  }`}
                >
                  <span className="mr-1.5">{n.icon}</span> {n.name}
                </button>
              ))}
            </div>
          </div>

          {/* City selection */}
          <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-6">
            <h2 className="font-heading font-semibold text-ink mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-mint" />
              Ciudad
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {cities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleCity(c.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-body border transition-all ${
                    selectedCities.includes(c.id)
                      ? "bg-mint/15 border-mint/40 text-mint"
                      : "bg-transparent border-ink/[0.06] text-ink/50 hover:border-white/15 hover:text-ink/70"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Settings + launch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm text-ink/50 font-body">
                Max resultados:
                <select
                  value={maxPerSearch}
                  onChange={(e) => setMaxPerSearch(Number(e.target.value))}
                  className="ml-2 bg-paper-deep border border-ink/[0.08] text-ink rounded-lg px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
              <span className="text-xs text-ink/30 font-body">
                {selectedNiches.length} nicho(s) x {selectedCities.length} ciudad(es) = {selectedNiches.length * selectedCities.length} busquedas
              </span>
            </div>
            <Button
              variant="gradient"
              size="lg"
              onClick={launchScrape}
              disabled={!selectedNiches.length || !selectedCities.length}
              className="group"
            >
              <Zap className="w-4 h-4" />
              Lanzar scraping
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      {/* SCRAPING STEP */}
      {step === "scraping" && (
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-12 text-center">
          <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-ink mb-2">
            Scrapeando Google Maps...
          </h2>
          <p className="text-sm text-ink/40 font-body mb-4">
            Buscando negocios. Esto puede tardar 1-3 minutos.
          </p>
          {runId && (
            <p className="text-xs text-ink/20 font-mono">Run ID: {runId}</p>
          )}
        </div>
      )}

      {/* AUDITING STEP */}
      {step === "auditing" && (
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-12 text-center">
          <Search className="w-10 h-10 text-mint animate-pulse mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-ink mb-2">
            Auditando webs...
          </h2>
          <p className="text-sm text-ink/40 font-body">
            {auditProgress.done} / {auditProgress.total} webs analizadas
          </p>
          <div className="mt-4 w-64 mx-auto bg-white/[0.06] rounded-full h-2">
            <div
              className="h-2 rounded-full bg-mint transition-all duration-300"
              style={{ width: `${auditProgress.total ? (auditProgress.done / auditProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* OUTREACH STEP */}
      {step === "outreach" && (
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-12 text-center">
          <Mail className="w-10 h-10 text-brand-primary animate-pulse mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-ink mb-2">
            Generando emails personalizados...
          </h2>
          <p className="text-sm text-ink/40 font-body">
            {outreachProgress.done} / {outreachProgress.total} negocios
          </p>
          <div className="mt-4 w-64 mx-auto bg-white/[0.06] rounded-full h-2">
            <div
              className="h-2 rounded-full bg-brand-primary transition-all duration-300"
              style={{ width: `${outreachProgress.total ? (outreachProgress.done / outreachProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* RESULTS + DONE */}
      {(step === "results" || step === "done") && leads.length > 0 && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-paper-deep border border-ink/[0.06] p-4">
              <p className="text-2xl font-heading font-bold text-ink">{leads.length}</p>
              <p className="text-xs text-ink/40 font-body">Negocios encontrados</p>
            </div>
            <div className="rounded-xl bg-paper-deep border border-ink/[0.06] p-4">
              <p className="text-2xl font-heading font-bold text-mint">{leads.filter((l) => l.website).length}</p>
              <p className="text-xs text-ink/40 font-body">Con website</p>
            </div>
            <div className="rounded-xl bg-paper-deep border border-ink/[0.06] p-4">
              <p className="text-2xl font-heading font-bold text-mint">{qualifiedLeads.length}</p>
              <p className="text-xs text-ink/40 font-body">Oportunidades (web &lt;80)</p>
            </div>
            <div className="rounded-xl bg-paper-deep border border-ink/[0.06] p-4">
              <p className="text-2xl font-heading font-bold text-brand-primary">{leads.filter((l) => l.emails).length}</p>
              <p className="text-xs text-ink/40 font-body">Emails generados</p>
            </div>
          </div>

          {/* Lead list */}
          <div className="space-y-2">
            {leads.map((lead) => (
              <div
                key={lead.name + lead.address}
                className="rounded-xl bg-paper-deep border border-ink/[0.06] hover:border-white/10 transition-all"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedLead(expandedLead === lead.name ? null : lead.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0">
                        {lead.auditScore !== undefined ? (
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold font-heading ${
                              lead.auditScore >= 80
                                ? "bg-mint/20 text-mint"
                                : lead.auditScore >= 50
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {lead.auditScore}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-ink/30" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-semibold text-sm text-ink truncate">
                          {lead.name}
                        </h3>
                        <p className="text-xs text-ink/40 font-body truncate">
                          {lead.category} · {lead.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {lead.rating > 0 && (
                        <span className="flex items-center gap-1 text-xs text-yellow-400 font-body">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          {lead.rating} ({lead.reviews.toLocaleString()})
                        </span>
                      )}
                      {lead.emails && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary font-body">
                          emails listos
                        </span>
                      )}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="text-ink/30 hover:text-mint transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedLead === lead.name && (
                  <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-body">
                      {lead.phone && (
                        <div>
                          <span className="text-ink/30">Telefono</span>
                          <p className="text-ink/70">{lead.phone}</p>
                        </div>
                      )}
                      {lead.website && (
                        <div>
                          <span className="text-ink/30">Website</span>
                          <p className="text-mint/70 truncate">{lead.website}</p>
                        </div>
                      )}
                      {lead.auditScore !== undefined && (
                        <div>
                          <span className="text-ink/30">Score web</span>
                          <p className="text-ink/70">{lead.auditScore}/100</p>
                        </div>
                      )}
                      {lead.auditIssues && lead.auditIssues.length > 0 && (
                        <div>
                          <span className="text-ink/30">Problemas</span>
                          <p className="text-red-400/70">{lead.auditIssues.length} issues</p>
                        </div>
                      )}
                    </div>

                    {lead.auditIssues && lead.auditIssues.length > 0 && (
                      <div className="bg-red-500/5 rounded-lg p-3">
                        <p className="text-[11px] text-red-400/80 font-body font-medium mb-1">Problemas detectados:</p>
                        <ul className="space-y-0.5">
                          {lead.auditIssues.map((issue, i) => (
                            <li key={i} className="text-[11px] text-red-400/60 font-body flex items-center gap-1.5">
                              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lead.emails && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-brand-primary font-body font-medium">Secuencia de emails:</p>
                        {Object.entries(lead.emails).map(([key, email]) => (
                          <div key={key} className="bg-brand-primary/5 rounded-lg p-3">
                            <p className="text-xs font-body font-medium text-ink/80 mb-1">
                              <Mail className="w-3 h-3 inline mr-1" />
                              {email.subject}
                            </p>
                            <p className="text-[11px] text-ink/50 font-body whitespace-pre-line leading-relaxed">
                              {email.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple settings icon component (to avoid import issue with Settings2)
function Settings2Icon({ className }: { className?: string }) {
  return <Zap className={className} />;
}
