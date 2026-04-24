"use client";

import { useState } from "react";
import { Calendar, Download, Loader2, RefreshCw, Sparkles } from "lucide-react";

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "blog", label: "Blog SEO" },
];

const FREQUENCIES = [
  { value: "daily", label: "Diario (30 posts)" },
  { value: "3week", label: "3 por semana (13 posts)" },
  { value: "2week", label: "2 por semana (9 posts)" },
  { value: "weekly", label: "Semanal (4 posts)" },
];

interface Idea {
  date: string;
  day_number: number;
  platform: string;
  format: string;
  hook: string;
  body_draft: string;
  cta: string;
  hashtags?: string;
}

export default function CalendarClient() {
  const [sector, setSector] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);
  const [frequency, setFrequency] = useState("3week");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePlatform(v: string) {
    setPlatforms((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  }

  async function handleGenerate() {
    if (!sector.trim()) return setError("Indica tu sector");
    if (platforms.length === 0) return setError("Elige al menos 1 plataforma");
    setLoading(true);
    setError(null);
    setIdeas([]);
    try {
      const res = await fetch("/api/tools/calendar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sector, platforms, frequency }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setIdeas(json.ideas || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    const rows = [
      ["Dia", "Fecha", "Plataforma", "Formato", "Hook", "Cuerpo", "CTA", "Hashtags"],
      ...ideas.map((i) => [
        String(i.day_number),
        i.date,
        i.platform,
        i.format,
        i.hook,
        i.body_draft,
        i.cta,
        i.hashtags || "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendario-contenido-${sector.slice(0, 30).replace(/\s/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadIcs() {
    const events = ideas
      .map((i) => {
        const d = i.date.replace(/-/g, "");
        return [
          "BEGIN:VEVENT",
          `UID:${d}-pacame-${i.day_number}@pacameagencia.com`,
          `DTSTART;VALUE=DATE:${d}`,
          `SUMMARY:[${i.platform.toUpperCase()}] ${i.hook.slice(0, 60)}`,
          `DESCRIPTION:${i.body_draft.replace(/\n/g, "\\n").slice(0, 300)}\\n\\nCTA: ${i.cta}${i.hashtags ? "\\n\\nHashtags: " + i.hashtags : ""}`,
          "END:VEVENT",
        ].join("\r\n");
      })
      .join("\r\n");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PACAME//Calendario Contenido//ES",
      events,
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendario-pacame.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-3xl bg-ink/[0.03] border border-ink/[0.08] space-y-5">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-2">
            Sector + negocio *
          </label>
          <input
            type="text"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Ej: entrenador personal crossfit Bilbao"
            className="w-full bg-paper border border-ink/10 rounded-xl px-4 py-3 text-ink font-body text-[15px] outline-none focus:border-accent-gold/40"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-2">
            Plataformas (multi-select)
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => togglePlatform(p.value)}
                className={`px-4 py-2 rounded-full border text-[13px] font-heading font-medium transition ${
                  platforms.includes(p.value)
                    ? "border-accent-gold bg-accent-gold/10 text-ink"
                    : "border-ink/10 bg-paper text-ink/60 hover:border-ink/20"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.22em] text-ink/50 mb-2">
            Frecuencia
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCIES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFrequency(f.value)}
                className={`px-4 py-3 rounded-xl border text-left transition ${
                  frequency === f.value
                    ? "border-accent-gold bg-accent-gold/10 text-ink"
                    : "border-ink/10 bg-paper text-ink/70 hover:border-ink/20"
                }`}
              >
                <div className="font-heading font-semibold text-[13px]">{f.label}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !sector.trim()}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-accent-gold text-paper font-heading font-semibold text-[15px] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generando calendario...
            </>
          ) : ideas.length > 0 ? (
            <>
              <RefreshCw className="w-4 h-4" /> Regenerar otra tanda
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Generar calendario 30 dias
            </>
          )}
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-accent-burgundy/10 border border-accent-burgundy/30 text-accent-burgundy text-[13px]" role="alert">
            {error}
          </div>
        )}
      </div>

      {ideas.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 p-5 rounded-2xl bg-accent-gold/[0.06] border border-accent-gold/30">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-gold" />
              <span className="font-heading font-semibold text-ink">
                {ideas.length} ideas generadas
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={downloadCsv}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-paper text-[13px] font-heading font-semibold hover:brightness-110 transition"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                type="button"
                onClick={downloadIcs}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-gold text-paper text-[13px] font-heading font-semibold hover:brightness-110 transition"
              >
                <Download className="w-3.5 h-3.5" /> Google Calendar (.ics)
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {ideas.map((i) => (
              <div
                key={i.day_number}
                className="p-5 rounded-2xl bg-paper border border-ink/[0.08]"
              >
                <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-ink/[0.06] text-[10px] font-mono uppercase tracking-[0.18em]">
                  <span className="text-accent-gold">
                    DIA {i.day_number} · {i.date}
                  </span>
                  <span className="text-ink/50">
                    {i.platform} · {i.format}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-[16px] text-ink mb-2 leading-snug">
                  {i.hook}
                </h4>
                <p className="text-[13px] text-ink/65 font-body leading-relaxed mb-3">
                  {i.body_draft}
                </p>
                <div className="text-[12px] text-accent-gold font-mono">→ {i.cta}</div>
                {i.hashtags && (
                  <div className="text-[11px] text-ink/40 font-mono mt-2">
                    {i.hashtags}
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
