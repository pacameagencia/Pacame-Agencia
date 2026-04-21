"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutProgressProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Sobre ti" },
  { number: 2, label: "Tu proyecto" },
  { number: 3, label: "Confirmacion" },
];

export default function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="w-full max-w-lg mx-auto mb-10">
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-5 left-[10%] right-[10%] h-px bg-white/[0.08]" />

        {/* Animated progress line */}
        <motion.div
          className="absolute top-5 left-[10%] h-px bg-accent-gold"
          initial={{ width: "0%" }}
          animate={{
            width:
              currentStep === 1
                ? "0%"
                : currentStep === 2
                  ? "40%"
                  : "80%",
          }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <div
              key={step.number}
              className="flex flex-col items-center relative z-10"
            >
              <motion.div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-heading font-semibold border-2 transition-colors duration-300",
                  isCompleted
                    ? "bg-accent-gold border-accent-gold text-ink"
                    : isActive
                      ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                      : "border-ink/[0.12] bg-paper-deep text-ink/30"
                )}
                animate={
                  isActive
                    ? { scale: [1, 1.08, 1] }
                    : { scale: 1 }
                }
                transition={
                  isActive
                    ? { duration: 0.4, ease: "easeOut" }
                    : { duration: 0.2 }
                }
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <Check className="w-5 h-5" strokeWidth={3} />
                  </motion.div>
                ) : (
                  step.number
                )}
              </motion.div>

              <motion.span
                className={cn(
                  "mt-2.5 text-xs font-body transition-colors duration-300",
                  isActive
                    ? "text-accent-gold font-medium"
                    : isCompleted
                      ? "text-ink/60"
                      : "text-ink/30"
                )}
                animate={isActive ? { y: [2, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                {step.label}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
