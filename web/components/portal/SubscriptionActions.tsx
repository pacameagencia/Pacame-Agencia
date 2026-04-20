"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";

interface Props {
  customerEmail: string;
}

export default function SubscriptionActions({ customerEmail }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_email: customerEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "No se pudo abrir el portal");
      }
      window.location.href = data.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      <button
        onClick={openPortal}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-olympus-gold hover:bg-olympus-gold/90 disabled:opacity-50 text-pacame-black font-heading font-semibold px-5 py-2.5 rounded-xl transition"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
        Gestionar suscripcion
      </button>
      <Link
        href="/planes?upgrade=1"
        className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-pacame-white font-heading font-medium px-5 py-2.5 rounded-xl transition"
      >
        Cambiar plan
      </Link>
      {err && <p className="w-full text-sm text-rose-400 font-body">{err}</p>}
    </div>
  );
}
