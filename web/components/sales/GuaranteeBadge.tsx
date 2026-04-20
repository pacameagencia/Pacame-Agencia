"use client";

import { Shield } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface GuaranteeBadgeProps {
  title: string;
  description: string;
}

export default function GuaranteeBadge({
  title,
  description,
}: GuaranteeBadgeProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="relative rounded-2xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 via-transparent to-accent-gold/5 p-8 sm:p-12 text-center"
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-gold/50 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-gold/50 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent-gold/50 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent-gold/50 rounded-br-2xl" />

          {/* Shield icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-accent-gold/10 flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-accent-gold" />
          </div>

          {/* Title */}
          <h3 className="font-heading font-bold text-2xl sm:text-3xl text-accent-gold mb-4">
            {title}
          </h3>

          {/* Description */}
          <p className="text-ink/70 font-body text-base leading-relaxed max-w-xl mx-auto">
            {description}
          </p>

          {/* Trust seal */}
          <div className="mt-6 inline-flex items-center gap-2 text-accent-gold/60 text-xs font-heading">
            <Shield className="w-3.5 h-3.5" />
            <span>100% sin riesgo para ti</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
