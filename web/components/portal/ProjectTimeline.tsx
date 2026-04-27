"use client";

import { CheckCircle2, Clock, Circle } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

interface Milestone {
  id?: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  due_date: string | null;
  completed_at: string | null;
}

interface ProjectTimelineProps {
  milestones: Milestone[];
  primaryColor?: string;
  className?: string;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    dotColor: "#16A34A",
    lineColor: "#16A34A",
    label: "Completado",
  },
  in_progress: {
    icon: Clock,
    dotColor: "#E8B730",
    lineColor: "#E8B730",
    label: "En progreso",
  },
  pending: {
    icon: Circle,
    dotColor: "#4B5563",
    lineColor: "#4B5563",
    label: "Pendiente",
  },
};

export default function ProjectTimeline({
  milestones,
  primaryColor = "#B54E30",
  className = "",
}: ProjectTimelineProps) {
  if (milestones.length === 0) {
    return (
      <div className="text-center py-12">
        <Circle className="w-10 h-10 text-ink/20 mx-auto mb-3" />
        <p className="text-sm text-ink/40 font-body">
          Aun no hay hitos de proyecto
        </p>
      </div>
    );
  }

  return (
    <StaggerContainer className={`relative ${className}`} staggerDelay={0.08}>
      {milestones.map((milestone, index) => {
        const config = statusConfig[milestone.status];
        const Icon = config.icon;
        const isLast = index === milestones.length - 1;

        return (
          <StaggerItem key={milestone.id ?? index}>
            <div className="flex gap-4 relative">
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center relative">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors"
                  style={{
                    borderColor: config.dotColor,
                    backgroundColor:
                      milestone.status === "completed"
                        ? `${config.dotColor}20`
                        : "transparent",
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: config.dotColor }}
                  />
                </div>
                {!isLast && (
                  <div
                    className="w-[2px] flex-1 min-h-[24px] my-1 rounded-full"
                    style={{
                      backgroundColor:
                        milestone.status === "completed"
                          ? `${config.lineColor}40`
                          : "rgba(255,255,255,0.06)",
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`pb-6 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className="font-heading font-semibold text-sm"
                      style={{
                        color:
                          milestone.status === "pending"
                            ? "rgba(245,245,247,0.4)"
                            : "#F5F5F7",
                      }}
                    >
                      {milestone.title}
                    </h3>
                    {milestone.description && (
                      <p className="text-xs text-ink/40 font-body mt-1 leading-relaxed">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-body font-medium flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${config.dotColor}20`,
                      color: config.dotColor,
                    }}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Date info */}
                <div className="flex items-center gap-3 mt-2">
                  {milestone.due_date && (
                    <span className="text-[11px] text-ink/30 font-body">
                      Fecha limite:{" "}
                      {new Date(milestone.due_date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  {milestone.completed_at && (
                    <span className="text-[11px] text-mint/60 font-body">
                      Completado:{" "}
                      {new Date(milestone.completed_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
