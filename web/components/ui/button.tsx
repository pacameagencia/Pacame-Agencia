import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium font-body transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-violet disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-electric-violet text-white hover:bg-electric-violet/90 shadow-glow-violet/30 hover:shadow-glow-violet",
        gradient:
          "bg-brand-gradient text-white hover:opacity-90 shadow-lg hover:shadow-glow-violet",
        outline:
          "border border-electric-violet/40 text-pacame-white bg-transparent hover:bg-electric-violet/10 hover:border-electric-violet",
        ghost:
          "text-pacame-white/70 hover:text-pacame-white hover:bg-white/5",
        secondary:
          "bg-dark-card border border-white/10 text-pacame-white hover:bg-white/5 hover:border-white/20",
        destructive:
          "bg-rose-alert text-white hover:bg-rose-alert/90",
        link:
          "text-electric-violet underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 px-8 py-3.5 text-base rounded-2xl",
        xl: "h-14 px-10 py-4 text-base rounded-2xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
