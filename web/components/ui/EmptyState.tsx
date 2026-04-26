import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  cta?: { label: string; href: string; icon?: LucideIcon } | null;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, cta, className }: Props) {
  return (
    <div
      className={cn(
        "bg-paper border-2 border-dashed border-ink/30 p-10 lg:p-12 text-center",
        className
      )}
    >
      <Icon className="w-10 h-10 mx-auto text-ink-mute/40 mb-4" aria-hidden />
      <h2 className="font-display text-ink text-xl mb-2" style={{ fontWeight: 500 }}>
        {title}
      </h2>
      {description && (
        <p className="font-sans text-ink-mute mb-5 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-paper text-[14px] font-sans hover:bg-terracotta-500 transition-colors"
        >
          {cta.icon && <cta.icon className="w-4 h-4" aria-hidden />}
          {cta.label}
        </Link>
      )}
    </div>
  );
}
