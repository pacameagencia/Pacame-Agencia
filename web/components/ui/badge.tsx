import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium font-body transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand-primary/20 text-brand-primary border border-brand-primary/30",
        secondary: "bg-white/5 text-ink/70 border border-white/10",
        outline: "border border-current text-current",
        success: "bg-mint/20 text-mint border border-mint/30",
        warning: "bg-accent-gold/20 text-accent-gold border border-accent-gold/30",
        cyan: "bg-mint/20 text-mint border border-mint/30",
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
