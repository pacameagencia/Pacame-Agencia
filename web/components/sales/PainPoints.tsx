"use client";

import {
  TrendingDown,
  Users,
  Clock,
  Ban,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import ScrollReveal, {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-reveal";

interface PainPoint {
  title: string;
  description: string;
  icon: string;
}

interface PainPointsProps {
  painPoints: PainPoint[];
}

const iconMap: Record<string, LucideIcon> = {
  TrendingDown,
  Users,
  Clock,
  Ban,
  BanknoteX: AlertTriangle,
  AlertTriangle,
};

export default function PainPoints({ painPoints }: PainPointsProps) {
  return (
    <section className="py-20 lg:py-28 bg-white/[0.02]">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-rose-alert/10 text-rose-alert text-xs font-heading font-semibold mb-4">
              El problema
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-pacame-white">
              Te suena esto?
            </h2>
            <p className="mt-4 text-pacame-white/50 font-body text-lg max-w-2xl mx-auto">
              Si te identificas con alguno de estos problemas, no estas solo. El
              80% de las PYMEs espanolas los sufren.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {painPoints.map((point) => {
            const Icon = iconMap[point.icon] || AlertTriangle;
            return (
              <StaggerItem key={point.title}>
                <div className="rounded-2xl bg-dark-card border border-rose-alert/10 hover:border-rose-alert/30 transition-colors p-6 h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-alert/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-rose-alert" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-lg text-pacame-white mb-2">
                        {point.title}
                      </h3>
                      <p className="text-pacame-white/50 font-body text-sm leading-relaxed">
                        {point.description}
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
