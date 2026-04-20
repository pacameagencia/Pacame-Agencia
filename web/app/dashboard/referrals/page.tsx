"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Users, UserPlus, DollarSign, TrendingUp, Copy, CheckCircle2,
  ExternalLink, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  tier: string;
  partner_code: string;
  total_referrals: number;
  total_conversions: number;
  total_earned: number;
  status: string;
  created_at: string;
}

interface Referral {
  id: string;
  referrer_client_id: string;
  referral_code: string;
  status: string;
  created_at: string;
  converted_at: string;
}

const tierColors: Record<string, string> = {
  bronce: "#CD7F32",
  plata: "#C0C0C0",
  oro: "#FFD700",
};

const typeLabels: Record<string, string> = {
  casual: "Casual",
  frequent: "Frecuente",
  freelance: "Freelance",
  partner: "Partner",
  ambassador: "Embajador",
};

export default function ReferralsPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState("");

  useEffect(() => {
    async function fetchData() {
      const [partnersRes, referralsRes] = await Promise.all([
        supabase.from("commercials").select("*").order("total_earned", { ascending: false }),
        supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      setPartners(partnersRes.data || []);
      setReferrals(referralsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  function copyCode(code: string) {
    navigator.clipboard.writeText(`https://pacameagencia.com/p/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  }

  const totalEarned = partners.reduce((sum, p) => sum + Number(p.total_earned), 0);
  const totalConversions = partners.reduce((sum, p) => sum + p.total_conversions, 0);
  const converted = referrals.filter((r) => r.status === "converted").length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-ink">Referidos y Partners</h1>
        <p className="text-sm text-ink/40 font-body mt-1">
          {loading ? "Cargando..." : `${partners.length} colaboradores · ${totalConversions} conversiones · ${totalEarned.toLocaleString("es-ES")}€ en comisiones`}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5">
          <Users className="w-5 h-5 text-brand-primary mb-2" />
          <div className="font-heading font-bold text-2xl text-ink">{partners.length}</div>
          <div className="text-xs text-ink/40 font-body">Colaboradores</div>
        </div>
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5">
          <UserPlus className="w-5 h-5 text-mint mb-2" />
          <div className="font-heading font-bold text-2xl text-mint">{referrals.length}</div>
          <div className="text-xs text-ink/40 font-body">Referidos totales</div>
        </div>
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5">
          <CheckCircle2 className="w-5 h-5 text-mint mb-2" />
          <div className="font-heading font-bold text-2xl text-mint">{converted}</div>
          <div className="text-xs text-ink/40 font-body">Convertidos</div>
        </div>
        <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5">
          <DollarSign className="w-5 h-5 text-accent-gold mb-2" />
          <div className="font-heading font-bold text-2xl text-accent-gold">{totalEarned.toLocaleString("es-ES")}€</div>
          <div className="text-xs text-ink/40 font-body">Comisiones pagadas</div>
        </div>
      </div>

      {/* Partners list */}
      <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-lg text-ink">Colaboradores</h2>
          <a
            href="/colabora"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-primary hover:underline font-body flex items-center gap-1"
          >
            Pagina de registro <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {partners.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-ink/20 mx-auto mb-3" />
            <p className="text-sm text-ink/40 font-body">Sin colaboradores aun</p>
            <p className="text-xs text-ink/50 font-body mt-1">
              Comparte pacameagencia.com/colabora para captar partners
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${tierColors[p.tier] || "#6B7280"}20`, color: tierColors[p.tier] || "#6B7280" }}
                >
                  <Award className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-semibold text-sm text-ink">{p.name}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-body uppercase"
                      style={{ backgroundColor: `${tierColors[p.tier]}20`, color: tierColors[p.tier] }}
                    >
                      {p.tier}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-ink/40 font-body">
                      {typeLabels[p.type] || p.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-ink/40 font-body">
                    <span>{p.email}</span>
                    <span>·</span>
                    <span>{p.total_referrals} referidos</span>
                    <span>·</span>
                    <span className="text-mint">{p.total_conversions} convertidos</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-heading font-bold text-sm text-ink">
                      {Number(p.total_earned).toLocaleString("es-ES")}€
                    </div>
                    <div className="text-[10px] text-ink/30 font-body">ganado</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(p.partner_code)}
                    className="gap-1 text-xs h-7"
                  >
                    {copiedCode === p.partner_code ? (
                      <><CheckCircle2 className="w-3 h-3 text-mint" />Copiado</>
                    ) : (
                      <><Copy className="w-3 h-3" />{p.partner_code}</>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent referrals */}
      <div className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-6">
        <h2 className="font-heading font-semibold text-lg text-ink mb-5">Referidos recientes</h2>
        {referrals.length === 0 ? (
          <p className="text-sm text-ink/30 font-body text-center py-6">Sin referidos aun</p>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink/50">{r.referral_code}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-body ${
                      r.status === "converted"
                        ? "bg-mint/20 text-mint"
                        : "bg-accent-gold/20 text-accent-gold"
                    }`}
                  >
                    {r.status === "converted" ? "Convertido" : "Pendiente"}
                  </span>
                </div>
                <span className="text-xs text-ink/30 font-body">
                  {new Date(r.created_at).toLocaleDateString("es-ES")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
