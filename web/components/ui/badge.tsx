import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium font-body transition-colors",
  {
    variants: {
      variant: {
        default: "bg-electric-violet/20 text-electric-violet border border-electric-violet/30",
        secondary: "bg-white/5 text-pacame-white/70 border border-white/10",
        outline: "border border-current text-current",
        success: "bg-lime-pulse/20 text-lime-pulse border border-lime-pulse/30",
        warning: "bg-amber-signal/20 text-amber-signal border border-amber-signal/30",
        cyan: "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
