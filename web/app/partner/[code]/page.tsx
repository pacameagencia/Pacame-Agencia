"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award, Users, DollarSign, TrendingUp, Copy, CheckCircle2,
  Loader2, ArrowRight, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import GoldenDivider from "@/components/effects/GoldenDivider";

interface PartnerData {
  name: string;
  tier: string;
  partner_code: string;
  total_referrals: number;
  total_conversions: number;
  total_earned: number;
  commission_first_pct: number;
  commission_recurring_pct: number;
  referrals: Array<{
    id: string;
    referral_code: string;
    status: string;
    created_at: string;
    converted_at: string;
  }>;
  commissions: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    created_at: string;
  }>;
  next_tier: { name: string; conversions_needed: number } | null;
}

const tierConfig: Record<string, { color: string; gradient: string }> = {
  bronce: { color: "#CD7F32", gradient: "from-amber-700 to-amber-500" },
  plata: { color: "#C0C0C0", gradient: "from-gray-400 to-gray-300" },
  oro: { color: "#FFD700", gradient: "from-yellow-500 to-amber-300" },
};

export default function PartnerDashboardPage() {
  const params = useParams();
  const code = params.code as string;
  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!code) return;
    fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "partner_dashboard", partner_code: code }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(true);
        } else {
          setData(d);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [code]);

  function copyLink(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  if (loading) {
    return (
      <div className="bg-pacame-black min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-electric-violet animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-pacame-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Award className="w-12 h-12 text-pacame-white/20 mx-auto mb-4" />
          <h1 className="font-heading font-bold text-xl text-pacame-white mb-2">Codigo no encontrado</h1>
          <p className="text-sm text-pacame-white/40 font-body mb-6">Este codigo de partner no existe o ha sido desactivado.</p>
          <Button variant="outline" asChild>
            <Link href="/colabora">Hacerse partner</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tier = tierConfig[data.tier] || tierConfig.bronce;
  const referralLink = `https://pacameagencia.com/r/${data.partner_code}`;
  const pendingCommissions = (data.commissions || []).filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full blur-[140px] pointer-events-none" style={{ backgroundColor: `${tier.color}15` }} />

        <ScrollReveal className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: `${tier.color}20` }}>
            <Award className="w-10 h-10" style={{ color: tier.color }} />
          </div>
          <p className="font-body text-sm text-pacame-white/40 mb-1">Panel de partner</p>
          <h1 className="font-heading font-bold text-3xl text-pacame-white mb-2">Hola, {data.name}</h1>
          <span
            className="inline-block text-xs px-4 py-1 rounded-full font-heading font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${tier.color}25`, color: tier.color }}
          >
            Tier {data.tier}
          </span>
        </ScrollReveal>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-6">
        {/* KPIs */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4" staggerDelay={0.08}>
          <StaggerItem>
            <CardTilt tiltMaxAngle={8}>
              <CardTiltContent className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
                <Users className="w-5 h-5 text-neon-cyan mx-auto mb-2" />
                <div className="font-heading font-bold text-2xl text-neon-cyan">{data.total_referrals}</div>
                <div className="text-xs text-pacame-white/40 font-body">Referidos</div>
              </CardTiltContent>
            </CardTilt>
          </StaggerItem>
          <StaggerItem>
            <CardTilt tiltMaxAngle={8}>
              <CardTiltContent className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
                <CheckCircle2 className="w-5 h-5 text-lime-pulse mx-auto mb-2" />
                <div className="font-heading font-bold text-2xl text-lime-pulse">{data.total_conversions}</div>
                <div className="text-xs text-pacame-white/40 font-body">Convertidos</div>
              </CardTiltContent>
            </CardTilt>
          </StaggerItem>
          <StaggerItem>
            <CardTilt tiltMaxAngle={8}>
              <CardTiltContent className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
                <DollarSign className="w-5 h-5 text-amber-signal mx-auto mb-2" />
                <div className="font-heading font-bold text-2xl text-amber-signal">{Number(data.total_earned).toLocaleString("es-ES")}€</div>
                <div className="text-xs text-pacame-white/40 font-body">Total ganado</div>
              </CardTiltContent>
            </CardTilt>
          </StaggerItem>
          <StaggerItem>
            <CardTilt tiltMaxAngle={8}>
              <CardTiltContent className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
                <TrendingUp className="w-5 h-5 text-electric-violet mx-auto mb-2" />
                <div className="font-heading font-bold text-2xl text-electric-violet">{pendingCommissions.toLocaleString("es-ES")}€</div>
                <div className="text-xs text-pacame-white/40 font-body">Pendiente cobro</div>
              </CardTiltContent>
            </CardTilt>
          </StaggerItem>
        </StaggerContainer>

        {/* Share links */}
        <ScrollReveal delay={0.1} className="rounded-2xl glass p-6">
          <h2 className="font-heading font-semibold text-lg text-pacame-white mb-4">Tu enlace de referido</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-card border border-white/[0.08]">
              <Share2 className="w-4 h-4 text-pacame-white/30 flex-shrink-0" />
              <span className="text-sm text-pacame-white font-mono truncate">{referralLink}</span>
            </div>
            <Button
              variant="gradient" size="sm"
              onClick={() => copyLink(referralLink, "link")}
              className="gap-2 flex-shrink-0"
            >
              {copied === "link" ? <><CheckCircle2 className="w-4 h-4" />Copiado</> : <><Copy className="w-4 h-4" />Copiar enlace</>}
            </Button>
          </div>
          <p className="text-xs text-pacame-white/30 font-body mt-3">
            Comparte este enlace. Cuando alguien contrate, tu ganas un <strong className="text-pacame-white/50">{data.commission_first_pct}% del primer pago</strong> + <strong className="text-pacame-white/50">{data.commission_recurring_pct}% recurrente</strong>.
          </p>
        </ScrollReveal>

        {/* Tier progress */}
        {data.next_tier && (
          <ScrollReveal delay={0.15} className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
            <h2 className="font-heading font-semibold text-pacame-white mb-3">Progreso al siguiente tier</h2>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-xs font-heading font-bold uppercase" style={{ color: tier.color }}>{data.tier}</span>
              <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (data.total_conversions / data.next_tier.conversions_needed) * 100)}%`,
                    backgroundColor: tierConfig[data.next_tier.name]?.color || "#C0C0C0",
                  }}
                />
              </div>
              <span className="text-xs font-heading font-bold uppercase" style={{ color: tierConfig[data.next_tier.name]?.color || "#C0C0C0" }}>
                {data.next_tier.name}
              </span>
            </div>
            <p className="text-xs text-pacame-white/40 font-body">
              {data.next_tier.conversions_needed - data.total_conversions} conversiones mas para subir a {data.next_tier.name}. Conseguiras comisiones mas altas.
            </p>
          </ScrollReveal>
        )}

        {/* Recent referrals */}
        <ScrollReveal delay={0.1} className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
          <h2 className="font-heading font-semibold text-pacame-white mb-4">Tus referidos</h2>
          {(data.referrals || []).length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-pacame-white/15 mx-auto mb-3" />
              <p className="text-sm text-pacame-white/30 font-body">Aun sin referidos. Comparte tu enlace para empezar a ganar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-pacame-white/50">{r.referral_code}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-body ${
                        r.status === "converted"
                          ? "bg-lime-pulse/20 text-lime-pulse"
                          : r.status === "contacted"
                          ? "bg-neon-cyan/20 text-neon-cyan"
                          : "bg-amber-signal/20 text-amber-signal"
                      }`}
                    >
                      {r.status === "converted" ? "Convertido" : r.status === "contacted" ? "Contactado" : "Pendiente"}
                    </span>
                  </div>
                  <span className="text-xs text-pacame-white/30 font-body">
                    {new Date(r.created_at).toLocaleDateString("es-ES")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>

        {/* Commissions */}
        {(data.commissions || []).length > 0 && (
          <ScrollReveal delay={0.15} className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
            <h2 className="font-heading font-semibold text-pacame-white mb-4">Historial de comisiones</h2>
            <div className="space-y-2">
              {data.commissions.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-3.5 h-3.5 text-lime-pulse" />
                    <span className="text-sm font-heading font-semibold text-pacame-white">{Number(c.amount).toLocaleString("es-ES")}€</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-pacame-white/40 font-body">
                      {c.type === "first_payment" ? "Primer pago" : "Recurrente"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-body ${
                        c.status === "paid" ? "bg-lime-pulse/20 text-lime-pulse" : "bg-amber-signal/20 text-amber-signal"
                      }`}
                    >
                      {c.status === "paid" ? "Pagado" : "Pendiente"}
                    </span>
                    <span className="text-xs text-pacame-white/30 font-body">
                      {new Date(c.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        <GoldenDivider variant="line" />

        {/* CTA */}
        <ScrollReveal className="text-center pt-4">
          <p className="text-xs text-pacame-white/50 font-body mb-4">
            ¿Dudas? Contacta con nosotros en{" "}
            <a href="mailto:hola@pacameagencia.com" className="text-electric-violet/60 hover:underline">hola@pacameagencia.com</a>
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowRight className="w-3 h-3 rotate-180" />
              Ir a pacameagencia.com
            </Link>
          </Button>
        </ScrollReveal>
      </section>
    </div>
  );
}
