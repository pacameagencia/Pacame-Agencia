"use client";

import { useState } from "react";

interface Draft {
  id: string;
  style: string;
  draft_body: string;
  edited_body: string | null;
  status: string;
  upvotes: number | null;
  leads_attributed: number;
}

interface Opportunity {
  id: string;
  platform: string;
  source_key: string;
  thread_url: string;
  thread_title: string;
  thread_body: string;
  author_username: string;
  posted_at: string | null;
  intent: string;
  score: number;
  reach_proxy: number;
  competition_count: number;
  status: string;
  drafts: Draft[];
}

const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  forobeta: "#0099FF",
  twitter: "#000",
  indiehackers: "#0E2439",
  quora: "#B92B27",
};

const STYLE_LABELS: Record<string, string> = {
  testimonial: "🗣️ Testimonial",
  educativo: "📊 Educativo",
  suave: "💧 Suave",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  const ms = Date.now() - t;
  const h = Math.floor(ms / 3600000);
  if (h < 1) return `${Math.floor(ms / 60000)}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function ForosQueue({ items }: { items: Opportunity[] }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: 32, background: "#141414", borderRadius: 8, color: "#888", textAlign: "center" }}>
        Sin oportunidades en cola. El scraper corre cada 4h · vuelve más tarde.
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {items.map((opp) => <OpportunityCard key={opp.id} opp={opp} />)}
    </div>
  );
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  const [activeStyle, setActiveStyle] = useState<string>(opp.drafts[0]?.style || "testimonial");
  const [editedBody, setEditedBody] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"published" | "skipped" | null>(null);

  const activeDraft = opp.drafts.find((d) => d.style === activeStyle) || opp.drafts[0];
  const platColor = PLATFORM_COLORS[opp.platform] || "#666";

  async function callApi(path: string, body?: unknown) {
    setBusy(true);
    try {
      const cronSecret = (typeof window !== "undefined" && (window as { __DR_CRON_SECRET?: string }).__DR_CRON_SECRET) || "";
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!r.ok) {
        const err = await r.text();
        alert(`Error ${r.status}: ${err.slice(0, 200)}`);
        return false;
      }
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!activeDraft) return;
    const body = editing ? editedBody : (activeDraft.edited_body ?? activeDraft.draft_body);
    // Copy to clipboard
    try { await navigator.clipboard.writeText(body); } catch { /* ignore */ }
    // Open thread
    window.open(opp.thread_url, "_blank", "noopener");
    // Mark published in DB
    const ok = await callApi(`/api/foros/queue/${opp.id}/mark-published`, {
      response_id: activeDraft.id,
      edited_body: editing ? editedBody : undefined,
    });
    if (ok) setDone("published");
  }

  async function skip() {
    if (!confirm("¿Saltar esta oportunidad?")) return;
    const ok = await callApi(`/api/foros/queue/${opp.id}/skip`);
    if (ok) setDone("skipped");
  }

  if (done) {
    return (
      <div style={{
        padding: 16, background: "#0A0A0A", border: "1px solid rgba(207,255,0,0.2)",
        borderRadius: 8, color: done === "published" ? "#CFFF00" : "#666", textAlign: "center"
      }}>
        {done === "published" ? "✓ Marcada publicada · copy en portapapeles + thread abierto" : "⏭️ Saltada"}
      </div>
    );
  }

  return (
    <div style={{
      background: "#141414", border: "1px solid rgba(207,255,0,0.12)",
      borderRadius: 8, padding: 20, fontFamily: "'Space Grotesk',sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{
          background: platColor, color: "#FFF", padding: "3px 10px",
          borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        }}>
          {opp.platform}
        </span>
        <span style={{ color: "#888", fontSize: 12 }}>r/{opp.source_key}</span>
        <span style={{
          background: opp.score >= 80 ? "#CFFF00" : opp.score >= 65 ? "#9FC700" : "#666",
          color: "#0A0A0A", padding: "3px 10px", borderRadius: 4,
          fontSize: 12, fontWeight: 700,
        }}>
          Score {opp.score}
        </span>
        <span style={{ color: "#888", fontSize: 12 }}>· {opp.intent.replace(/_/g, " ")}</span>
        <span style={{ color: "#666", fontSize: 12, marginLeft: "auto" }}>
          @{opp.author_username || "—"} · {timeAgo(opp.posted_at)} · {opp.competition_count} replies
        </span>
      </div>

      {/* Thread */}
      <div style={{ marginBottom: 16 }}>
        <a href={opp.thread_url} target="_blank" rel="noopener noreferrer"
           style={{ color: "#FFF", textDecoration: "none", fontSize: 16, fontWeight: 600 }}>
          {opp.thread_title}
        </a>
        {opp.thread_body && (
          <div style={{
            marginTop: 8, color: "#B5B5B5", fontSize: 13, lineHeight: 1.5,
            maxHeight: 100, overflow: "hidden", whiteSpace: "pre-wrap",
          }}>
            {opp.thread_body.slice(0, 400)}
            {opp.thread_body.length > 400 ? "…" : ""}
          </div>
        )}
      </div>

      {/* Style tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {opp.drafts.map((d) => (
          <button key={d.style} onClick={() => { setActiveStyle(d.style); setEditing(false); }}
            style={{
              padding: "6px 12px", borderRadius: 4, border: 0, cursor: "pointer",
              fontSize: 12, fontWeight: 600,
              background: activeStyle === d.style ? "#CFFF00" : "rgba(207,255,0,0.1)",
              color: activeStyle === d.style ? "#0A0A0A" : "#CFFF00",
            }}>
            {STYLE_LABELS[d.style] || d.style}
          </button>
        ))}
      </div>

      {/* Draft body */}
      {editing ? (
        <textarea value={editedBody} onChange={(e) => setEditedBody(e.target.value)}
          style={{
            width: "100%", minHeight: 140, padding: 12, fontSize: 14,
            background: "#0A0A0A", color: "#E6E6E6",
            border: "1px solid #CFFF00", borderRadius: 4,
            fontFamily: "'Space Grotesk',sans-serif",
          }} />
      ) : (
        <div style={{
          padding: 12, background: "#0A0A0A", borderRadius: 4,
          color: "#E6E6E6", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
          minHeight: 60,
        }}>
          {activeDraft?.edited_body || activeDraft?.draft_body || "(sin borrador)"}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {!editing && (
          <button onClick={() => { setEditedBody(activeDraft?.edited_body || activeDraft?.draft_body || ""); setEditing(true); }}
            disabled={busy} style={btnSecondary}>
            ✏️ Editar
          </button>
        )}
        {editing && (
          <button onClick={() => setEditing(false)} style={btnSecondary}>Cancelar edición</button>
        )}
        <button onClick={publish} disabled={busy || !activeDraft} style={btnPrimary}>
          ✅ Aprobar · copy + abrir thread
        </button>
        <button onClick={skip} disabled={busy} style={btnSecondary}>⏭️ Skip</button>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: "#CFFF00", color: "#0A0A0A", padding: "10px 18px",
  border: 0, borderRadius: 4, fontWeight: 700, fontSize: 13,
  cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif",
};
const btnSecondary: React.CSSProperties = {
  background: "transparent", color: "#CFFF00",
  border: "1px solid #CFFF00", padding: "10px 16px",
  borderRadius: 4, fontSize: 13, cursor: "pointer",
  fontFamily: "'Space Grotesk',sans-serif",
};
