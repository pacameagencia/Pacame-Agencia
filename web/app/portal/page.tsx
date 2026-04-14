"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Mail, ArrowRight, FileText, CheckCircle, Clock,
  CreditCard, Phone, Shield, ExternalLink, ThumbsUp, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientData {
  name: string;
  business_name: string;
  plan: string;
  status: string;
  monthly_fee: number;
  member_since: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  platform: string;
  created_at: string;
}

interface PaymentItem {
  id: string;
  description: string;
  amount: number;
  date: string;
}

interface CallItem {
  id: string;
  purpose: string;
  summary: string;
  sentiment: string;
  duration_seconds: number;
  created_at: string;
}

interface ProjectData {
  client: ClientData;
  content: { items: ContentItem[]; stats: { total: number; published: number; pending: number } };
  proposals: Array<{ id: string; sage_analysis: Record<string, unknown>; total_onetime: number; total_monthly: number; status: string; created_at: string }>;
  payments: PaymentItem[];
  calls: CallItem[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  published: { label: "Publicado", color: "#16A34A" },
  pending_review: { label: "Pendiente", color: "#D97706" },
  draft: { label: "Borrador", color: "#6B7280" },
  approved: { label: "Aprobado", color: "#2563EB" },
  scheduled: { label: "Programado", color: "#7C3AED" },
};

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div className="bg-pacame-black min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-electric-violet" />
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}

function PortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState<"login" | "loading" | "portal" | "error">(token ? "loading" : "login");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (token) {
      loadProject(token);
    }
  }, [token]);

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);

    try {
      await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_access", email: email.trim() }),
      });
      setSent(true);
    } catch {
      setErrorMsg("Error de conexion. Intentalo de nuevo.");
    }
    setSending(false);
  }

  async function loadProject(t: string) {
    setStep("loading");
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_project", token: t }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Enlace invalido");
        setStep("error");
        return;
      }

      setProject(data);
      setStep("portal");
    } catch {
      setErrorMsg("Error de conexion");
      setStep("error");
    }
  }

  // --- Login screen ---
  if (step === "login") {
    return (
      <div className="bg-pacame-black min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md px-6">
          <div className="text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-xl bg-brand-gradient items-center justify-center mb-4">
              <span className="text-white font-heading font-bold text-lg">P</span>
            </div>
            <h1 className="font-heading font-bold text-2xl text-pacame-white">Portal de cliente</h1>
            <p className="text-sm text-pacame-white/60 font-body mt-2">
              Introduce tu email para acceder al estado de tu proyecto
            </p>
          </div>

          {sent ? (
            <div className="rounded-2xl bg-dark-card border border-lime-pulse/20 p-6 text-center">
              <Mail className="w-8 h-8 text-lime-pulse mx-auto mb-3" />
              <h2 className="font-heading font-semibold text-pacame-white mb-2">Enlace enviado</h2>
              <p className="text-sm text-pacame-white/50 font-body">
                Si tu email esta registrado, recibiras un enlace de acceso en tu bandeja de entrada. Revisa tambien spam.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white font-body placeholder:text-pacame-white/50 focus:border-electric-violet/50 outline-none"
              />
              <Button type="submit" variant="gradient" size="xl" disabled={sending} className="w-full gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Acceder
              </Button>
              {errorMsg && <p className="text-xs text-red-400 font-body text-center">{errorMsg}</p>}
            </form>
          )}

          <div className="flex items-center gap-2 justify-center mt-6 text-xs text-pacame-white/50 font-body">
            <Shield className="w-3 h-3" />
            Acceso seguro via email
          </div>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (step === "loading") {
    return (
      <div className="bg-pacame-black min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-electric-violet" />
      </div>
    );
  }

  // --- Error ---
  if (step === "error") {
    return (
      <div className="bg-pacame-black min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="font-heading font-bold text-xl text-pacame-white mb-2">Enlace no valido</h1>
          <p className="text-sm text-pacame-white/60 font-body mb-6">{errorMsg}</p>
          <Button variant="gradient" asChild>
            <Link href="/portal">Solicitar nuevo enlace</Link>
          </Button>
        </div>
      </div>
    );
  }

  // --- Portal ---
  if (!project) return null;

  const { client, content, proposals, payments, calls } = project;

  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-dark-elevated/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">P</span>
            </div>
            <span className="font-heading font-bold text-pacame-white">PACAME</span>
            <span className="text-xs text-pacame-white/50 font-body hidden sm:block">Portal de cliente</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-heading font-medium text-pacame-white">{client.business_name || client.name}</div>
            <div className="text-xs text-pacame-white/60 font-body">Plan {client.plan || "Personalizado"}</div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white">
            Hola, {client.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-pacame-white/60 font-body mt-1">
            Cliente desde {new Date(client.member_since).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            {client.monthly_fee > 0 && ` · Plan: ${client.monthly_fee}€/mes`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
            <FileText className="w-6 h-6 text-electric-violet mx-auto mb-2" />
            <div className="font-heading font-bold text-2xl text-pacame-white">{content.stats.total}</div>
            <div className="text-xs text-pacame-white/60 font-body">Contenido total</div>
          </div>
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
            <CheckCircle className="w-6 h-6 text-lime-pulse mx-auto mb-2" />
            <div className="font-heading font-bold text-2xl text-lime-pulse">{content.stats.published}</div>
            <div className="text-xs text-pacame-white/60 font-body">Publicados</div>
          </div>
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
            <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="font-heading font-bold text-2xl text-amber-400">{content.stats.pending}</div>
            <div className="text-xs text-pacame-white/60 font-body">Pendientes</div>
          </div>
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
            <CreditCard className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
            <div className="font-heading font-bold text-2xl text-neon-cyan">{payments.length}</div>
            <div className="text-xs text-pacame-white/60 font-body">Pagos</div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
          <h2 className="font-heading font-semibold text-lg text-pacame-white mb-4">Tu contenido</h2>
          {content.items.length === 0 ? (
            <p className="text-sm text-pacame-white/50 font-body text-center py-6">Aun no hay contenido creado</p>
          ) : (
            <div className="space-y-2">
              {content.items.map((item) => {
                const st = statusLabels[item.status] || { label: item.status, color: "#6B7280" };
                return (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <FileText className="w-4 h-4 text-pacame-white/50 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-pacame-white font-body">{item.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-pacame-white/50 font-body">{item.type} · {item.platform}</span>
                        <span className="text-[10px] text-pacame-white/50 font-body">
                          {new Date(item.created_at).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-body font-medium"
                      style={{ backgroundColor: `${st.color}20`, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payments */}
        {payments.length > 0 && (
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
            <h2 className="font-heading font-semibold text-lg text-pacame-white mb-4">Historial de pagos</h2>
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div>
                    <span className="text-sm text-pacame-white font-body">{payment.description}</span>
                    <div className="text-[10px] text-pacame-white/50 font-body mt-0.5">
                      {new Date(payment.date).toLocaleDateString("es-ES")}
                    </div>
                  </div>
                  <span className="font-heading font-bold text-lime-pulse">
                    {Number(payment.amount).toLocaleString("es-ES")}€
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent calls */}
        {calls.length > 0 && (
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
            <h2 className="font-heading font-semibold text-lg text-pacame-white mb-4">Llamadas recientes</h2>
            <div className="space-y-2">
              {calls.map((call) => (
                <div key={call.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <Phone className="w-4 h-4 text-pacame-white/50 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-pacame-white font-body">{call.purpose || "Llamada"}</span>
                      {call.sentiment === "positive" && <ThumbsUp className="w-3 h-3 text-green-400" />}
                      {call.sentiment === "neutral" && <Minus className="w-3 h-3 text-gray-400" />}
                    </div>
                    {call.summary && <p className="text-xs text-pacame-white/50 font-body mt-1">{call.summary}</p>}
                    <span className="text-[10px] text-pacame-white/50 font-body">
                      {new Date(call.created_at).toLocaleDateString("es-ES")}
                      {call.duration_seconds > 0 && ` · ${Math.round(call.duration_seconds / 60)}min`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="rounded-2xl bg-brand-gradient p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <h2 className="font-heading font-bold text-xl text-white mb-3">¿Necesitas algo?</h2>
            <p className="text-white/70 font-body mb-6 max-w-md mx-auto">
              Respondemos en menos de 2 horas por WhatsApp o email.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="outline" size="xl" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <a href="https://wa.me/34722669381" target="_blank" rel="noopener noreferrer">
                  WhatsApp directo
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </Button>
              <Button variant="outline" size="xl" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <a href="mailto:hola@pacameagencia.com">
                  Email
                  <Mail className="w-3.5 h-3.5 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-pacame-white/50 font-body py-4">
          PACAME — Tu equipo digital con IA · <a href="https://pacameagencia.com" className="text-electric-violet/50 hover:text-electric-violet">pacameagencia.com</a>
        </div>
      </main>
    </div>
  );
}
