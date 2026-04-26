"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  FileUp,
  MessageSquare,
  Receipt,
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderKanban,
  Activity,
} from "lucide-react";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import ProgressRing from "@/components/portal/ProgressRing";
import ProjectTimeline from "@/components/portal/ProjectTimeline";

interface DashboardData {
  client: {
    name: string;
    business_name: string;
    plan: string;
    status: string;
    monthly_fee: number;
    member_since: string;
  };
  milestones: Array<{
    id: string;
    title: string;
    description: string | null;
    status: "pending" | "in_progress" | "completed";
    due_date: string | null;
    completed_at: string | null;
  }>;
  unreadMessages: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    created_at: string;
  }>;
  filesCount: number;
  paymentsTotal: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/portal?action=get_dashboard");
      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? "Error al cargar");
      }
      const result = (await res.json()) as DashboardData;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-ink/60 font-body mb-4">{error ?? "Sin datos"}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchDashboard(); }}
          className="text-sm text-brand-primary font-body hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { client, milestones, unreadMessages, recentActivity, filesCount, paymentsTotal } = data;

  // Calculate completion
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const completionPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const activeMilestones = milestones.filter((m) => m.status !== "completed").slice(0, 5);

  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--client-primary")
    .trim() || "#B54E30";

  return (
    <div className="space-y-8">
      {/* Banner */}
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-2xl bg-paper-deep border border-ink/[0.06] p-8">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, ${primaryColor}, transparent 70%)`,
          }} />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl">
                <span className="bg-gradient-to-r from-paper to-paper/60 bg-clip-text text-transparent">
                  Hola, {client.name?.split(" ")[0] || "cliente"}
                </span>
              </h1>
              <p className="text-ink/50 font-body mt-2 text-sm">
                Plan {client.plan || "Personalizado"} ·{" "}
                Cliente desde{" "}
                {new Date(client.member_since).toLocaleDateString("es-ES", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <ProgressRing
              percentage={completionPct}
              size={100}
              strokeWidth={7}
              color={primaryColor}
            />
          </div>
        </div>
      </ScrollReveal>

      {/* Stats row */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4" staggerDelay={0.06}>
        <StaggerItem>
          <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-5 text-center">
            <CheckCircle2 className="w-5 h-5 text-mint mx-auto mb-2" />
            <div className="font-heading font-bold text-xl text-ink">
              {completedMilestones}/{totalMilestones}
            </div>
            <p className="text-[11px] text-ink/40 font-body mt-1">Hitos completados</p>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-5 text-center">
            <MessageSquare className="w-5 h-5 text-brand-primary mx-auto mb-2" />
            <div className="font-heading font-bold text-xl text-ink">
              {unreadMessages}
            </div>
            <p className="text-[11px] text-ink/40 font-body mt-1">Mensajes sin leer</p>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-5 text-center">
            <FileUp className="w-5 h-5 text-cyan-spark mx-auto mb-2" />
            <div className="font-heading font-bold text-xl text-ink">{filesCount}</div>
            <p className="text-[11px] text-ink/40 font-body mt-1">Archivos</p>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-5 text-center">
            <Receipt className="w-5 h-5 text-accent-gold mx-auto mb-2" />
            <div className="font-heading font-bold text-xl text-ink">
              {paymentsTotal.toLocaleString("es-ES")}€
            </div>
            <p className="text-[11px] text-ink/40 font-body mt-1">Total invertido</p>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Active milestones */}
        <ScrollReveal className="lg:col-span-3">
          <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-lg text-ink flex items-center gap-2">
                <FolderKanban className="w-5 h-5" style={{ color: primaryColor }} />
                Hitos del proyecto
              </h2>
              <Link
                href="/portal/projects"
                className="text-xs font-body hover:underline flex items-center gap-1 transition-colors"
                style={{ color: primaryColor }}
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ProjectTimeline
              milestones={activeMilestones}
              primaryColor={primaryColor}
            />
          </div>
        </ScrollReveal>

        {/* Recent activity */}
        <ScrollReveal delay={0.1} className="lg:col-span-2">
          <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-6 h-full">
            <h2 className="font-heading font-bold text-lg text-ink flex items-center gap-2 mb-5">
              <Activity className="w-5 h-5" style={{ color: primaryColor }} />
              Actividad reciente
            </h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-ink/30 font-body text-center py-8">
                Sin actividad reciente
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-ink/80 font-body leading-relaxed">
                        {item.description}
                      </p>
                      <span className="text-[10px] text-ink/30 font-body">
                        {new Date(item.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* Quick actions */}
      <ScrollReveal delay={0.15}>
        <h2 className="font-heading font-bold text-lg text-ink mb-4">Acciones rapidas</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              label: "Subir archivos",
              description: "Comparte logos, documentos o recursos",
              href: "/portal/files",
              icon: FileUp,
              color: "#283B70",
            },
            {
              label: "Enviar mensaje",
              description: "Habla con tu equipo PACAME",
              href: "/portal/messages",
              icon: MessageSquare,
              color: "#B54E30",
            },
            {
              label: "Ver pagos",
              description: "Historial de facturacion",
              href: "/portal/payments",
              icon: Receipt,
              color: "#E8B730",
            },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <CardTilt tiltMaxAngle={6}>
                <CardTiltContent className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-5 cursor-pointer group hover:border-ink/[0.12] transition-colors">
                  <action.icon
                    className="w-6 h-6 mb-3 transition-transform group-hover:scale-110"
                    style={{ color: action.color }}
                  />
                  <h3 className="font-heading font-semibold text-sm text-ink mb-1">
                    {action.label}
                  </h3>
                  <p className="text-[11px] text-ink/40 font-body">
                    {action.description}
                  </p>
                </CardTiltContent>
              </CardTilt>
            </Link>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}
