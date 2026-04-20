"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Sparkles,
  Download,
  ExternalLink,
  MessageSquare,
  Star,
} from "lucide-react";

interface OrderRow {
  id: string;
  order_number: string;
  service_slug: string;
  status: string;
  progress_pct: number | null;
  progress_message: string | null;
  assigned_agent: string | null;
  delivered_at: string | null;
  escalated_to_pablo: boolean;
  rating: number | null;
  customer_email: string | null;
}

interface DeliverableRow {
  id: string;
  version: number;
  kind: string;
  title: string | null;
  file_url: string | null;
  preview_url: string | null;
  payload: unknown;
  meta: Record<string, unknown> | null;
  created_at: string;
}

interface OrderEvent {
  id: string;
  event_type: string;
  title: string | null;
  message: string | null;
  created_at: string;
}

interface Props {
  orderId: string;
  initialOrder: OrderRow;
  initialDeliverables: DeliverableRow[];
  initialEvents: OrderEvent[];
  revisionsIncluded: number;
  revisionsUsed: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const eventLabels: Record<string, string> = {
  paid: "Pago recibido",
  inputs_requested: "Brief solicitado",
  inputs_collected: "Brief recibido",
  agent_started: "Agente arrancado",
  progress: "Progresando",
  draft_ready: "Borrador listo",
  delivered: "Entregado",
  revision_requested: "Revision solicitada",
  revision_completed: "Revision completada",
  escalated: "Escalado a Pablo",
  completed: "Completado",
  delivery_failure: "Error en entrega",
  webhook_duplicate: "Evento duplicado (ignorado)",
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function OrderTracker({
  orderId,
  initialOrder,
  initialDeliverables,
  initialEvents,
  revisionsIncluded,
  revisionsUsed,
}: Props) {
  const [order, setOrder] = useState(initialOrder);
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [events, setEvents] = useState(initialEvents);

  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionText, setRevisionText] = useState("");
  const [submittingRev, setSubmittingRev] = useState(false);

  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingText, setRatingText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder((o) => ({ ...o, ...(payload.new as OrderRow) }));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_events", filter: `order_id=eq.${orderId}` },
        (payload) => {
          setEvents((ev) => [...ev, payload.new as OrderEvent]);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deliverables", filter: `order_id=eq.${orderId}` },
        (payload) => {
          const newD = payload.new as DeliverableRow;
          setDeliverables((d) => {
            const withoutOld = d.filter((x) => x.id !== newD.id);
            return [...withoutOld, newD].filter((x) => x);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const pct = order.progress_pct ?? 0;
  const isWorking = order.status === "processing" || order.status === "revision_requested";
  const isDelivered = order.status === "delivered";
  const isEscalated = order.escalated_to_pablo || order.status === "escalated";

  async function submitRevision() {
    if (revisionText.trim().length < 10) return;
    setSubmittingRev(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: revisionText }),
      });
      if (res.ok) {
        setRevisionOpen(false);
        setRevisionText("");
      }
    } finally {
      setSubmittingRev(false);
    }
  }

  async function submitRating() {
    if (!ratingValue) return;
    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: ratingValue, review_text: ratingText }),
      });
      if (res.ok) {
        setRatingOpen(false);
      }
    } finally {
      setSubmittingRating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress card */}
      <div className="rounded-2xl p-6 sm:p-8 bg-paper-deep border border-ink/[0.06]">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono text-ink/40 mb-1">
              {order.order_number}
            </div>
            <h2 className="font-heading font-bold text-2xl text-ink">
              {order.service_slug}
            </h2>
            {order.assigned_agent && (
              <p className="text-ink/60 font-body text-sm mt-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent-gold" />
                Agente asignado: <span className="font-semibold capitalize">{order.assigned_agent}</span>
              </p>
            )}
          </div>

          <div className="text-right">
            {isDelivered && (
              <span className="inline-flex items-center gap-1.5 text-sm font-body text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                Entregado
              </span>
            )}
            {isWorking && (
              <span className="inline-flex items-center gap-1.5 text-sm font-body text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                En proceso
              </span>
            )}
            {isEscalated && (
              <span className="inline-flex items-center gap-1.5 text-sm font-body text-orange-400">
                <AlertCircle className="w-4 h-4" />
                Con Pablo
              </span>
            )}
          </div>
        </div>

        {/* Progress ring / bar */}
        {!isDelivered && !isEscalated && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-body">
              <span className="text-ink/70">
                {order.progress_message || "Preparando..."}
              </span>
              <span className="text-accent-gold font-semibold">{pct}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-gold/60 to-accent-gold transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {isEscalated && (
          <div className="rounded-xl p-4 bg-orange-500/10 border border-orange-500/20">
            <p className="text-orange-300 font-body text-sm">
              Tu pedido esta en atencion personal de Pablo. Te contactara en breve por email o WhatsApp.
            </p>
          </div>
        )}
      </div>

      {/* Deliverables */}
      {deliverables.length > 0 && (
        <div className="rounded-2xl p-6 sm:p-8 bg-paper-deep border border-ink/[0.06]">
          <h3 className="font-heading font-bold text-xl text-ink mb-5">
            Tu entregable
          </h3>

          {deliverables.map((d) => (
            <DeliverableView key={d.id} deliverable={d} />
          ))}

          {/* Actions */}
          {isDelivered && !order.rating && (
            <div className="mt-6 flex flex-wrap gap-3">
              {revisionsUsed < revisionsIncluded && (
                <button
                  onClick={() => setRevisionOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-ink/[0.1] text-ink hover:border-accent-gold/40 font-body text-sm transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  Pedir revision ({revisionsIncluded - revisionsUsed} disponibles)
                </button>
              )}
              <button
                onClick={() => setRatingOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold text-paper hover:bg-accent-gold/90 font-heading font-semibold text-sm transition"
              >
                <Star className="w-4 h-4" />
                Valorar entregable
              </button>
            </div>
          )}

          {order.rating && (
            <div className="mt-6 p-4 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
              <p className="text-ink font-body text-sm">
                Has valorado este entregable con{" "}
                <span className="font-semibold">{order.rating}/5</span>.
                ¡Gracias!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-2xl p-6 sm:p-8 bg-paper-deep border border-ink/[0.06]">
        <h3 className="font-heading font-bold text-xl text-ink mb-5">
          Linea de tiempo
        </h3>
        <ol className="space-y-3">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-start gap-3 text-sm font-body">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-gold mt-2" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">
                    {eventLabels[ev.event_type] || ev.title || ev.event_type}
                  </span>
                  <span className="text-ink/30 text-xs">
                    {formatTime(ev.created_at)}
                  </span>
                </div>
                {ev.message && (
                  <p className="text-ink/60 text-xs mt-0.5">
                    {ev.message}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Revision modal */}
      {revisionOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl p-6 bg-paper-deep border border-ink/[0.1]">
            <h3 className="font-heading font-bold text-xl text-ink mb-3">
              Pedir revision
            </h3>
            <p className="text-ink/60 font-body text-sm mb-4">
              Cuentanos que ajustar. El agente regenerara con tu feedback.
            </p>
            <textarea
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              className="w-full bg-white/[0.04] border border-ink/[0.1] rounded-xl px-4 py-3 text-ink font-body min-h-[120px] focus:border-accent-gold/60 focus:outline-none"
              placeholder="Ej: Prefiero tono mas profesional y menos emojis. Los CTAs que sean mas directos..."
              maxLength={1000}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRevisionOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-ink/[0.1] text-ink/70 font-body text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={submitRevision}
                disabled={submittingRev || revisionText.trim().length < 10}
                className="flex-1 px-4 py-2.5 rounded-xl bg-accent-gold text-paper font-heading font-semibold text-sm disabled:opacity-50"
              >
                {submittingRev ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating modal */}
      {ratingOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl p-6 bg-paper-deep border border-ink/[0.1]">
            <h3 className="font-heading font-bold text-xl text-ink mb-4">
              Valora tu entregable
            </h3>

            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatingValue(n)}
                  className="transition hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      n <= ratingValue
                        ? "fill-accent-gold text-accent-gold"
                        : "text-white/20"
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={ratingText}
              onChange={(e) => setRatingText(e.target.value)}
              className="w-full bg-white/[0.04] border border-ink/[0.1] rounded-xl px-4 py-3 text-ink font-body focus:border-accent-gold/60 focus:outline-none"
              placeholder="Comentario opcional (publico si activas testimonios)..."
              maxLength={500}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRatingOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-ink/[0.1] text-ink/70 font-body text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={submitRating}
                disabled={submittingRating || !ratingValue}
                className="flex-1 px-4 py-2.5 rounded-xl bg-accent-gold text-paper font-heading font-semibold text-sm disabled:opacity-50"
              >
                {submittingRating ? "Enviando..." : "Enviar valoracion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeliverableView({ deliverable }: { deliverable: DeliverableRow }) {
  const d = deliverable;

  if (d.kind === "image" && d.file_url) {
    return (
      <div>
        <img
          src={d.file_url}
          alt={d.title || "Entregable"}
          className="rounded-xl w-full max-w-md mx-auto border border-ink/[0.06]"
        />
        <div className="mt-3 flex gap-2 justify-center">
          <a
            href={d.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-ink/[0.1] text-ink/70 font-body text-xs hover:border-accent-gold/40 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar
          </a>
        </div>
      </div>
    );
  }

  if (d.kind === "json" || d.kind === "text") {
    const p = d.payload as Record<string, unknown>;
    if (p?.variants) {
      const variants = p.variants as Array<{
        angle: string;
        headline: string;
        subheadline: string;
        cta: string;
        rationale: string;
      }>;
      return (
        <div className="space-y-4">
          {variants.map((v, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white/[0.03] border border-ink/[0.06]"
            >
              <div className="text-xs font-mono text-accent-gold mb-2">
                Variante {i + 1} — {v.angle}
              </div>
              <h4 className="font-heading font-bold text-2xl text-ink mb-1">
                {v.headline}
              </h4>
              <p className="text-ink/70 font-body mb-3">{v.subheadline}</p>
              <div className="inline-block px-4 py-2 rounded-xl bg-accent-gold/10 border border-accent-gold/20 text-accent-gold font-heading font-semibold text-sm">
                {v.cta}
              </div>
              <p className="mt-3 text-ink/50 font-body text-xs italic">
                {v.rationale}
              </p>
            </div>
          ))}
          {Boolean(p.recommendation) && (
            <div className="p-4 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
              <p className="text-ink/80 font-body text-sm">
                <strong className="text-accent-gold">Recomendacion Copy:</strong>{" "}
                {p.recommendation as string}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (p?.caption) {
      return (
        <div className="space-y-4">
          {Boolean(p.image_url) && (
            <img
              src={p.image_url as string}
              alt="Post Instagram"
              className="rounded-xl w-full max-w-md mx-auto border border-ink/[0.06]"
            />
          )}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-ink/[0.06]">
            <h4 className="font-heading font-semibold text-ink mb-2 text-sm">
              Caption
            </h4>
            <p className="text-ink/80 font-body text-sm whitespace-pre-wrap">
              {p.caption as string}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-ink/[0.06]">
            <h4 className="font-heading font-semibold text-ink mb-2 text-sm">
              Hashtags
            </h4>
            <p className="text-ink/60 font-body text-xs">
              {p.hashtags_line as string}
            </p>
          </div>
          {Boolean(p.best_time) && (
            <div className="text-ink/60 font-body text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-gold" />
              Mejor hora de publicacion: <strong>{p.best_time as string}</strong>
            </div>
          )}
        </div>
      );
    }

    return (
      <pre className="bg-white/[0.03] border border-ink/[0.06] p-4 rounded-xl text-ink/70 font-mono text-xs overflow-x-auto">
        {JSON.stringify(p, null, 2)}
      </pre>
    );
  }

  if (d.kind === "pdf" && d.file_url) {
    return (
      <a
        href={d.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-ink/[0.06] hover:border-accent-gold/40 transition"
      >
        <ExternalLink className="w-5 h-5 text-accent-gold" />
        <div className="flex-1">
          <div className="font-heading font-semibold text-ink">
            {d.title || "Documento PDF"}
          </div>
          <div className="text-xs text-ink/50 font-body">Descargar PDF</div>
        </div>
      </a>
    );
  }

  return null;
}
