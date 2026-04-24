"use client";

/**
 * ScarcityCounter — muestra huecos disponibles este mes.
 *
 * Sesgo activado: Escasez + Urgencia.
 * Fetch a /api/public/slots-availability (cached 15 min).
 * Tres tiers: high (rojo), medium (amber), low (neutral).
 */

import { useEffect, useState } from "react";
import { Clock, Flame } from "lucide-react";
import { trackScarcityViewed } from "@/lib/analytics/events";

interface Slots {
  month: string;
  total: number;
  taken: number;
  available: number;
  closes: string;
  urgency: "high" | "medium" | "low";
}

interface Props {
  variant?: "inline" | "banner" | "card";
  className?: string;
}

export default function ScarcityCounter({ variant = "inline", className = "" }: Props) {
  const [slots, setSlots] = useState<Slots | null>(null);

  useEffect(() => {
    fetch("/api/public/slots-availability")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Slots | null) => {
        if (data) {
          setSlots(data);
          trackScarcityViewed(data.month, data.available);
        }
      })
      .catch(() => null);
  }, []);

  if (!slots) {
    // Skeleton para evitar layout shift
    if (variant === "inline") return <span className={`inline-block h-4 w-32 bg-ink/5 rounded ${className}`} />;
    return null;
  }

  const { month, total, taken, available, closes, urgency } = slots;

  // INLINE: un chip pequeño reutilizable (hero, cards, CTAs)
  if (variant === "inline") {
    const color =
      urgency === "high" ? "text-accent-burgundy" : urgency === "medium" ? "text-accent-gold" : "text-mint";
    const bg =
      urgency === "high"
        ? "bg-accent-burgundy/10 border-accent-burgundy/25"
        : urgency === "medium"
        ? "bg-accent-gold/10 border-accent-gold/25"
        : "bg-mint/10 border-mint/25";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider border ${bg} ${className}`}
      >
        {urgency === "high" ? (
          <Flame className={`w-3 h-3 ${color}`} />
        ) : (
          <Clock className={`w-3 h-3 ${color}`} />
        )}
        <span className={color}>
          {available}/{total} huecos {month}
        </span>
      </span>
    );
  }

  // CARD: tarjeta destacada (sticky sidebar de servicios/personas)
  if (variant === "card") {
    return (
      <div
        className={`p-4 rounded-2xl border ${
          urgency === "high"
            ? "border-accent-burgundy/30 bg-accent-burgundy/5"
            : "border-accent-gold/25 bg-accent-gold/5"
        } ${className}`}
      >
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink/50">
            Disponibilidad {month}
          </span>
          <span className="text-[10px] font-mono text-ink/40">Cierre {closes}</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-heading font-bold text-3xl text-ink tabular-nums">
            {available}
          </span>
          <span className="text-[13px] text-ink/60 font-body">
            de {total} huecos libres
          </span>
        </div>
        <div className="h-1 bg-ink/5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              urgency === "high" ? "bg-accent-burgundy" : "bg-accent-gold"
            }`}
            style={{ width: `${(taken / total) * 100}%` }}
          />
        </div>
        {urgency === "high" && (
          <p className="mt-3 text-[11px] text-accent-burgundy font-body font-medium">
            Ultimos slots del mes. Reserva ya para empezar antes del cierre.
          </p>
        )}
      </div>
    );
  }

  // BANNER: full-width (top de landing pages)
  return (
    <div
      className={`py-2.5 px-4 text-center text-[12px] md:text-[13px] font-mono uppercase tracking-[0.15em] ${
        urgency === "high"
          ? "bg-accent-burgundy text-paper"
          : "bg-accent-gold/15 text-ink border-y border-accent-gold/30"
      } ${className}`}
    >
      <span className="inline-flex items-center gap-2">
        {urgency === "high" ? (
          <Flame className="w-3.5 h-3.5" />
        ) : (
          <Clock className="w-3.5 h-3.5" />
        )}
        <span>
          {month}: <strong>{available}/{total}</strong> huecos libres · Cierre {closes}
        </span>
      </span>
    </div>
  );
}
