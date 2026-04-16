"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, FolderKanban, CheckCircle2, Clock, Circle } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";
import ProgressRing from "@/components/portal/ProgressRing";
import ProjectTimeline from "@/components/portal/ProjectTimeline";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
}

export default function ProjectsPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch("/api/portal?action=get_milestones");
      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? "Error al cargar");
      }
      const result = (await res.json()) as { milestones: Milestone[] };
      setMilestones(result.milestones);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-electric-violet" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-pacame-white/60 font-body mb-4">{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchMilestones(); }}
          className="text-sm text-electric-violet font-body hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const completed = milestones.filter((m) => m.status === "completed").length;
  const inProgress = milestones.filter((m) => m.status === "in_progress").length;
  const pending = milestones.filter((m) => m.status === "pending").length;
  const total = milestones.length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const primaryColor =
    typeof document !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--client-primary").trim() || "#7C3AED"
      : "#7C3AED";

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-1">
          <FolderKanban className="w-6 h-6" style={{ color: primaryColor }} />
          <h1 className="font-heading font-bold text-2xl text-pacame-white">Proyectos</h1>
        </div>
        <p className="text-sm text-pacame-white/50 font-body">
          Seguimiento detallado de los hitos de tu proyecto
        </p>
      </ScrollReveal>

      {/* Stats + Progress */}
      <ScrollReveal delay={0.05}>
        <div className="bg-dark-card border border-white/[0.06] rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <ProgressRing
              percentage={completionPct}
              size={140}
              strokeWidth={9}
              color={primaryColor}
            />
            <div className="grid grid-cols-3 gap-6 flex-1">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-lime-pulse" />
                  <span className="font-heading font-bold text-xl text-lime-pulse">{completed}</span>
                </div>
                <p className="text-[11px] text-pacame-white/40 font-body">Completados</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4 text-olympus-gold" />
                  <span className="font-heading font-bold text-xl text-olympus-gold">{inProgress}</span>
                </div>
                <p className="text-[11px] text-pacame-white/40 font-body">En progreso</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Circle className="w-4 h-4 text-pacame-white/30" />
                  <span className="font-heading font-bold text-xl text-pacame-white/50">{pending}</span>
                </div>
                <p className="text-[11px] text-pacame-white/40 font-body">Pendientes</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Full timeline */}
      <ScrollReveal delay={0.1}>
        <div className="bg-dark-card border border-white/[0.06] rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-pacame-white mb-6">
            Linea de tiempo completa
          </h2>
          <ProjectTimeline milestones={milestones} primaryColor={primaryColor} />
        </div>
      </ScrollReveal>
    </div>
  );
}
